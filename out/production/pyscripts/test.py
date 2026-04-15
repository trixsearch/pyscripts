import customtkinter as ctk
import subprocess
import threading

# Set UI Theme
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

class CmdRunnerApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Simple CMD Runner")
        self.geometry("700x500")

        # --- Input Area (Top) ---
        self.input_frame = ctk.CTkFrame(self)
        self.input_frame.pack(pady=20, padx=20, fill="x")

        # Command Entry Box
        self.cmd_entry = ctk.CTkEntry(
            self.input_frame, 
            placeholder_text="Enter command here (e.g., ipconfig, dir, ping 8.8.8.8)", 
            font=("Consolas", 14)
        )
        self.cmd_entry.pack(side="left", expand=True, fill="x", padx=(10, 10), pady=10)
        
        # Bind the 'Enter' key so you don't always have to click the button
        self.cmd_entry.bind("<Return>", lambda event: self.start_command())

        # Submit Button
        self.submit_btn = ctk.CTkButton(
            self.input_frame, 
            text="Run", 
            width=80, 
            command=self.start_command
        )
        self.submit_btn.pack(side="right", padx=(0, 10))

        # --- Output Area (Bottom) ---
        self.output_box = ctk.CTkTextbox(
            self, 
            font=("Consolas", 13), 
            state="disabled" # Disabled so user can't manually type in the output area
        )
        self.output_box.pack(pady=(0, 20), padx=20, expand=True, fill="both")

    # --- Core Logic ---
    def start_command(self):
        """Prepares the UI and starts the background thread."""
        command = self.cmd_entry.get().strip()
        if not command:
            return # Do nothing if the box is empty

        # Clear the input box for the next command
        self.cmd_entry.delete(0, "end")
        
        # Print the command being run to the screen
        self.write_to_screen(f"\n> {command}\n")

        # Disable button while running to prevent spamming
        self.submit_btn.configure(state="disabled")

        # Run the command in a background thread so the GUI doesn't freeze
        threading.Thread(target=self.execute_cmd, args=(command,), daemon=True).start()

    def execute_cmd(self, command):
        """Runs the actual Windows command."""
        try:
            # shell=True is required to run built-in Windows commands like 'dir' or 'echo'
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                encoding='utf-8', 
                errors='replace' # Prevents crashes if Windows outputs weird characters
            )

            # Display the standard output
            if result.stdout:
                self.write_to_screen(result.stdout)
            
            # Display any error messages
            if result.stderr:
                self.write_to_screen(result.stderr)
                
        except Exception as e:
            self.write_to_screen(f"System Error: {e}\n")
        
        finally:
            # Re-enable the Run button when finished
            self.submit_btn.configure(state="normal")

    def write_to_screen(self, text):
        """Helper function to safely inject text into the GUI."""
        self.output_box.configure(state="normal")
        self.output_box.insert("end", text)
        self.output_box.see("end") # Auto-scroll to the bottom
        self.output_box.configure(state="disabled")

if __name__ == "__main__":
    app = CmdRunnerApp()
    app.mainloop()