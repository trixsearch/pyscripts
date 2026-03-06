import subprocess
import requests
import datetime
import getpass
import sys

# ================= PASSWORD PROTECTION =================
PASSWORD = "pujju"

entered_password = getpass.getpass("Enter Tujju's Name : ")

if entered_password != PASSWORD:
    print("Access Denied ❌")
    input("\nPress Enter to exit...")
    sys.exit()

print("Access Granted ✅\n")
# =======================================================


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


if not check_office_network():
    print("❌ Not connected to company WiFi / network")
    input("\nPress Enter to exit...")
    sys.exit()

print("✅ Connected to company network\n")
# =======================================================


# --- CONFIGURATION ---
GITHUB_URL = "https://raw.githubusercontent.com/trixsearch/CPlusPlus/refs/heads/master/env/userchecklist.json"


def get_config_from_github():
    print("Fetching cloud lists...")
    try:
        response = requests.get(GITHUB_URL)

        if response.status_code == 200:
            return response.json()
        else:
            print("Error reaching GitHub:", response.status_code)
            return None

    except Exception as e:
        print("Connection Error:", e)
        return None


def get_resigned_users(user_list, target_group):

    resigned_users_found = []

    print("Developed by whom, we are also searching that guy\n")
    # print("Searching for group:", target_group)
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

    config = get_config_from_github()

    if config:

        target = config.get("TARGET_GROUP")
        raw_users = config.get("USER_LIST", "")

        users_to_check = [u.strip() for u in raw_users.split(",") if u.strip()]

        if not users_to_check:
            print("User list is empty in cloud JSON")

        else:

            final_list = get_resigned_users(users_to_check, target)

            print("-" * 30)
            print("Final List of users:")
            print(final_list)

            current_time = datetime.datetime.now()

            print(
                "\nTotal number of persons:",
                len(final_list),
                "|| On Time:",
                current_time
            )

    else:
        print("Failed to load configuration.")

input("\nPress Enter to Exit...")