# server-pc/main.py
import asyncio
import websockets
import json
import subprocess
import os
import sys
import threading
import tkinter as tk
from tkinter import ttk, messagebox
import psutil
from pystray import Icon as TrayIcon, Menu as TrayMenu, MenuItem as TrayMenuItem
from PIL import Image, ImageDraw
import winreg
import win32event
import win32api
import ctypes
import tempfile
from winerror import ERROR_ALREADY_EXISTS

# --- RESOURCE HELPER ---
def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_path, relative_path)

def get_startup_info():
    """Returns startup info to hide console window for subprocesses on Windows."""
    if sys.platform == 'win32':
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = subprocess.SW_HIDE
        return startupinfo
    return None

# --- GLOBAL STATE ---
websocket_thread = None
websocket_server = None
event_loop = None
icon_instance = None
config = {}

# Paths
if sys.platform == 'win32':
    appdata = os.getenv('APPDATA')
    CONFIG_DIR = os.path.join(appdata, 'ControlPadServer')
else:
    CONFIG_DIR = os.path.join(os.path.expanduser('~'), '.config', 'ControlPadServer')

if not os.path.exists(CONFIG_DIR):
    os.makedirs(CONFIG_DIR)

CONFIG_FILE = os.path.join(CONFIG_DIR, 'config.json')
SCRIPTS_PATH = resource_path('scripts')
NIRCMD_PATH = os.path.join(SCRIPTS_PATH, 'nircmd.exe')
ICON_PATH = resource_path('ControlPad-Server.ico')

should_restart = False

# --- CONFIGURATION MANAGEMENT ---
def load_config():
    """Loads configuration from a JSON file."""
    global config
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
        else:
            config = {"port": 8765, "start_on_boot": False}
    except Exception as e:
        print(f"Error loading config: {e}")
        config = {"port": 8765, "start_on_boot": False}

def save_config():
    """Saves configuration to a JSON file and updates boot settings."""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=4)
        update_boot_setting()
    except Exception as e:
        print(f"Error saving config: {e}")

def update_boot_setting():
    """Updates the Windows Registry to start the app on boot."""
    app_path = sys.executable if getattr(sys, 'frozen', False) else os.path.abspath(__file__)
    if not getattr(sys, 'frozen', False):
        app_path = f'"{sys.executable}" "{app_path}"'
    else:
        app_path = f'"{app_path}"'

    key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
    app_name = "ControlPadServer"

    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE)
        if config.get("start_on_boot", False):
            winreg.SetValueEx(key, app_name, 0, winreg.REG_SZ, app_path)
            print("Added to startup.")
        else:
            try:
                winreg.DeleteValue(key, app_name)
                print("Removed from startup.")
            except FileNotFoundError:
                pass
        winreg.CloseKey(key)
    except Exception as e:
        print(f"Failed to update boot setting: {e}")

# --- ICON CREATION ---
def create_image(width, height, color1, color2):
    image = Image.new('RGB', (width, height), color1)
    dc = ImageDraw.Draw(image)
    dc.rectangle((width // 2, 0, width, height // 2), fill=color2)
    dc.rectangle((0, height // 2, width // 2, height), fill=color2)
    return image

# --- CONFIGURATION WINDOW ---
def show_config_window():
    def on_save():
        try:
            new_port = int(port_var.get())
            if 1024 <= new_port <= 65535:
                config['port'] = new_port
                config['start_on_boot'] = boot_var.get()
                save_config()
                messagebox.showinfo("Success", "Configuration saved. Please restart the application for changes to take effect.")
                window.destroy()
            else:
                messagebox.showerror("Error", "Port must be between 1024 and 65535.")
        except ValueError:
            messagebox.showerror("Error", "Invalid port number.")

    window = tk.Tk()
    window.title("Server Configuration")
    
    # Set icon
    if os.path.exists(ICON_PATH):
        try:
            window.iconbitmap(ICON_PATH)
        except Exception:
            pass

    # Position window (Bottom Right, adjusted)
    window.update_idletasks()
    width = 350
    height = 150
    screen_width = window.winfo_screenwidth()
    screen_height = window.winfo_screenheight()

    # Taskbar height estimation + margin
    x = screen_width - width - 100
    y = screen_height - height - 200

    window.geometry(f'{width}x{height}+{x}+{y}')

    ttk.Label(window, text="Server Port:").grid(row=0, column=0, padx=10, pady=5, sticky="w")
    port_var = tk.StringVar(value=str(config.get('port', 8765)))
    ttk.Entry(window, textvariable=port_var).grid(row=0, column=1, padx=10, pady=5)

    boot_var = tk.BooleanVar(value=config.get('start_on_boot', False))
    ttk.Checkbutton(window, text="Start on Windows boot", variable=boot_var).grid(row=1, columnspan=2, padx=10, pady=5, sticky="w")

    ttk.Button(window, text="Save", command=on_save).grid(row=2, columnspan=2, pady=10)
    window.mainloop()

# --- TRAY MENU ACTIONS ---
def on_restart(icon, item):
    global should_restart
    print("Action: Restarting application.")
    should_restart = True
    icon.stop()

def on_quit(icon, item):
    print("Action: Quitting application.")
    icon.stop()

# --- COMMAND EXECUTION ---
ALLOWED_COMMANDS = ["start", "curl"]

def get_cpu_usage():
    try:
        return {"status": "success", "value": psutil.cpu_percent(interval=None)}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def get_ram_usage():
    try:
        return {"status": "success", "value": psutil.virtual_memory().percent}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def get_gpu_usage(query):
    try:
        cmd = ['nvidia-smi', f'--query-gpu={query}', '--format=csv,noheader,nounits']
        result = subprocess.check_output(cmd, encoding='utf-8', startupinfo=get_startup_info()).strip()
        try:
            val = float(result)
            return {"status": "success", "value": val}
        except ValueError:
            return {"status": "success", "value": result}
    except FileNotFoundError:
         return {"status": "error", "message": "nvidia-smi not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def execute_pc_command(action):
    command_type = action.get("type")
    
    if not command_type:
        return {"status": "error", "message": "No command type specified."}

    try:
        final_command = []

        if command_type == "command":
            command = action.get("command")
            args = action.get("args", [])

            if command == "nircmd.exe":
                if not os.path.exists(NIRCMD_PATH):
                    return {"status": "error", "message": f"nircmd.exe not found at {NIRCMD_PATH}"}
                final_command = [NIRCMD_PATH] + args
            elif command in ALLOWED_COMMANDS:
                final_command = [command] + args
            else:
                 if command.startswith("nircmd"):
                     parts = command.split(" ")
                     final_command = [NIRCMD_PATH] + parts[1:]
                 else:
                     final_command = [command] + args

        elif command_type == "shortcut":
            shortcut = action.get("shortcut")
            script_path = os.path.join(SCRIPTS_PATH, 'simulate-shortcut.ps1')
            final_command = ["powershell.exe", "-ExecutionPolicy", "Bypass", "-File", script_path, "-Shortcut", shortcut]

        elif command_type == "audio":
            audio_action = action.get("audio_action")
            script_name = ""
            if audio_action == "play":
                script_name = "play-audio.ps1"
                file_path = action.get("file_path")
                if not file_path:
                     return {"status": "error", "message": "Missing file_path for play audio"}
                script_path = os.path.join(SCRIPTS_PATH, script_name)
                final_command = ["powershell.exe", "-ExecutionPolicy", "Bypass", "-File", script_path, "-FilePath", file_path]
            elif audio_action == "stop":
                 script_path = os.path.join(SCRIPTS_PATH, 'stop-audio.ps1')
                 final_command = ["powershell.exe", "-ExecutionPolicy", "Bypass", "-File", script_path]
            elif audio_action == "stop_all":
                 script_path = os.path.join(SCRIPTS_PATH, 'stop-all-audio.ps1')
                 final_command = ["powershell.exe", "-ExecutionPolicy", "Bypass", "-File", script_path]
            else:
                return {"status": "error", "message": f"Unknown audio action '{audio_action}'"}

        elif command_type == "volume":
            value = action.get("value")
            cmd = [NIRCMD_PATH, "setsysvolume", str(value)]
            subprocess.Popen(cmd, startupinfo=get_startup_info())
            return {"status": "success", "message": f"Volume set to {value}"}

        elif command_type == "get_cpu":
            return get_cpu_usage()
        elif command_type == "get_ram":
            return get_ram_usage()
        elif command_type == "get_gpu":
             return get_gpu_usage('utilization.gpu')
        elif command_type == "get_vram_percent":
             res = get_gpu_usage('memory.used,memory.total')
             if res['status'] == 'success':
                 try:
                    used, total = map(float, res['value'].split(','))
                    pct = (used/total) * 100
                    return {"status": "success", "value": round(pct, 1)}
                 except:
                    return {"status": "error", "message": "Parse error"}
             return res
        elif command_type == "get_vram_gb":
             res = get_gpu_usage('memory.used')
             if res['status'] == 'success':
                 try:
                    val = float(res['value']) / 1024
                    return {"status": "success", "value": round(val, 2)}
                 except:
                    return {"status": "error", "message": "Parse error"}
             return res

        elif command_type == "restart_server":
            global should_restart
            should_restart = True
            if icon_instance:
                icon_instance.stop()
            return {"status": "success", "message": "Restarting..."}

        elif command_type == "stop_server":
             if icon_instance:
                 icon_instance.stop()
             return {"status": "success", "message": "Stopping..."}

        else:
            return {"status": "error", "message": f"Unknown command type '{command_type}'."}

        if final_command:
            if final_command[0] == "start":
                 os.startfile(final_command[1])
            else:
                 subprocess.Popen(final_command, shell=False, startupinfo=get_startup_info())
            return {"status": "success", "message": f"Action '{command_type}' executed."}

    except Exception as e:
        return {"status": "error", "message": f"Failed to execute command: {e}"}

async def handler(websocket):
    print(f"Client connected from {websocket.remote_address}")
    try:
        async for message in websocket:
            print(f"Received: {message}")
            try:
                data = json.loads(message)
                result = execute_pc_command(data)
                if "id" in data:
                    result["id"] = data["id"]
                await websocket.send(json.dumps(result))
            except json.JSONDecodeError:
                await websocket.send(json.dumps({"status": "error", "message": "Invalid JSON format."}))
    except websockets.exceptions.ConnectionClosed:
        print(f"Client disconnected.")
    except Exception as e:
        print(f"An error occurred in handler: {e}")

async def start_websocket_server():
    global websocket_server
    port = config.get("port", 8765)
    print(f"Starting websocket server on 0.0.0.0:{port}...")
    server = await websockets.serve(handler, "0.0.0.0", port)
    websocket_server = server
    await server.wait_closed()

def run_server_in_thread():
    global event_loop
    event_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(event_loop)
    event_loop.run_until_complete(start_websocket_server())
    event_loop.close()

# --- MAIN EXECUTION ---
if __name__ == "__main__":
    # Set App ID for Taskbar Icon
    try:
        myappid = 'cedricpaladjian.controlpad.server.1.0'
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
    except Exception:
        pass

    # Single Instance Check
    mutex = win32event.CreateMutex(None, False, "Global\\ControlPadServerMutex")
    if win32api.GetLastError() == ERROR_ALREADY_EXISTS:
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror("Control Pad Server", "An instance is already running.")
        sys.exit(0)

    load_config()

    # Start the WebSocket server in a separate thread
    websocket_thread = threading.Thread(target=run_server_in_thread, daemon=True)
    websocket_thread.start()

    # Create and run the system tray icon
    if os.path.exists(ICON_PATH):
        icon_image = Image.open(ICON_PATH)
    else:
        icon_image = create_image(64, 64, 'black', 'white')

    menu = TrayMenu(
        TrayMenuItem('Configuration', show_config_window),
        TrayMenuItem('Restart', on_restart),
        TrayMenuItem('Quit', on_quit)
    )
    icon = TrayIcon("ControlPadServer", icon_image, "Control Pad Server", menu)
    icon_instance = icon
    
    print("Running system tray icon.")
    icon.run()

    # --- SHUTDOWN SEQUENCE ---
    print("Stopping application...")

    if event_loop and websocket_server:
        print("Stopping websocket server...")
        try:
            # Just close the server, this will unblock wait_closed() and finish the thread
            event_loop.call_soon_threadsafe(websocket_server.close)
        except Exception as e:
            print(f"Error stopping websocket server: {e}")

    # Wait for thread to finish
    if websocket_thread and websocket_thread.is_alive():
        try:
            websocket_thread.join(timeout=3)
        except Exception as e:
            print(f"Error joining thread: {e}")

    if should_restart:
        print("Re-launching...")

        # Release mutex explicitly
        try:
            win32api.CloseHandle(mutex)
        except Exception as e:
            print(f"Error closing mutex: {e}")

        try:
            # Prepare environment: Remove PyInstaller's _MEIPASS2 to avoid conflicts in new process
            env = os.environ.copy()
            if '_MEIPASS2' in env:
                del env['_MEIPASS2']

            if getattr(sys, 'frozen', False):
                # Frozen Mode (PyInstaller): Use a temporary batch file to restart
                exe_path = sys.executable
                args = " ".join(f'"{a}"' for a in sys.argv[1:])

                fd, bat_path = tempfile.mkstemp(suffix='.bat', text=True)
                os.close(fd)

                with open(bat_path, 'w') as f:
                    f.write('@echo off\n')
                    f.write('set _MEIPASS2=\n') # Force clear PyInstaller env var
                    f.write('timeout /t 4 /nobreak > NUL\n')
                    f.write(f'start "" "{exe_path}" {args}\n')
                    f.write('(goto) 2>nul & del "%~f0"\n')
                    f.write('exit\n')

                # Launch batch file hidden with clean env
                subprocess.Popen(bat_path, shell=True, startupinfo=get_startup_info(), env=env)
            else:
                # Script Mode
                subprocess.Popen([sys.executable] + sys.argv, env=env)
        except Exception as e:
            print(f"Failed to restart: {e}")

    sys.exit(0)
