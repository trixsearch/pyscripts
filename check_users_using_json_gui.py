import customtkinter as ctk
import subprocess
import requests
import datetime
import threading
import base64
import time
import sys

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
        
        # Controls Area
        self.controls_frame = ctk.CTkFrame(self.dashboard_frame, corner_radius=10)
        self.controls_frame.pack(fill="x", pady=(0, 15), ipadx=10, ipady=10)

        # Container inside controls for layout
        self.input_container = ctk.CTkFrame(self.controls_frame, fg_color="transparent")
        self.input_container.pack(pady=10)

        self.single_user_entry = ctk.CTkEntry(self.input_container, placeholder_text="Enter AD Username (e.g., Vishal.Pal)", width=350, height=35)
        self.single_user_entry.bind("<Return>", lambda e: self.start_scan())
        
        self.start_btn = ctk.CTkButton(self.input_container, text="▶ INITIATE SCAN", font=("Segoe UI", 13, "bold"), fg_color="#28A745", hover_color="#218838", height=35, command=self.start_scan)
        
        # Scan Progress Bar
        self.scan_progress = ctk.CTkProgressBar(self.dashboard_frame, mode="indeterminate", height=4)
        self.scan_progress.set(0)
        self.scan_progress.pack(fill="x", pady=(0, 5))
        
        # Console Output Box
        self.console_box = ctk.CTkTextbox(self.dashboard_frame, font=("Consolas", 13), fg_color="#0D0D0D", text_color="#E0E0E0", state="disabled", corner_radius=10, border_width=1, border_color="#333333")
        self.console_box.pack(fill="both", expand=True)
        
        # Configure Color Tags for the terminal
        self.console_box.tag_config("match", foreground="#00FF00")    # Neon Green
        self.console_box.tag_config("error", foreground="#FF4C4C")    # Bright Red
        self.console_box.tag_config("header", foreground="#00A8E8")   # Cyan
        self.console_box.tag_config("neutral", foreground="#A0A0A0")  # Gray

        # --- LOGOUT BUTTON ---
        self.logout_btn = ctk.CTkButton(self.dashboard_frame, text="Log Out", fg_color="transparent", text_color="#A0A0A0", hover_color="#333333", border_width=1, border_color="#333333", width=100, command=self.logout)
        self.logout_btn.pack(pady=(10, 0), anchor="e") # anchor="e" aligns it to the East (Right)

        # Start initialization
        threading.Thread(target=self.fetch_config_thread, daemon=True).start()

    # ================= LOGIC & THREADS =================

    def log(self, text, tag=None):
        """Injects text into the console with optional color tags."""
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
            response = requests.get(GITHUB_URL)
            if response.status_code == 200:
                self.cloud_config = response.json()
                self.target_group = self.cloud_config.get("TARGET_GROUP")
                
                # Update UI safely
                self.loading_spinner.stop()
                self.loading_frame.pack_forget()
                self.login_frame.pack(pady=40, ipadx=20)
                
                self.password_entry.focus()
            else:
                self.loading_spinner.stop()
                self.loading_label.configure(text=f"❌ Connection Refused: HTTP {response.status_code}", text_color="#FF4C4C")
        except Exception as e:
            self.loading_spinner.stop()
            self.loading_label.configure(text=f"❌ Network Timeout: {e}", text_color="#FF4C4C")

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

        # Clear existing layout in the input container to prevent overlap if swapping roles
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
            
        # Clear the terminal screen for the new session
        self.console_box.configure(state="normal")
        self.console_box.delete("1.0", "end")
        self.console_box.configure(state="disabled")
        
        self.log(f"=== RelVm System Terminal [{self.access_level} PRIVILEGES] ===", "header")
        self.log("Module initialized. Awaiting parameters...\n", "neutral")

    def logout(self):
        """Clears the session and returns to the login screen."""
        # 1. Hide dashboard, show login
        self.dashboard_frame.pack_forget()
        self.login_frame.pack(pady=40, ipadx=20)
        
        # 2. Reset session variables
        self.access_level = None
        
        # 3. Clear inputs
        self.password_entry.delete(0, "end")
        self.single_user_entry.delete(0, "end")
        self.error_label.configure(text="")
        
        # 4. Stop any running UI tasks
        self.scan_progress.stop()
        self.start_btn.configure(state="normal", text="▶ INITIATE SCAN")
        self.single_user_entry.configure(state="normal")
        
        # 5. Set focus back to password
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

        # UI Lock during scan
        self.start_btn.configure(state="disabled", text="SCANNING...")
        if self.access_level == "USER":
            self.single_user_entry.configure(state="disabled")
            
        self.scan_progress.start()
        self.log(f">> Executing batch analysis on {len(users_to_check)} identities...", "header")
        
        threading.Thread(target=self.execute_ad_checks, args=(users_to_check,), daemon=True).start()

    def execute_ad_checks(self, user_list):
        resigned_users_found = []

        for username in user_list:
            try:
                result = subprocess.run(
                    ["net", "user", "/do", username],
                    capture_output=True,
                    text=True,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )

                if result.returncode != 0:
                    self.log(f"  [-] ERR: Profile unreachable -> {username}", "error")
                    continue

                if self.target_group in result.stdout:
                    self.log(f"  [+] DETECTED: {username} (Target Group Confirmed)", "match")
                    resigned_users_found.append(username)
                else:
                    self.log(f"  [ ] CLEARED: {username}", "neutral")

            except Exception as e:
                self.log(f"  [!] SYS_ERR on {username}: {e}", "error")

        # Post-Scan Summary
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

        # Unlock UI
        self.scan_progress.stop()
        self.start_btn.configure(state="normal", text="▶ INITIATE SCAN")
        if self.access_level == "USER":
            self.single_user_entry.configure(state="normal")
            self.single_user_entry.delete(0, "end") 
            self.single_user_entry.focus()

if __name__ == "__main__":
    app = RelVmApp()
    app.mainloop()