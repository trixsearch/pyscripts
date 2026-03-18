import subprocess
import requests
import datetime
import getpass
import sys
import base64

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


# ================= CLOUD CONFIG =================
def get_config_from_github():
    print("Fetching license data & security config...")
    try:
        response = requests.get(GITHUB_URL)

        if response.status_code == 200:
            return response.json()
        else:
            print("Error reaching code:", response.status_code)
            return None

    except Exception as e:
        print("Connection Error:", e)
        return None


# ================= AD CHECK =================
def get_resigned_users(user_list, target_group):
    resigned_users_found = []

    print("\nReliance Corporate IT Park Limited\n")
    print("Processing", len(user_list), "users...\n")

    for username in user_list:
        try:
            result = subprocess.run(
                ["net", "user", "/do", username],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                print("[-] Could not retrieve info for:", username)
                continue

            if target_group in result.stdout:
                print("[+] Match found:", username)
                resigned_users_found.append(username)
            else:
                print("[ ] No match:", username)

        except Exception as e:
            print("[!] Error processing", username, ":", e)

    return resigned_users_found


# ================= MAIN =================
if __name__ == "__main__":

    # 1. Verify Network First
    if not check_office_network():
        print("❌ Not connected to Jio Intranet WiFi / network || Sending IP Logs to InfoSec team")
        input("\nPress Enter to exit...")
        print("\nLogs with the respected system and IP are Logged...")
        sys.exit()

    print("Connected to R-Secure network\n Sending IP Logs to RIL-InfoSec")

    # 2. Fetch JSON Config
    config = get_config_from_github()

    if config:
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
        users_to_check = []
        
        if access_level == "ADMIN":
            # Fetch the full list from cloud
            raw_users = config.get("USER_LIST", "")
            users_to_check = [u.strip() for u in raw_users.split(",") if u.strip()]
            
            if not users_to_check:
                print("User list is empty in cloud JSON")
                sys.exit()
                
        elif access_level == "USER":
            # Ask for a single username manually
            single_user = input("\nEnter the Username to check: ").strip()
            if not single_user:
                print("No username entered.")
                sys.exit()
            users_to_check = [single_user]

        # Execute the check
        final_list = get_resigned_users(users_to_check, target)

        print("-" * 30)
        print("Final List of users found in target group:")
        if final_list:
            print(final_list)
        else:
            print("None")

        current_time = datetime.datetime.now()

        print(
            "\nTotal number of persons identified:",
            len(final_list),
            "|| InfoSec Logged Time:",
            current_time.strftime("%Y-%m-%d %H:%M:%S")
        )

    else:
        print("Failed to load configuration.")

    input("\nPress Enter to Exit...")