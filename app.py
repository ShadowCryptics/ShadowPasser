import sys
import threading
import socketserver
import http.server
import socket
import colorama
from colorama import Fore, Style
import os
import pyperclip  
import keyboard  
import time

colorama.init()

BLOCKED_HOST = "service-fb-examly-io-7tvaoi4e5q-uk.a.run.app"
PORT = 8055
BUFFER_SIZE = 65536

def relay_data(src, dst):
    try:
        while True:
            data = src.recv(BUFFER_SIZE)
            if not data:
                break
            dst.sendall(data)
    except Exception:
        pass
    finally:
        src.close()
        dst.close()

def handle_tcp_connection(client_sock, remote_sock):
    client_thread = threading.Thread(target=relay_data, args=(client_sock, remote_sock), daemon=True)
    remote_thread = threading.Thread(target=relay_data, args=(remote_sock, client_sock), daemon=True)
    client_thread.start()
    remote_thread.start()
    client_thread.join()
    remote_thread.join()

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_CONNECT(self):
        host, port = self.path.rsplit(":", 1)
        port = int(port)
        if BLOCKED_HOST in host:
            self.send_error(403, "Forbidden: Blocked by NeoBypasser")
            return
        try:
            remote_socket = socket.create_connection((host, port))
            self.send_response(200, "Connection Established")
            self.end_headers()
            handle_tcp_connection(self.connection, remote_socket)
        except Exception:
            self.send_error(502, "Bad Gateway: Unable to connect")
    
    def log_message(self, format, *args):
        return  

running = False  

def paste_clipboard():
    global running
    if running:
        return  

    running = True  
    text = pyperclip.paste()
    keyboard.write(text)
    
    running = False  

def monitor_keyboard():
    keyboard.add_hotkey("ctrl+i", paste_clipboard)
    keyboard.press_and_release("ctrl")

def run_proxy():
    server_address = ('', PORT)
    httpd = socketserver.ThreadingTCPServer(server_address, ProxyHandler)
    os.system('cls' if os.name == 'nt' else 'clear')  # Clear terminal screen
    print(Fore.GREEN +"""\n
        ░█▄ ░█ █▀▀ █▀▀█ ░█▀▀█ █  █ █▀▀█ █▀▀█ █▀▀ █▀▀ █▀▀ █▀▀█ 
        ░█░█░█ █▀▀ █  █ ░█▀▀▄ █▄▄█ █  █ █▄▄█ ▀▀█ ▀▀█ █▀▀ █▄▄▀ 
        ░█  ▀█ ▀▀▀ ▀▀▀▀ ░█▄▄█ ▄▄▄█ █▀▀▀ ▀  ▀ ▀▀▀ ▀▀▀ ▀▀▀ ▀ ▀▀
            """)

    print(Fore.CYAN + Style.BRIGHT + "                             Developed By ShadowCryptics " + Style.RESET_ALL)
    print("\n")
    print(Fore.RED + Style.BRIGHT + "[+] Allows students to switch tabs during tests in the IAMNEO platform." + Style.RESET_ALL)

    print(Fore.GREEN + f"[+] NeoBypasser is running on port {PORT}... \n" + Style.RESET_ALL)
    print(Fore.YELLOW + "[!] Instructions: Set your proxy settings to 127.0.0.1 with port 8055 to enable bypassing." + Style.RESET_ALL)

    print(Fore.YELLOW + f"    Press CTRL+I to paste the code. \n")
    print(Fore.LIGHTMAGENTA_EX + "⯈ " + Style.BRIGHT + "Visit: " + Fore.CYAN + "https://rmk685.examly.io/" + Style.RESET_ALL + " to take the tests.")
    print("\n")
    
    keyboard_thread = threading.Thread(target=monitor_keyboard, daemon=True)
    keyboard_thread.start()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        os._exit(0) 

if __name__ == "__main__":
    run_proxy()



    
