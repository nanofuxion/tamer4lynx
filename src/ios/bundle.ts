import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function bundleAndDeploy() {
    let lynxProject: string;
    let appName: string;

    try {
        const configPath = path.join(process.cwd(), "tamer.config.json");
        if (!fs.existsSync(configPath)) {
            throw new Error("tamer.config.json not found in the project root.");
        }
        const configRaw = fs.readFileSync(configPath, "utf8");
        const config = JSON.parse(configRaw);

        lynxProject = config.lynxProject ? path.join(process.cwd(), config.lynxProject ) : process.cwd();
        appName = config.ios?.appName;

        if (!appName) {
            throw new Error('"ios.appName" must be defined in tamer.config.json');
        }

    } catch (error: any) {
        console.error(`❌ Error loading configuration: ${error.message}`);
        process.exit(1);
    }

    const sourceBundlePath = path.join(lynxProject, 'dist', 'main.lynx.bundle');
    const destinationDir = path.join(process.cwd(), 'ios', appName);
    const destinationBundlePath = path.join(destinationDir, 'main.lynx.bundle');

    try {
        // 1. Run the build command
        console.log('📦 Starting the build process...');
        execSync('npm run build', { stdio: 'inherit', cwd: lynxProject });
        console.log('✅ Build completed successfully.');

    } catch (error) {
        console.error('❌ Build process failed. Please check the errors above.');
        process.exit(1);
    }

    try {
        // 2. Check if the source bundle exists
        if (!fs.existsSync(sourceBundlePath)) {
            console.error(`❌ Build output not found at: ${sourceBundlePath}`);
            console.error('Please ensure your build process correctly generates "main.lynx.bundle" in the "dist" directory.');
            process.exit(1);
        }

        // 3. Ensure the destination directory exists
        if (!fs.existsSync(destinationDir)) {
           console.error(`Destination directory not found at: ${destinationDir}`)
           process.exit(1)
        }

        // 4. Copy the bundle to the iOS project directory
        console.log(`🚚 Copying bundle to iOS project...`);
        fs.copyFileSync(sourceBundlePath, destinationBundlePath);
        console.log(`✨ Successfully copied bundle to: ${destinationBundlePath}`);

    } catch (error: any) {
        console.error('❌ Failed to copy the bundle file.');
        console.error(error.message);
        process.exit(1);
    }
}

export default bundleAndDeploy;