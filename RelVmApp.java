import com.formdev.flatlaf.FlatDarkLaf;
import org.json.JSONObject;

import javax.swing.*;
import javax.swing.text.*;
import java.awt.*;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class RelVmApp extends JFrame {

    // 🔥 1. APP VERSION CONSTANT 🔥
    private static final String APP_VERSION = "1.0";

    private CardLayout cardLayout = new CardLayout();
    private JPanel mainPanel = new JPanel(cardLayout);

    // UI Components
    private JProgressBar loadingSpinner, scanProgress;
    private JPasswordField passwordEntry;
    private JTextField userEntry;
    private JTextPane consoleBox;
    private JButton singleScanBtn, batchScanBtn, logoutBtn;

    // State
    private JSONObject cloudConfig;
    private String accessLevel;
    private String targetGroup;
    private final ExecutorService threadPool = Executors.newFixedThreadPool(15);

    public RelVmApp() {
        setTitle("RelVm - RIL InfoSec");
        setSize(850, 750);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        mainPanel.add(createLoadingScreen(), "LOADING");
        mainPanel.add(createLoginScreen(), "LOGIN");
        mainPanel.add(createDashboardScreen(), "DASHBOARD");

        add(mainPanel);
        cardLayout.show(mainPanel, "LOADING");

        new Thread(this::fetchConfig).start();
    }

    // --- NETWORK & VERSION CONTROL ---

    private void fetchConfig() {
        try {
            String p = "aHR0cHM6Ly9yYXcuZ2l0aHVi" + "dXNlcmNvbnRlbnQuY29tL3Ry" +
                    "aXhzZWFyY2gvQ1BsdXNQbHVz" + "L3JlZnMvaGVhZHMvbWFzdGVy" +
                    "L2Vudi91c2VyY2hlY2tsaXN0" + "Lmpzb24=";

            String url = new String(Base64.getDecoder().decode(p));

            // 🔥 2. THE CACHE BUSTER 🔥
            url = url + "?nocache=" + System.currentTimeMillis();

            HttpResponse<String> res = HttpClient.newHttpClient().send(
                    HttpRequest.newBuilder().uri(URI.create(url)).build(),
                    HttpResponse.BodyHandlers.ofString()
            );

            if (res.statusCode() == 200) {
                cloudConfig = new JSONObject(res.body());
                targetGroup = cloudConfig.getString("TARGET_GROUP");

                // Run UI updates on the Swing Thread
                SwingUtilities.invokeLater(this::checkVersionAndProceed);
            }
        } catch (Exception e) {
            SwingUtilities.invokeLater(() ->
                    JOptionPane.showMessageDialog(this, "Connection Error: " + e.getMessage(), "Network Fault", JOptionPane.ERROR_MESSAGE)
            );
        }
    }

    private void checkVersionAndProceed() {
        if (cloudConfig.has("VERSION_CONTROL")) {
            JSONObject versionMap = cloudConfig.getJSONObject("VERSION_CONTROL");

            if (versionMap.has(APP_VERSION)) {
                JSONObject myVersionData = versionMap.getJSONObject(APP_VERSION);
                boolean isAllowed = myVersionData.getBoolean("allowed");
                String message = myVersionData.getString("message");

                if (!isAllowed) {
                    // Script is DEAD. Show message and close.
                    JOptionPane.showMessageDialog(this, message, "Version Deprecated", JOptionPane.ERROR_MESSAGE);
                    System.exit(0);
                } else {
                    // Script is ALIVE, but has a notification (like "Nightly available"). Show it, then continue.
                    JOptionPane.showMessageDialog(this, message, "Update Notice", JOptionPane.INFORMATION_MESSAGE);
                }
            } else {
                JOptionPane.showMessageDialog(this, "Unrecognized Script Version (" + APP_VERSION + ").", "Warning", JOptionPane.WARNING_MESSAGE);
            }
        }

        // Move to Login Screen and auto-focus the password box
        cardLayout.show(mainPanel, "LOGIN");
        passwordEntry.requestFocusInWindow();
    }

    // --- NAVIGATION LOGIC ---

    private void verifyPassword() {
        String entered = new String(passwordEntry.getPassword());
        if (cloudConfig == null) return;

        if (entered.equals(cloudConfig.getString("ADMIN_PASSWORD"))) {
            accessLevel = "ADMIN";
            setupDashboard();
        } else if (entered.equals(cloudConfig.getString("USER_PASSWORD"))) {
            accessLevel = "USER";
            setupDashboard();
        } else {
            JOptionPane.showMessageDialog(this, "Access Denied: Invalid Key", "Auth Error", JOptionPane.ERROR_MESSAGE);
            passwordEntry.setText("");
        }
    }

    private void setupDashboard() {
        consoleBox.setText("");
        userEntry.setText("");
        passwordEntry.setText("");

        boolean isAdmin = accessLevel.equals("ADMIN");
        batchScanBtn.setVisible(isAdmin);

        log("=== RelVm System Terminal [" + accessLevel + " PRIVILEGES] ===", Color.CYAN);
        log("Connection Secure. System Ready.\n", Color.GRAY);

        cardLayout.show(mainPanel, "DASHBOARD");
        userEntry.requestFocusInWindow(); // Auto-focus the user entry box
    }

    private void logout() {
        accessLevel = null;
        passwordEntry.setText("");
        userEntry.setText("");
        cardLayout.show(mainPanel, "LOGIN");
        passwordEntry.requestFocusInWindow();
    }

    // --- SCAN LOGIC ---

    private void startSingleScan() {
        String target = userEntry.getText().trim();
        if (target.isEmpty()) return;

        List<String> list = new ArrayList<>();
        list.add(target);
        executeScanProcess(list, "SINGLE-POINT ANALYSIS");
    }

    private void startBatchScan() {
        if (!accessLevel.equals("ADMIN")) return;

        String raw = cloudConfig.getString("USER_LIST");
        List<String> list = new ArrayList<>();
        for (String u : raw.split(",")) {
            if (!u.trim().isEmpty()) list.add(u.trim());
        }
        executeScanProcess(list, "FULL BATCH RECONNAISSANCE");
    }

    private void executeScanProcess(List<String> users, String mode) {
        setUILocked(true);
        log(">> INITIATING " + mode + " on " + users.size() + " records...", Color.CYAN);
        scanProgress.setIndeterminate(true);

        AtomicInteger completedCount = new AtomicInteger(0);
        int total = users.size();

        for (String user : users) {
            threadPool.submit(() -> {
                checkUserInAD(user);
                if (completedCount.incrementAndGet() == total) {
                    SwingUtilities.invokeLater(() -> {
                        scanProgress.setIndeterminate(false);
                        setUILocked(false);
                        log("\n>> Analysis Sequence Finalized.", Color.CYAN);
                        userEntry.setText("");
                        userEntry.requestFocusInWindow();
                    });
                }
            });
        }
    }

    private void checkUserInAD(String username) {
        try {
            ProcessBuilder pb = new ProcessBuilder("net", "user", "/do", username);
            pb.redirectErrorStream(true);
            Process p = pb.start();

            BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()));
            StringBuilder out = new StringBuilder();
            String l;
            while((l = r.readLine()) != null) out.append(l);
            p.waitFor();

            if (out.toString().contains(targetGroup)) {
                log("[+] DETECTED: " + username, Color.GREEN);
            } else if (out.toString().contains("The user name could not be found")) {
                log("[-] NOT FOUND: " + username, Color.RED);
            } else {
                log("[ ] CLEARED: " + username, Color.LIGHT_GRAY);
            }
        } catch (Exception e) {
            log("[!] CRITICAL ERROR on " + username, Color.RED);
        }
    }

    // --- UI FACTORIES & HELPERS ---

    private JPanel createDashboardScreen() {
        JPanel panel = new JPanel(new BorderLayout(15, 15));
        panel.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));

        JPanel topPanel = new JPanel(new BorderLayout());
        JLabel label = new JLabel("RelVm Dashboard");
        label.setFont(new Font("Segoe UI", Font.BOLD, 24));
        logoutBtn = new JButton("LOGOUT");
        logoutBtn.addActionListener(e -> logout());
        topPanel.add(label, BorderLayout.WEST);
        topPanel.add(logoutBtn, BorderLayout.EAST);

        JPanel controlsPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 10));

        userEntry = new JTextField(20);
        userEntry.setPreferredSize(new Dimension(250, 35));
        // 🔥 3. ENTER KEY BINDING FOR SCANNING 🔥
        userEntry.addActionListener(e -> startSingleScan());

        singleScanBtn = new JButton("SCAN SINGLE");
        singleScanBtn.setBackground(new Color(0, 123, 255));
        singleScanBtn.addActionListener(e -> startSingleScan());

        batchScanBtn = new JButton("SCAN FULL LIST");
        batchScanBtn.setBackground(new Color(40, 167, 69));
        batchScanBtn.addActionListener(e -> startBatchScan());

        controlsPanel.add(new JLabel("AD User:"));
        controlsPanel.add(userEntry);
        controlsPanel.add(singleScanBtn);
        controlsPanel.add(batchScanBtn);

        consoleBox = new JTextPane();
        consoleBox.setEditable(false);
        consoleBox.setBackground(new Color(15, 15, 15));
        consoleBox.setFont(new Font("Consolas", Font.PLAIN, 13));

        scanProgress = new JProgressBar();

        JPanel centerWrapper = new JPanel(new BorderLayout());
        centerWrapper.add(controlsPanel, BorderLayout.NORTH);
        centerWrapper.add(new JScrollPane(consoleBox), BorderLayout.CENTER);

        panel.add(topPanel, BorderLayout.NORTH);
        panel.add(centerWrapper, BorderLayout.CENTER);
        panel.add(scanProgress, BorderLayout.SOUTH);

        return panel;
    }

    private JPanel createLoadingScreen() {
        JPanel p = new JPanel(new GridBagLayout());
        loadingSpinner = new JProgressBar();
        loadingSpinner.setIndeterminate(true);
        loadingSpinner.setPreferredSize(new Dimension(300, 8));
        p.add(loadingSpinner);
        return p;
    }

    private JPanel createLoginScreen() {
        JPanel p = new JPanel(new GridBagLayout());
        GridBagConstraints g = new GridBagConstraints();
        g.insets = new Insets(10,10,10,10);

        passwordEntry = new JPasswordField(20);
        passwordEntry.setPreferredSize(new Dimension(250, 40));
        // 🔥 3. ENTER KEY BINDING FOR LOGIN 🔥
        passwordEntry.addActionListener(e -> verifyPassword());

        JButton b = new JButton("AUTHORIZE");
        b.setPreferredSize(new Dimension(250, 40));
        b.addActionListener(e -> verifyPassword());

        g.gridy=0; p.add(new JLabel("RelVm - Secure Access"), g);
        g.gridy=1; p.add(passwordEntry, g);
        g.gridy=2; p.add(b, g);
        return p;
    }

    private void log(String msg, Color color) {
        SwingUtilities.invokeLater(() -> {
            try {
                SimpleAttributeSet set = new SimpleAttributeSet();
                StyleConstants.setForeground(set, color);
                StyledDocument doc = consoleBox.getStyledDocument();
                doc.insertString(doc.getLength(), msg + "\n", set);
                consoleBox.setCaretPosition(doc.getLength());
            } catch (Exception e) {}
        });
    }

    private void setUILocked(boolean locked) {
        SwingUtilities.invokeLater(() -> {
            singleScanBtn.setEnabled(!locked);
            batchScanBtn.setEnabled(!locked);
            logoutBtn.setEnabled(!locked);
            userEntry.setEnabled(!locked);
        });
    }

    public static void main(String[] args) {
        FlatDarkLaf.setup();
        SwingUtilities.invokeLater(() -> new RelVmApp().setVisible(true));
    }
}