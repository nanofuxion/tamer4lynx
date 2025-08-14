import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';


let projectRoot: string;
let lynxProject: string | undefined = undefined;

/**
 * This script automates the process of bundling the application and moving the output
 * to the correct Android assets directory.
 */
function bundleAndDeploy() {



    try {
        const configPath = path.join(process.cwd(), "tamer.config.json");
        if (!fs.existsSync(configPath)) {
            throw new Error("tamer.config.json not found in the project root.");
        }
        const configRaw = fs.readFileSync(configPath, "utf8");
        const config = JSON.parse(configRaw);

        if (!config?.lynxProject ) {
            lynxProject = process.cwd();
        } else lynxProject = path.join(process.cwd(), config?.lynxProject );

        
    } catch (error: any) {
        console.error(`❌ Error loading configuration: ${error.message}`);
        process.exit(1);
    }

    // const androidRoot = projectRoot!;
    const lynxRoot = lynxProject!;
    const sourceBundlePath = path.join(lynxRoot, 'dist', 'main.lynx.bundle');
    const destinationDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'assets');
    const destinationBundlePath = path.join(destinationDir, 'main.lynx.bundle');

    try {
        // 1. Run the build command
        console.log('📦 Starting the build process...');
        execSync('npm run build', { stdio: 'inherit', cwd: lynxRoot });
        console.log('✅ Build completed successfully.');

    } catch (error) {
        console.error('❌ Build process failed. Please check the errors above.');
        process.exit(1); // Exit if the build fails
    }

    try {
        // 2. Check if the source bundle exists
        if (!fs.existsSync(sourceBundlePath)) {
            console.error(`❌ Build output not found at: ${sourceBundlePath}`);
            console.error('Please ensure your build process correctly generates "main.lynx.bundle" in the "dist" directory.');
            process.exit(1);
        }

        // 3. Ensure the destination directory exists
        console.log(`📂 Ensuring destination directory exists at: ${destinationDir}`);
        fs.mkdirSync(destinationDir, { recursive: true });

        // 4. Copy the bundle to the assets directory
        console.log(`🚚 Copying bundle to Android assets...`);
        fs.copyFileSync(sourceBundlePath, destinationBundlePath);
        console.log(`✨ Successfully copied bundle to: ${destinationBundlePath}`);

    } catch (error: any) {
        console.error('❌ Failed to copy the bundle file.');
        console.error(error.message);
        process.exit(1);
    }
}
export default bundleAndDeploy

// // --- Main Execution ---
// bundleAndDeploy();
