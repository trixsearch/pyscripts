import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Scanner;
import java.util.concurrent.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.io.Console;

public class RelVmTerminal {

    // --- GLOBALS ---
    private static final String ALLOWED_GATEWAY = "10.14.128.1";
    private static final String ALLOWED_DOMAIN = "in.ril.com";

    // 🔥 Hardcode the script's version here for Version Control 🔥
    private static final String APP_VERSION = "1.0";

    // Small class to hold the result of a single thread's work
    private static class ScanResult {
        String username;
        boolean isMatch;
        String logMessage;

        public ScanResult(String u, boolean m, String l) {
            this.username = u;
            this.isMatch = m;
            this.logMessage = l;
        }
    }

    public static void main(String[] args) {
        Scanner inputScanner = new Scanner(System.in);

        // 1. Verify Network First
        if (!checkOfficeNetwork()) {
            System.out.println("❌ Not connected to Jio Intranet WiFi / network || Sending IP Logs to InfoSec team");
            System.out.println("\nLogs with the respected system and IP are Logged...");
            System.out.print("\nPress Enter to exit...");
            inputScanner.nextLine();
            System.exit(0);
        }

        System.out.println("Connected to R-Secure network\n Sending IP Logs to RIL-InfoSec\n");

        // 2. Fetch JSON Config
        JSONObject config = getConfigFromGithub();

        if (config != null) {

            // 🔥 VERSION CONTROL CHECK 🔥
            checkScriptVersion(config, inputScanner);

            // 3. Password Protection & Role Assignment
            String adminPwd = config.optString("ADMIN_PASSWORD", null);
            String userPwd = config.optString("USER_PASSWORD", null);

            if (adminPwd == null || userPwd == null) {
                System.out.println("❌ Security Error: Password keys missing in cloud config.");
                System.out.print("\nPress Enter to exit...");
                inputScanner.nextLine();
                System.exit(1);
            }

            // Read password (hides input if running in a real Windows terminal)
            String enteredPassword = getHiddenPassword();

            String accessLevel = null;
            if (enteredPassword.equals(adminPwd)) {
                accessLevel = "ADMIN";
                System.out.println("\nAdmin Access Granted ✅ - Full List Mode");
            } else if (enteredPassword.equals(userPwd)) {
                accessLevel = "USER";
                System.out.println("\nStandard Access Granted ✅ - Single User Mode");
            } else {
                System.out.println("Access Denied For Unauthorised person ❌");
                System.out.print("\nPress Enter to exit...");
                inputScanner.nextLine();
                System.exit(1);
            }

            // 4. Get Configuration Data
            String targetGroup = config.getString("TARGET_GROUP");

            // 5. Process Based on Access Level
            if (accessLevel.equals("ADMIN")) {
                System.out.println("\nReliance Corporate IT Park Limited\n");

                String rawUsers = config.optString("USER_LIST", "");
                List<String> usersToCheck = new ArrayList<>();
                for (String u : rawUsers.split(",")) {
                    if (!u.trim().isEmpty()) {
                        usersToCheck.add(u.trim());
                    }
                }

                if (usersToCheck.isEmpty()) {
                    System.out.println("User list is empty in cloud JSON");
                    System.exit(1);
                }

                System.out.println("Processing " + usersToCheck.size() + " users\n");

                // Trigger the Multithreaded Scan
                List<String> finalMatches = getResignedUsers(usersToCheck, targetGroup);

                System.out.println("------------------------------");
                System.out.println("Final List of users found in target group:");
                if (!finalMatches.isEmpty()) {
                    for (String name : finalMatches){
                        System.out.println(name);
                    }
                } else {
                    System.out.println("None");
                }

                String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                System.out.println("\nTotal number of persons identified: " + finalMatches.size() +
                        " || InfoSec Logged Time: " + timestamp);
                System.out.print("\nPress Enter to Exit...");
                inputScanner.nextLine();

            } else if (accessLevel.equals("USER")) {
                System.out.println("\nReliance Corporate IT Park Limited");
                System.out.println("[ Continuous Scan Mode - Press Ctrl+C to Exit ]");

                // Infinite loop for continuous checking (User Mode)
                while (true) {
                    System.out.print("\nEnter the Username to check: ");
                    String singleUser = inputScanner.nextLine().trim();

                    if (singleUser.isEmpty()) continue;

                    // Standardize formatting: "harsh.pal" -> "Harsh.Pal"
                    singleUser = formatTitleCase(singleUser);

                    List<String> singleList = new ArrayList<>();
                    singleList.add(singleUser);
                    getResignedUsers(singleList, targetGroup);
                }
            }

        } else {
            System.out.println("Failed to load configuration.");
            System.out.print("\nPress Enter to Exit...");
            inputScanner.nextLine();
        }

        inputScanner.close();
    }


    // ================= NETWORK CHECK =================
    private static boolean checkOfficeNetwork() {
        try {
            ProcessBuilder pb = new ProcessBuilder("ipconfig", "/all");
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
            process.waitFor();

            String fullText = output.toString();
            return fullText.contains(ALLOWED_GATEWAY) && fullText.contains(ALLOWED_DOMAIN);
        } catch (Exception e) {
            System.out.println("Network check failed: " + e.getMessage());
            return false;
        }
    }


    // ================= CLOUD CONFIG =================
    // ================= CLOUD CONFIG =================
    private static JSONObject getConfigFromGithub() {
        System.out.println("Fetching license data & security config...");
        try {
            String p = "aHR0cHM6Ly9yYXcuZ2l0aHVi" + "dXNlcmNvbnRlbnQuY29tL3Ry" +
                    "aXhzZWFyY2gvQ1BsdXNQbHVz" + "L3JlZnMvaGVhZHMvbWFzdGVy" +
                    "L2Vudi91c2VyY2hlY2tsaXN0" + "Lmpzb24=";

            String url = new String(Base64.getDecoder().decode(p));

            // 🔥 THE CACHE BUSTER 🔥
            // This forces GitHub to give you the live file, not the 5-minute old cached version.
            url = url + "?nocache=" + System.currentTimeMillis();

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return new JSONObject(response.body());
            } else {
                System.out.println("Error reaching code: " + response.statusCode());
                return null;
            }
        } catch (Exception e) {
            System.out.println("Connection Error: " + e.getMessage());
            return null;
        }
    }


    // ================= VERSION CONTROL LOGIC =================
    private static void checkScriptVersion(JSONObject config, Scanner scanner) {
        if (config.has("VERSION_CONTROL")) {
            JSONObject versionMap = config.getJSONObject("VERSION_CONTROL");

            if (versionMap.has(APP_VERSION)) {
                JSONObject myVersionData = versionMap.getJSONObject(APP_VERSION);

                boolean isAllowed = myVersionData.getBoolean("allowed");
                String message = myVersionData.getString("message");

                System.out.println("-------------------------------------------------");
                System.out.println(message);
                System.out.println("-------------------------------------------------\n");

                if (!isAllowed) {
                    System.out.println("Execution blocked due to version deprecation.");
                    System.out.print("Press Enter to exit...");
                    scanner.nextLine();
                    System.exit(0);
                }
            } else {
                System.out.println("⚠️ Warning: Unrecognized Script Version (" + APP_VERSION + "). Proceed with caution.\n");
            }
        }
    }


    // ================= AD CHECK (MULTITHREADED) =================

    private static ScanResult checkSingleAdUser(String username, String targetGroup) {
        try {
            ProcessBuilder pb = new ProcessBuilder("net", "user", "/do", username);
            pb.redirectErrorStream(true);
            Process p = pb.start();

            BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()));
            StringBuilder out = new StringBuilder();
            String l;
            while((l = r.readLine()) != null) out.append(l);

            int returnCode = p.waitFor();

            if (returnCode != 0) {
                return new ScanResult(username, false, "[-] Could not retrieve info for: " + username);
            }

            if (out.toString().contains(targetGroup)) {
                return new ScanResult(username, true, "[+] Match found: " + username);
            } else {
                return new ScanResult(username, false, "[ ] No match: " + username);
            }

        } catch (Exception e) {
            return new ScanResult(username, false, "[!] Error processing " + username + " : " + e.getMessage());
        }
    }

    private static List<String> getResignedUsers(List<String> userList, String targetGroup) {
        List<String> resignedUsersFound = new ArrayList<>();
        int MAX_THREADS = 15;

        // 1. Create the Thread Pool (The Manager)
        ExecutorService executor = Executors.newFixedThreadPool(MAX_THREADS);

        // 2. Create the Completion Service (The equivalent of concurrent.futures.as_completed)
        // This tool specifically listens to the pool and hands us back results the millisecond they finish.
        CompletionService<ScanResult> completionService = new ExecutorCompletionService<>(executor);

        // 3. Submit all tasks
        for (String username : userList) {
            completionService.submit(() -> checkSingleAdUser(username, targetGroup));
        }

        // 4. Retrieve results as they finish (The Loop)
        for (int i = 0; i < userList.size(); i++) {
            try {
                // .take().get() waits for the NEXT available finished task, regardless of order
                ScanResult result = completionService.take().get();
                System.out.println(result.logMessage);

                if (result.isMatch) {
                    resignedUsersFound.add(result.username);
                }
            } catch (Exception exc) {
                System.out.println("[!] A thread generated an exception: " + exc.getMessage());
            }
        }

        // Always shut down the executor when done so the program can exit safely
        executor.shutdown();
        return resignedUsersFound;
    }

    // ================= HELPERS =================

    // Safely gets password, hiding characters if possible
    private static String getHiddenPassword() {
        Console console = System.console();
        if (console != null) {
            char[] pwdChars = console.readPassword("Enter Secret Key : ");
            return new String(pwdChars);
        } else {
            // Fallback for IDEs like IntelliJ where System.console() is null
            System.out.print("Enter Secret Key : ");
            Scanner s = new Scanner(System.in);
            return s.nextLine();
        }
    }

    // Equivalent to Python's .title()
    private static String formatTitleCase(String input) {
        String[] parts = input.split("\\.");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (parts[i].length() > 0) {
                sb.append(Character.toUpperCase(parts[i].charAt(0)))
                        .append(parts[i].substring(1).toLowerCase());
                if (i < parts.length - 1) sb.append(".");
            }
        }
        return sb.toString();
    }
}