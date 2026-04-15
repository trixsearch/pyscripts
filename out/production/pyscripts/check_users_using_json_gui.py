import customtkinter as ctk
from tkinter import messagebox
import subprocess
import requests
import datetime
import threading
import concurrent.futures
import base64
import time
import sys

# 🔥 1. APP VERSION CONSTANT 🔥
APP_VERSION = "1.0"

# --- BASE64 URL ---
p1 = "aHR0cHM6Ly9yYXcuZ2l0aHVi"
p2 = "dXNlcmNvbnRlbnQuY29tL3Ry"
p3 = "aXhzZWFyY2gvQ1BsdXNQbHVz"
p4 = "L3JlZnMvaGVhZHMvbWFzdGVy"
p5 = "L2Vudi91c2VyY2hlY2tsaXN0"
p6 = "Lmpzb24="

encoded = p1 + p2 + p3 + p4 + p5 + p6
GITHUB_URL = base64.b64decode(encoded).decode()

# Set UI Theme for a professional, sleek look
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

class RelVmApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # --- WINDOW SETUP ---
        self.title("RelVm - RIL InfoSec")
        self.geometry("800x700")
        self.minsize(700, 600)

        # State Variables
        self.cloud_config = None
        self.access_level = None
        self.target_group = None

        # Auto-Retry State
        self.retry_event_id = None
        self.countdown_time = 30

        # --- GLOBAL HEADER ---
        self.header_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.header_frame.pack(pady=(30, 10), fill="x")

        self.header = ctk.CTkLabel(self.header_frame, text="RelVmCheck", font=("Segoe UI", 32, "bold"), text_color="#00A8E8")
        self.header.pack()
        self.dev_tag = ctk.CTkLabel(self.header_frame, text="Reliance Jio Platforms Limited", font=("Segoe UI", 12), text_color="gray")
        self.dev_tag.pack()

        # --- 1. LOADING SCREEN ---
        self.loading_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.loading_frame.pack(pady=80, expand=True)

        self.loading_spinner = ctk.CTkProgressBar(self.loading_frame, width=300, mode="indeterminate")
        self.loading_spinner.pack(pady=(0, 20))
        self.loading_spinner.start()

        self.loading_label = ctk.CTkLabel(self.loading_frame, text="Establishing secure connection...", font=("Segoe UI", 14))
        self.loading_label.pack()

        # Retry Button (Hidden initially)
        self.retry_btn = ctk.CTkButton(
            self.loading_frame, text="↻ Retry Connection", font=("Segoe UI", 13, "bold"),
            fg_color="#007BFF", hover_color="#0056b3", width=200, height=35, command=self.manual_retry
        )

        # --- 2. LOGIN CARD (Hidden initially) ---
        self.login_frame = ctk.CTkFrame(self, corner_radius=15, width=400, border_width=1, border_color="#333333")

        self.login_label = ctk.CTkLabel(self.login_frame, text="System Authentication", font=("Segoe UI", 20, "bold"))
        self.login_label.pack(pady=(30, 5))

        self.login_subtext = ctk.CTkLabel(self.login_frame, text="Please enter your authorization key", font=("Segoe UI", 12), text_color="gray")
        self.login_subtext.pack(pady=(0, 20))

        self.password_entry = ctk.CTkEntry(self.login_frame, placeholder_text="Secret Key", show="•", width=280, height=40, font=("Segoe UI", 14))
        self.password_entry.pack(pady=10)
        self.password_entry.bind("<Return>", lambda e: self.verify_password())

        self.login_btn = ctk.CTkButton(self.login_frame, text="Authorize Access", font=("Segoe UI", 14, "bold"), height=40, width=280, command=self.verify_password)
        self.login_btn.pack(pady=(15, 10))

        self.error_label = ctk.CTkLabel(self.login_frame, text="", text_color="#FF5555", font=("Segoe UI", 12))
        self.error_label.pack(pady=(0, 20))

        # --- 3. DASHBOARD FRAME (Hidden initially) ---
        self.dashboard_frame = ctk.CTkFrame(self, fg_color="transparent")

        self.controls_frame = ctk.CTkFrame(self.dashboard_frame, corner_radius=10)
        self.controls_frame.pack(fill="x", pady=(0, 15), ipadx=10, ipady=10)

        self.input_container = ctk.CTkFrame(self.controls_frame, fg_color="transparent")
        self.input_container.pack(pady=10)

        self.single_user_entry = ctk.CTkEntry(self.input_container, placeholder_text="Enter AD Username (e.g., Vishal.Pal)", width=350, height=35)
        self.single_user_entry.bind("<Return>", lambda e: self.start_scan())

        self.start_btn = ctk.CTkButton(self.input_container, text="▶ INITIATE SCAN", font=("Segoe UI", 13, "bold"), fg_color="#28A745", hover_color="#218838", height=35, command=self.start_scan)

        self.scan_progress = ctk.CTkProgressBar(self.dashboard_frame, mode="indeterminate", height=4)
        self.scan_progress.set(0)
        self.scan_progress.pack(fill="x", pady=(0, 5))

        self.console_box = ctk.CTkTextbox(self.dashboard_frame, font=("Consolas", 13), fg_color="#0D0D0D", text_color="#E0E0E0", state="disabled", corner_radius=10, border_width=1, border_color="#333333")
        self.console_box.pack(fill="both", expand=True)

        self.console_box.tag_config("match", foreground="#00FF00")
        self.console_box.tag_config("error", foreground="#FF4C4C")
        self.console_box.tag_config("header", foreground="#00A8E8")
        self.console_box.tag_config("neutral", foreground="#A0A0A0")

        self.logout_btn = ctk.CTkButton(self.dashboard_frame, text="Log Out", fg_color="transparent", text_color="#A0A0A0", hover_color="#333333", border_width=1, border_color="#333333", width=100, command=self.logout)
        self.logout_btn.pack(pady=(10, 0), anchor="e")

        # Start initial network fetch
        threading.Thread(target=self.fetch_config_thread, daemon=True).start()

    # ================= LOGIC & THREADS =================

    def log(self, text, tag=None):
        self.console_box.configure(state="normal")
        if tag:
            self.console_box.insert("end", text + "\n", tag)
        else:
            self.console_box.insert("end", text + "\n")
        self.console_box.see("end")
        self.console_box.configure(state="disabled")

    def fetch_config_thread(self):
        try:
            time.sleep(1)

            url_with_nocache = f"{GITHUB_URL}?nocache={int(time.time() * 1000)}"
            headers = {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }

            response = requests.get(url_with_nocache, headers=headers, timeout=10) # Added 10s timeout

            if response.status_code == 200:
                self.cloud_config = response.json()
                self.after(0, self.handle_version_and_login)
            else:
                self.after(0, lambda: self.trigger_network_error(f"HTTP {response.status_code}"))
        except Exception as e:
            self.after(0, lambda: self.trigger_network_error("Offline / VPN Disconnected"))

    # 🔥 NEW AUTO-RETRY LOGIC 🔥
    def trigger_network_error(self, error_msg):
        self.loading_spinner.stop()
        self.retry_btn.pack(pady=(15, 0)) # Show the manual retry button

        self.countdown_time = 30
        self.update_error_countdown(error_msg)

    def update_error_countdown(self, base_msg):
        if self.countdown_time > 0:
            self.loading_label.configure(
                text=f"❌ Connection Refused: {base_msg}\n\nAuto-retrying in {self.countdown_time} seconds...",
                text_color="#FF4C4C"
            )
            self.countdown_time -= 1
            # Schedule the next countdown tick and save its ID
            self.retry_event_id = self.after(1000, lambda: self.update_error_countdown(base_msg))
        else:
            # Time is up, automatically retry
            self.manual_retry()

    def manual_retry(self):
        # Prevent overlapping loops if user clicks the button while countdown is running
        if self.retry_event_id:
            self.after_cancel(self.retry_event_id)
            self.retry_event_id = None

        self.retry_btn.pack_forget() # Hide button again
        self.loading_label.configure(text="Re-establishing secure connection...", text_color="#E0E0E0")
        self.loading_spinner.start()

        # Fire off a fresh background thread
        threading.Thread(target=self.fetch_config_thread, daemon=True).start()

    def handle_version_and_login(self):
        # Cancel any lingering retry events just to be safe
        if self.retry_event_id:
            self.after_cancel(self.retry_event_id)
            self.retry_event_id = None

        self.target_group = self.cloud_config.get("TARGET_GROUP")
        version_control = self.cloud_config.get("VERSION_CONTROL")

        if version_control and APP_VERSION in version_control:
            version_data = version_control[APP_VERSION]
            is_allowed = version_data.get("allowed", False)
            message = version_data.get("message", "No message provided.")

            if not is_allowed:
                self.loading_spinner.stop()
                messagebox.showerror("Version Deprecated", message)
                sys.exit(0)
            else:
                messagebox.showinfo("Update Notice", message)
        else:
            messagebox.showwarning("Warning", f"Unrecognized Script Version ({APP_VERSION}). Proceed with caution.")

        # Transition to Login Screen
        self.loading_spinner.stop()
        self.loading_frame.pack_forget()
        self.login_frame.pack(pady=40, ipadx=20)
        self.password_entry.focus()

    def verify_password(self):
        self.error_label.configure(text="")
        entered_pwd = self.password_entry.get()
        admin_pwd = self.cloud_config.get("ADMIN_PASSWORD")
        user_pwd = self.cloud_config.get("USER_PASSWORD")

        if entered_pwd == admin_pwd:
            self.access_level = "ADMIN"
            self.setup_dashboard()
        elif entered_pwd == user_pwd:
            self.access_level = "USER"
            self.setup_dashboard()
        else:
            self.error_label.configure(text="❌ Invalid authorization key.")
            self.password_entry.delete(0, "end")

    def setup_dashboard(self):
        self.login_frame.pack_forget()
        self.dashboard_frame.pack(fill="both", expand=True, padx=30, pady=(0, 20))

        self.single_user_entry.pack_forget()
        self.start_btn.pack_forget()

        if self.access_level == "USER":
            self.single_user_entry.pack(side="left", padx=(0, 10))
            self.start_btn.configure(width=140)
            self.start_btn.pack(side="right")
            self.single_user_entry.focus()
        else:
            self.start_btn.configure(width=250)
            self.start_btn.pack(side="top")

        self.console_box.configure(state="normal")
        self.console_box.delete("1.0", "end")
        self.console_box.configure(state="disabled")

        self.log(f"=== RelVm System Terminal [{self.access_level} PRIVILEGES] ===", "header")
        self.log("Module initialized. Awaiting parameters...\n", "neutral")

    def logout(self):
        self.dashboard_frame.pack_forget()
        self.login_frame.pack(pady=40, ipadx=20)
        self.access_level = None
        self.password_entry.delete(0, "end")
        self.single_user_entry.delete(0, "end")
        self.error_label.configure(text="")
        self.scan_progress.stop()
        self.start_btn.configure(state="normal", text="▶ INITIATE SCAN")
        self.single_user_entry.configure(state="normal")
        self.password_entry.focus()

    def start_scan(self):
        users_to_check = []

        if self.access_level == "ADMIN":
            raw_users = self.cloud_config.get("USER_LIST", "")
            users_to_check = [u.strip() for u in raw_users.split(",") if u.strip()]
            if not users_to_check:
                self.log(">> CRITICAL: User dataset is empty.", "error")
                return
        elif self.access_level == "USER":
            single_user = self.single_user_entry.get().strip().title()
            if not single_user:
                self.log(">> Warning: Target username required.", "error")
                return
            users_to_check = [single_user]

        self.start_btn.configure(state="disabled", text="SCANNING...")
        if self.access_level == "USER":
            self.single_user_entry.configure(state="disabled")

        self.scan_progress.start()
        self.log(f">> Executing batch analysis on {len(users_to_check)} identities utilizing 15 concurrent threads...", "header")

        threading.Thread(target=self.execute_ad_checks, args=(users_to_check,), daemon=True).start()

    def check_single_ad_user(self, username):
        try:
            result = subprocess.run(
                ["net", "user", "/do", username],
                capture_output=True,
                text=True,
                creationflags=subprocess.CREATE_NO_WINDOW
            )

            if result.returncode != 0:
                return username, "error", f"  [-] ERR: Profile unreachable -> {username}"

            if self.target_group in result.stdout:
                return username, "match", f"  [+] DETECTED: {username} (Target Group Confirmed)"
            else:
                return username, "neutral", f"  [ ] CLEARED: {username}"

        except Exception as e:
            return username, "error", f"  [!] SYS_ERR on {username}: {e}"

    def execute_ad_checks(self, user_list):
        resigned_users_found = []
        MAX_THREADS = 15

        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
            future_to_user = {executor.submit(self.check_single_ad_user, username): username for username in user_list}

            for future in concurrent.futures.as_completed(future_to_user):
                try:
                    username, status, log_message = future.result()
                    self.log(log_message, status)

                    if status == "match":
                        resigned_users_found.append(username)
                except Exception as exc:
                    self.log(f"  [!] Thread generated an exception: {exc}", "error")

        self.log("\n" + "="*50, "header")
        self.log("ANALYSIS REPORT COMPLETED", "header")
        self.log("="*50, "header")

        if resigned_users_found:
            self.log(f"Total Matches Found: {len(resigned_users_found)}", "match")
            for u in resigned_users_found:
                self.log(f" -> {u}", "match")
        else:
            self.log("Status: 0 anomalies detected in this batch.", "neutral")

        self.log(f"\n[Timestamp: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]", "neutral")

        self.after(0, self.unlock_ui_post_scan)

    def unlock_ui_post_scan(self):
        self.scan_progress.stop()
        self.start_btn.configure(state="normal", text="▶ INITIATE SCAN")
        if self.access_level == "USER":
            self.single_user_entry.configure(state="normal")
            self.single_user_entry.delete(0, "end")
            self.single_user_entry.focus()

if __name__ == "__main__":
    app = RelVmApp()
    app.mainloop()