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
from pystray import Icon as TrayIcon, Menu as TrayMenu, MenuItem as TrayMenuItem
from PIL import Image, ImageDraw

# --- GLOBAL STATE ---
websocket_thread = None
websocket_server = None
event_loop = None
config = {}
CONFIG_FILE = "config.json"

# --- CONFIGURATION MANAGEMENT ---
def load_config():
    """Loads configuration from a JSON file."""
    global config
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
        else:
            # Default configuration
            config = {"port": 8765, "start_on_boot": False}
    except Exception as e:
        print(f"Error loading config: {e}")
        config = {"port": 8765, "start_on_boot": False}

def save_config():
    """Saves configuration to a JSON file."""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=4)
    except Exception as e:
        print(f"Error saving config: {e}")

# --- ICON CREATION ---
def create_image(width, height, color1, color2):
    """Generates an image for the tray icon."""
    image = Image.new('RGB', (width, height), color1)
    dc = ImageDraw.Draw(image)
    dc.rectangle((width // 2, 0, width, height // 2), fill=color2)
    dc.rectangle((0, height // 2, width // 2, height), fill=color2)
    return image

# --- CONFIGURATION WINDOW ---
def show_config_window():
    """Displays the configuration window using Tkinter."""
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
def on_restart():
    """Restarts the application."""
    print("Action: Restarting application.")
    on_quit()

def on_quit(icon=None, item=None):
    """Stops the server and exits the application."""
    print("Action: Quitting application.")
    global event_loop, websocket_server
    if event_loop and websocket_server:
        print("Stopping websocket server...")
        event_loop.call_soon_threadsafe(websocket_server.close)
        event_loop.call_soon_threadsafe(event_loop.stop)
    if icon:
        icon.stop()
    sys.exit(0)

# --- WEBSOCKET SERVER LOGIC (remains unchanged) ---
# ... (execute_pc_command and other functions are here)
BASE_PATH = os.path.dirname(os.path.abspath(__file__))
NIRCMD_PATH = os.path.join(BASE_PATH, 'scripts', 'nircmd.exe')
SCRIPTS_PATH = os.path.join(BASE_PATH, 'scripts')

ALLOWED_COMMANDS = ["start", "curl"]

def execute_pc_command(action):
    command_type = action.get("type")
    
    if not command_type:
        return {"status": "error", "message": "No command type specified."}

    try:
        final_command = []

        if command_type == "command":
            command = action.get("command")
            args = action.get("args", [])
            if command in ALLOWED_COMMANDS:
                final_command = [command] + args
            elif command.startswith("nircmd"):
                if not os.path.exists(NIRCMD_PATH):
                    return {"status": "error", "message": f"nircmd.exe not found at {NIRCMD_PATH}"}
                nircmd_args = command.split(" ")[1:]
                final_command = [NIRCMD_PATH] + nircmd_args
            else:
                return {"status": "error", "message": f"Command '{command}' is not allowed."}

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
                script_path = os.path.join(SCRIPTS_PATH, script_name)
                final_command = ["powershell.exe", "-ExecutionPolicy", "Bypass", "-File", script_path, "-FilePath", file_path]
            elif audio_action in ["stop", "stop_all"]:
                script_name = f"{audio_action}-audio.ps1"
                script_path = os.path.join(SCRIPTS_PATH, script_name)
                final_command = ["powershell.exe", "-ExecutionPolicy", "Bypass", "-File", script_path]

        else:
            return {"status": "error", "message": f"Unknown command type '{command_type}'."}

        if final_command:
            subprocess.Popen(final_command, shell=True)
            return {"status": "success", "message": f"Action '{command_type}' executed."}
        else:
            return {"status": "error", "message": "Command could not be constructed."}

    except Exception as e:
        return {"status": "error", "message": f"Failed to execute command: {e}"}

async def handler(websocket, path):
    print(f"Client connected from {websocket.remote_address}")
    try:
        async for message in websocket:
            print(f"Received message: {message}")
            try:
                data = json.loads(message)
                result = execute_pc_command(data)
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
    print(f"Starting websocket server on localhost:{port}...")
    server = await websockets.serve(handler, "localhost", port)
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
    #icon_image = create_image(64, 64, 'black', 'gray')
    icon_image = Image.open(os.path.join(BASE_PATH, 'ControlPad-Server.ico'))
    menu = TrayMenu(
        TrayMenuItem('Configuration', show_config_window),
        TrayMenuItem('Restart', on_restart),
        TrayMenuItem('Quit', on_quit)
    )
    icon = TrayIcon("ControlPadServer", icon_image, "Control Pad Server", menu)
    
    print("Running system tray icon.")
    icon.run()
