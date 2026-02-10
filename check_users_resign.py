import subprocess
import os
from dotenv import load_dotenv

load_dotenv() # Loads variables from .env into os.environ

def get_users_from_env():
    # Fetch the string and split it back into a Python list
    raw_users = os.getenv("USER_LIST", "")
    if not raw_users:
        return []
    return [u.strip() for u in raw_users.split(",")]

def get_resigned_users(user_list):
    # The specific group signature to look for
    target_group = "GALL-DL-ResignedOutbo"
    
    # List to store users who match the criteria
    resigned_users_found = []
    print(f"Developed by @trixsearch , check github for more \n")
    print(f"Processing {len(user_list)} users...\n")

    for username in user_list:
        try:
            # Construct the command: net user /do <username>
            # capture_output=True captures stdout/stderr
            # text=True decodes the output to string automatically
            result = subprocess.run(
                ["net", "user", "/do", username], 
                capture_output=True, 
                text=True, 
                check=False # Don't crash if user not found, we handle it manually
            )

            # Get the standard output
            output = result.stdout

            # Check if the command was successful before parsing
            if result.returncode != 0:
                print(f"[-] Could not retrieve info for: {username}")
                continue

            # Check if the target group string exists in the output
            # We use distinct checking to ensure we don't catch partial matches randomly
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
    # Add your list of usernames here directly or use ENV file
    # Now use it in your existing script
    users_to_check = get_users_from_env()

    # Run the check
    final_list = get_resigned_users(users_to_check)

    print("-" * 30)
    print("Final List of Resigned Users:")
    print(final_list)
    print("Total No. of persons : ",len(final_list))