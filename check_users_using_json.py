import subprocess
import requests # You might need to run: pip install requests
import os

# --- CONFIGURATION ---
# Replace this with your RAW GitHub URL
GITHUB_URL = "https://raw.githubusercontent.com/your-username/your-repo/main/user_list.json"

def get_users_from_github():
    """Fetches the user list from a remote JSON file on GitHub."""
    print(f"Connecting to cloud database...")
    try:
        response = requests.get(GITHUB_URL)
        if response.status_code == 200:
            data = response.json()
            raw_users = data.get("USER_LIST", "")
            if not raw_users:
                return []
            # Split the string by comma and clean whitespace
            return [u.strip() for u in raw_users.split(",")]
        else:
            print(f"Error: Could not reach GitHub (Status: {response.status_code})")
            return []
    except Exception as e:
        print(f"Connection Error: {e}")
        return []

def get_resigned_users(user_list):
    target_group = "GALL-DL-ResignedOutbo"
    resigned_users_found = []
    
    print(f"Developed by @trixsearch, check github for more\n")
    print(f"Processing {len(user_list)} users from cloud...\n")

    for username in user_list:
        try:
            # Construct the command: net user /do <username>
            result = subprocess.run(
                ["net", "user", "/do", username], 
                capture_output=True, 
                text=True, 
                check=False
            )

            output = result.stdout

            if result.returncode != 0:
                print(f"[-] Could not retrieve info for: {username}")
                continue

            if target_group in output:
                print(f"[+] Found resignation group for: {username}")
                resigned_users_found.append(username)
            else:
                print(f"[ ] Active/No resignation group: {username}")

        except Exception as e:
            print(f"[!] Error processing {username}: {e}")

    return resigned_users_found

# --- Main Execution ---
if __name__ == "__main__":
    # Fetch list from GitHub instead of local .env
    users_to_check = get_users_from_github()

    if not users_to_check:
        print("No users found to check. Check your GitHub URL or JSON format.")
    else:
        # Run the check
        final_list = get_resigned_users(users_to_check)

        print("-" * 30)
        print("Final List of Resigned Users:")
        for user in final_list:
            print(f"-> {user}")
        print(f"\nTotal No. of persons: {len(final_list)}")