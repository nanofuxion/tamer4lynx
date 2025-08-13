import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import fetch from 'node-fetch';
import AdmZip from 'adm-zip';

/**
 * Downloads and extracts a specific version of Gradle.
 * @param gradleVersion The version of Gradle to download.
 */
export async function downloadGradle(gradleVersion: string): Promise<void> {
  const gradleBaseUrl = `https://services.gradle.org/distributions/gradle-${gradleVersion}-bin.zip`;
  // Place the gradle directory in the current working directory of the project
  const downloadDir = path.join(process.cwd(), 'gradle');
  const zipPath = path.join(downloadDir, `gradle-${gradleVersion}.zip`);
  const extractedPath = path.join(downloadDir, `gradle-${gradleVersion}`);

  // Check if Gradle is already downloaded and extracted
  if (fs.existsSync(extractedPath)) {
    console.log(`✅ Gradle ${gradleVersion} already exists at ${extractedPath}. Skipping download.`);
    return;
  }

  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  console.log(`📥 Downloading Gradle ${gradleVersion} from ${gradleBaseUrl}...`);

  const response = await fetch(gradleBaseUrl);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  const fileStream = fs.createWriteStream(zipPath);
  await new Promise<void>((resolve, reject) => {
    response.body?.pipe(fileStream);
    response.body?.on('error', reject);
    fileStream.on('finish', resolve);
  });

  console.log('✅ Download complete. Extracting...');

  try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(downloadDir, true);
  } catch (err) {
      console.error(`❌ Failed to extract Gradle zip: ${err}`);
      throw err;
  }


  // Clean up the downloaded zip file
  fs.unlinkSync(zipPath);

  console.log(`✅ Gradle ${gradleVersion} extracted to ${extractedPath}`);
}

/**
 * Sets up the Gradle wrapper for the project, detecting the OS for the correct executable.
 * @param rootDir The root directory of the Android project.
 * @param gradleVersion The version of Gradle to use.
 */
export async function setupGradleWrapper(rootDir: string, gradleVersion: string): Promise<void> {
    try {
        console.log("📦 Setting up Gradle wrapper...");
        await downloadGradle(gradleVersion);

        const gradleBinDir = path.join(
            process.cwd(),
            "gradle",
            `gradle-${gradleVersion}`,
            "bin"
        );

        // Detect OS and use the appropriate executable
        const gradleExecutable = os.platform() === 'win32' ? 'gradle.bat' : 'gradle';
        const gradleExecutablePath = path.join(gradleBinDir, gradleExecutable);

        if (!fs.existsSync(gradleExecutablePath)) {
            throw new Error(`Gradle executable not found at ${gradleExecutablePath}`);
        }

        // Make the gradle script executable on non-Windows systems
        if (os.platform() !== 'win32') {
            fs.chmodSync(gradleExecutablePath, "755");
        }

        console.log(`🚀 Executing Gradle wrapper in: ${rootDir}`);
        execSync(`"${gradleExecutablePath}" wrapper`, {
            cwd: rootDir,
            stdio: "inherit",
        });

        console.log("✅ Gradle wrapper created successfully.");
    } catch (err: any) {
        console.error("❌ Failed to create Gradle wrapper.", err.message);
        // Exit the process if wrapper creation fails, as it's a critical step
        process.exit(1);
    }
}

/**
 * Fetches the latest version of Gradle.
 * @returns A promise that resolves to the latest Gradle version string.
 */
async function getLatestGradleVersion(): Promise<string> {
  const res = await fetch('https://services.gradle.org/versions/current');
  if (!res.ok) throw new Error(`Failed to get version: ${res.statusText}`);
  const data = await res.json() as { version: string };
  return data.version;
}
