import subprocess
import requests
import datetime
# import os

# --- CONFIGURATION ---
# Replace this with your RAW GitHub URL
GITHUB_URL = "https://raw.githubusercontent.com/trixsearch/CPlusPlus/refs/heads/master/env/userchecklist.json"

def get_config_from_github():
    """Fetches both the user list and the target group from GitHub."""
    print(f"Fetching cloud lists...")
    try:
        response = requests.get(GITHUB_URL)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error: Could not reach GitHub (Status: {response.status_code})")
            return None
    except Exception as e:
        print(f"Connection Error: {e}")
        return None

def get_resigned_users(user_list, target_group):
    resigned_users_found = []
    
    print(f"Developed by @trixsearch, check github for more\n")
    print(f"Searching for group: '{target_group}'")
    print(f"Processing {len(user_list)} users...\n")

    for username in user_list:
        try:
            # Construct the command: net user /do <username>
            result = subprocess.run(
                ["net", "user", "/do", username], 
                capture_output=True, 
                text=True, 
                check=False
            )

            if result.returncode != 0:
                print(f"[-] Could not retrieve info for: {username}")
                continue

            # Check for the group we fetched from JSON
            if target_group in result.stdout:
                print(f"[+] Match found for: {username}")
                resigned_users_found.append(username)
            else:
                print(f"[ ] No match: {username}")

        except Exception as e:
            print(f"[!] Error processing {username}: {e}")

    return resigned_users_found

# --- Main Execution ---
if __name__ == "__main__":
    # 1. Fetch the whole config dictionary
    config = get_config_from_github()

    if config:
        # 2. Extract the values from the dictionary
        target = config.get("TARGET_GROUP")
        raw_users = config.get("USER_LIST", "")
        
        # Clean the user list
        users_to_check = [u.strip() for u in raw_users.split(",") if u.strip()]

        if not users_to_check:
            print("User list is empty in the cloud JSON.")
        else:
            # 3. Run the check using the cloud-fetched target
            final_list = get_resigned_users(users_to_check, target)

            print("-" * 30)
            print(f"Final List of users :")
            print(final_list)
            currentTime=datetime.datetime.now()
            print("Total number of persons : ",len(final_list),"||  On Time :",currentTime)
    else:
        print("Failed to load configuration. Script stopped.")