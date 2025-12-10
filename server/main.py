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

# --- GLOBAL STATE ---
websocket_thread = None
websocket_server = None
event_loop = None
icon_instance = None
config = {}
BASE_PATH = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_PATH, "config.json")
SCRIPTS_PATH = os.path.join(BASE_PATH, 'scripts')
NIRCMD_PATH = os.path.join(SCRIPTS_PATH, 'nircmd.exe')

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
        result = subprocess.check_output(cmd, encoding='utf-8').strip()
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
            subprocess.Popen(cmd)
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
                 subprocess.Popen(final_command, shell=False)
            return {"status": "success", "message": f"Action '{command_type}' executed."}

    except Exception as e:
        return {"status": "error", "message": f"Failed to execute command: {e}"}

async def handler(websocket, path):
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
    load_config()

    # Start the WebSocket server in a separate thread
    websocket_thread = threading.Thread(target=run_server_in_thread, daemon=True)
    websocket_thread.start()

    # Create and run the system tray icon
    icon_path = os.path.join(BASE_PATH, 'ControlPad-Server.ico')
    if os.path.exists(icon_path):
        icon_image = Image.open(icon_path)
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
            event_loop.call_soon_threadsafe(websocket_server.close)
            event_loop.call_soon_threadsafe(event_loop.stop)
        except Exception as e:
            print(f"Error stopping event loop: {e}")

    if should_restart:
        print("Re-launching...")
        try:
            if getattr(sys, 'frozen', False):
                os.execl(sys.executable, sys.executable, *sys.argv[1:])
            else:
                os.execl(sys.executable, sys.executable, *sys.argv)
        except Exception as e:
            print(f"Failed to restart: {e}")

    sys.exit(0)
