import subprocess
import requests
import datetime
import getpass
import sys
import base64
import time
import concurrent.futures # <-- Imported for Multithreading

# 🔥 Hardcode the script's version here for Version Control 🔥
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


# ================= NETWORK CHECK =================
ALLOWED_GATEWAY = "10.14.128.1"
ALLOWED_DOMAIN = "in.ril.com"

def check_office_network():
    try:
        result = subprocess.run(
            ["ipconfig", "/all"],
            capture_output=True,
            text=True
        )

        output = result.stdout

        if ALLOWED_GATEWAY in output and ALLOWED_DOMAIN in output:
            return True
        else:
            return False

    except Exception as e:
        print("Network check failed:", e)
        return False


# ================= CLOUD CONFIG & CACHE BUSTER =================
def get_config_from_github():
    print("Fetching license data & security config...")
    try:
        # 1. URL Cache Buster
        url_with_nocache = f"{GITHUB_URL}?nocache={int(time.time() * 1000)}"

        # 2. Enterprise Proxy Cache Buster (HTTP Headers)
        headers = {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }

        # Send request with headers
        response = requests.get(url_with_nocache, headers=headers)

        if response.status_code == 200:
            return response.json()
        else:
            print("Error reaching code:", response.status_code)
            return None

    except Exception as e:
        print("Connection Error:", e)
        return None

# ================= VERSION CONTROL LOGIC =================
def check_script_version(config):
    version_control = config.get("VERSION_CONTROL")

    if version_control:
        if APP_VERSION in version_control:
            version_data = version_control[APP_VERSION]

            is_allowed = version_data.get("allowed", False)
            message = version_data.get("message", "No message provided.")

            print("-" * 60)
            print(message)
            print("-" * 60 + "\n")

            if not is_allowed:
                print("Execution blocked due to version deprecation.")
                input("Press Enter to exit...")
                sys.exit(0)
        else:
            print(f"⚠️ Warning: Unrecognized Script Version ({APP_VERSION}). Proceed with caution.\n")


# ================= AD CHECK (MULTITHREADED) =================
def check_single_ad_user(username, target_group):
    """Helper function to be run by individual threads"""
    try:
        result = subprocess.run(
            ["net", "user", "/do", username],
            capture_output=True,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW # Keeps hidden CMD windows from flashing
        )

        if result.returncode != 0:
            return username, False, f"[-] Could not retrieve info for: {username}"

        if target_group in result.stdout:
            return username, True, f"[+] Match found: {username}"
        else:
            return username, False, f"[ ] No match: {username}"

    except Exception as e:
        return username, False, f"[!] Error processing {username} : {e}"


def get_resigned_users(user_list, target_group):
    """Main function that manages the thread pool"""
    resigned_users_found = []
    MAX_THREADS = 15

    # Create a pool of up to 15 threads
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        # Submit all users to the threads
        future_to_user = {executor.submit(check_single_ad_user, username, target_group): username for username in user_list}

        # Print results as soon as any thread finishes its task
        for future in concurrent.futures.as_completed(future_to_user):
            try:
                username, is_match, log_msg = future.result()
                print(log_msg)

                if is_match:
                    resigned_users_found.append(username)
            except Exception as exc:
                print(f"[!] A thread generated an exception: {exc}")

    return resigned_users_found


# ================= MAIN =================
if __name__ == "__main__":

    # 1. Verify Network First
    if not check_office_network():
        print("❌ Not connected to Jio Intranet WiFi / network || Sending IP Logs to InfoSec team")
        input("\nPress Enter to exit...")
        print("\nLogs with the respected system and IP are Logged...")
        sys.exit()

    print("Connected to R-Secure network\n Sending IP Logs to RIL-InfoSec\n")

    # 2. Fetch JSON Config
    config = get_config_from_github()

    if config:

        # 🔥 VERSION CONTROL CHECK 🔥
        check_script_version(config)

        # 3. Password Protection & Role Assignment
        ADMIN_PASSWORD = config.get("ADMIN_PASSWORD")
        USER_PASSWORD = config.get("USER_PASSWORD")

        if not ADMIN_PASSWORD or not USER_PASSWORD:
            print("❌ Security Error: Password keys missing in cloud config.")
            input("\nPress Enter to exit...")
            sys.exit()

        entered_password = getpass.getpass("Enter Secret Key : ")

        # Determine access level based on password
        access_level = None
        if entered_password == ADMIN_PASSWORD:
            access_level = "ADMIN"
            print("\nAdmin Access Granted ✅ - Full List Mode")
        elif entered_password == USER_PASSWORD:
            access_level = "USER"
            print("\nStandard Access Granted ✅ - Single User Mode")
        else:
            print("Access Denied For Unauthorised person ❌")
            input("\nPress Enter to exit...")
            sys.exit()

        # 4. Get Configuration Data
        target = config.get("TARGET_GROUP")

        # 5. Process Based on Access Level
        if access_level == "ADMIN":
            print("\nReliance Corporate IT Park Limited\n")

            raw_users = config.get("USER_LIST", "")
            users_to_check = [u.strip() for u in raw_users.split(",") if u.strip()]

            if not users_to_check:
                print("User list is empty in cloud JSON")
                sys.exit()

            print(f"Processing {len(users_to_check)} users\n")
            final_list = get_resigned_users(users_to_check, target)

            print("-" * 30)
            print("Final List of users found in target group:")
            if final_list:
                for name in final_list:
                    print(name)
            else:
                print("None")

            current_time = datetime.datetime.now()
            print(
                "\nTotal number of persons identified:",
                len(final_list),
                "|| InfoSec Logged Time:",
                current_time.strftime("%Y-%m-%d %H:%M:%S")
            )
            input("\nPress Enter to Exit...")

        elif access_level == "USER":
            print("\nReliance Corporate IT Park Limited")
            print("[ Continuous Scan Mode - Press Ctrl+C to Exit ]")
            
            try:
                # Infinite loop for continuous checking
                while True:
                    single_user = input("\nEnter the Username to check: ").strip().title()
                    
                    if not single_user:
                        continue # Skip empty inputs
                    
                    # Run the check for just this one user
                    get_resigned_users([single_user], target)
                    
            except KeyboardInterrupt:
                # Catches the Ctrl+C command to exit cleanly without throwing massive Python errors
                print("\n\n⏹️  Scan terminated by user (Ctrl+C). Exiting program safely...")
                sys.exit()

    else:
        print("Failed to load configuration.")
        input("\nPress Enter to Exit...")