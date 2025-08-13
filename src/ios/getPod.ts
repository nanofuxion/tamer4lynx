import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Checks if CocoaPods is installed on the system.
 * @returns {boolean} True if installed, false otherwise.
 */
function isCocoaPodsInstalled(): boolean {
    try {
        // The `command -v` command is a reliable way to check if a command exists in the shell's PATH.
        // We pipe the output to /dev/null to keep the console clean.
        execSync('command -v pod >/dev/null 2>&1');
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Sets up the CocoaPods environment for the project.
 * @param rootDir The root directory of the iOS project.
 */
export async function setupCocoaPods(rootDir: string): Promise<void> {
    // First, check if CocoaPods is available.
    if (!isCocoaPodsInstalled()) {
        console.error("❌ CocoaPods is not installed.");
        console.log("   CocoaPods is required to manage native dependencies for iOS development.");
        console.log("   Please install it using one of the following commands:");
        console.log("\n   Using Homebrew (Recommended):");
        console.log("   brew install cocoapods");
        console.log("\n   Using RubyGems:");
        console.log("   sudo gem install cocoapods\n");
        process.exit(1); // Exit the script with an error code.
    }

    try {
        console.log("📦 CocoaPods is installed. Proceeding with dependency installation...");

        const podfilePath = path.join(rootDir, 'Podfile');

        if (!fs.existsSync(podfilePath)) {
            throw new Error(`Podfile not found at ${podfilePath}`);
        }

        console.log(`🚀 Executing pod install in: ${rootDir}`);
        execSync(`pod install`, {
            cwd: rootDir,
            stdio: "inherit",
        });

        console.log("✅ CocoaPods dependencies installed successfully.");
    } catch (err: any) {
        console.error("❌ Failed to install CocoaPods dependencies.", err.message);
        // Exit the process if pod installation fails, as it's a critical step.
        process.exit(1);
    }
}