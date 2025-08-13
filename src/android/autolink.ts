import fs from 'fs';
import path from 'path';

const autolink = () => {

    // --- Interfaces ---

    interface TamerConfig {
        android?: {
            moduleClassName?: string;
            sourceDir?: string;
        };
        ios?: {};
    }

    interface DiscoveredPackage {
        name: string;
        config: TamerConfig;
        packagePath: string;
    }

    // --- Configuration Loading ---

    let os: string = 'android';
    let packageName: string;

    try {
        const configPath = path.join(process.cwd(), 'tamer.config.json');
        if (!fs.existsSync(configPath)) {
            throw new Error('tamer.config.json not found in the project root.');
        }
        const configRaw = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configRaw);
        packageName = config.android?.packageName;

        if (!packageName) {
            throw new Error('"android.packageName" must be defined in tamer.config.json');
        }
    } catch (error: any) {
        console.error(`❌ Error loading configuration: ${error.message}`);
        process.exit(1);
    }

    // --- Constants & Paths ---

    const projectRoot = process.cwd();
    const nodeModulesPath = path.join(projectRoot, 'node_modules');
    const appAndroidPath = path.join(projectRoot, os);

    // --- Core Logic ---

    /**
     * Replaces the content of a file between specified start and end markers.
     * @param filePath The path to the file to update.
     * @param newContent The new content to insert between the markers.
     * @param startMarker The starting delimiter.
     * @param endMarker The ending delimiter.
     */
    function updateGeneratedSection(filePath: string, newContent: string, startMarker: string, endMarker: string): void {
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ File not found, skipping update: ${filePath}`);
            return;
        }

        let fileContent = fs.readFileSync(filePath, 'utf8');
        // Escape special characters in markers for RegExp
        const escapedStartMarker = startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedEndMarker = endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const regex = new RegExp(`${escapedStartMarker}[\\s\\S]*?${escapedEndMarker}`, 'g');
        const replacementBlock = `${startMarker}\n${newContent}\n${endMarker}`;

        if (regex.test(fileContent)) {
            fileContent = fileContent.replace(regex, replacementBlock);
        } else {
            console.warn(`⚠️ Could not find autolink markers in ${path.basename(filePath)}. Appending to the end of the file.`);
            fileContent += `\n${replacementBlock}\n`;
        }

        fs.writeFileSync(filePath, fileContent);
        console.log(`✅ Updated autolinked section in ${path.basename(filePath)}`);
    }

    /**
     * Finds all packages in node_modules that contain a tamer.json file.
     */
    function findTamerPackages(): DiscoveredPackage[] {
        const packages: DiscoveredPackage[] = [];
        if (!fs.existsSync(nodeModulesPath)) {
            console.warn('⚠️ node_modules directory not found. Skipping autolinking.');
            return [];
        }

        const packageDirs = fs.readdirSync(nodeModulesPath);

        for (const dirName of packageDirs) {
            const fullPath = path.join(nodeModulesPath, dirName);
            const checkPackage = (name: string, packagePath: string) => {
                const tamerConfigPath = path.join(packagePath, 'tamer.json');
                if (fs.existsSync(tamerConfigPath)) {
                    try {
                        const configRaw = fs.readFileSync(tamerConfigPath, 'utf8');
                        const config = JSON.parse(configRaw);
                        packages.push({ name, config, packagePath });
                    } catch (e: any) {
                        console.warn(`⚠️  Skipping package "${name}" due to invalid tamer.json: ${e.message}`);
                    }
                }
            };

            if (dirName.startsWith('@')) {
                // Handle scoped packages like @my-org/my-package
                try {
                    const scopedDirs = fs.readdirSync(fullPath);
                    for (const scopedDirName of scopedDirs) {
                        const scopedPackagePath = path.join(fullPath, scopedDirName);
                        const name = `${dirName}/${scopedDirName}`;
                        checkPackage(name, scopedPackagePath);
                    }
                } catch (e: any) {
                    console.warn(`⚠️ Could not read scoped package directory ${fullPath}: ${e.message}`);
                }
            } else {
                // Handle regular packages
                checkPackage(dirName, fullPath);
            }
        }

        return packages;
    }

    /**
     * Generates the Gradle settings script content and updates settings.gradle.kts.
     * @param packages The list of discovered native packages.
     */
    function updateSettingsGradle(packages: DiscoveredPackage[]): void {
        const settingsFilePath = path.join(appAndroidPath, 'settings.gradle.kts');
        let scriptContent = `// This section is automatically generated by Tamer4Lynx.\n// Manual edits will be overwritten.`;

        const androidPackages = packages.filter(p => p.config.android);

        if (androidPackages.length > 0) {
            androidPackages.forEach(pkg => {
                // Sanitize package name for Gradle: @org/name -> org_name
                const gradleProjectName = pkg.name.replace(/^@/, '').replace(/\//g, '_');
                const sourceDir = pkg.config.android?.sourceDir || 'android';
                // Use forward slashes for Gradle paths, even on Windows
                const projectPath = path.join(pkg.packagePath, sourceDir).replace(/\\/g, '/');
                const relativePath = path.relative(appAndroidPath, projectPath).replace(/\\/g, '/');

                scriptContent += `\ninclude(":${gradleProjectName}")`;
                scriptContent += `\nproject(":${gradleProjectName}").projectDir = file("${relativePath}")`;
            });
        } else {
            scriptContent += `\nprintln("No native modules found by Tamer4Lynx autolinker.")`;
        }

        updateGeneratedSection(settingsFilePath, scriptContent.trim(), '// GENERATED AUTOLINK START', '// GENERATED AUTOLINK END');
    }

    /**
     * Generates the app-level dependencies and updates app/build.gradle.kts.
     * @param packages The list of discovered native packages.
     */
    function updateAppBuildGradle(packages: DiscoveredPackage[]) {
        const appBuildGradlePath = path.join(appAndroidPath, 'app', 'build.gradle.kts');
        const androidPackages = packages.filter(p => p.config.android);

        const implementationLines = androidPackages
            .map(p => {
                // Sanitize package name for Gradle: @org/name -> org_name
                const gradleProjectName = p.name.replace(/^@/, '').replace(/\//g, '_');
                return `    implementation(project(":${gradleProjectName}"))`;
            })
            .join('\n');

        const scriptContent = `// This section is automatically generated by Tamer4Lynx.\n    // Manual edits will be overwritten.\n${implementationLines || '    // No native dependencies found to link.'}`;

        updateGeneratedSection(
            appBuildGradlePath,
            scriptContent,
            '// GENERATED AUTOLINK DEPENDENCIES START',
            '// GENERATED AUTOLINK DEPENDENCIES END'
        );
    }

    /**
     * Generates a self-contained GeneratedLynxExtensions.kt file with all necessary imports and registrations.
     * @param packages The list of discovered native packages.
     * @param projectPackage The package name of the main Android app, from tamer.config.json.
     */
    function generateKotlinExtensionsFile(packages: DiscoveredPackage[], projectPackage: string): void {
        const packagePath = projectPackage.replace(/\./g, '/');
        const generatedDir = path.join(appAndroidPath, 'app', 'src', 'main', 'kotlin', packagePath, 'generated');
        const kotlinExtensionsPath = path.join(generatedDir, 'GeneratedLynxExtensions.kt');

        const modulePackages = packages.filter(p => p.config.android?.moduleClassName);

        const imports = modulePackages
            .map(p => `import ${p.config.android!.moduleClassName}`)
            .join('\n');

        const registrations = modulePackages
            .map(p => {
                const fullClassName = p.config.android!.moduleClassName!;
                // Use the package name as the module name to avoid collisions
                const moduleName = p.name;
                const simpleClassName = fullClassName.split('.').pop()!;
                return `        LynxEnv.inst().registerModule("${simpleClassName}", ${simpleClassName}::class.java)`;
            })
            .join('\n');

        const kotlinContent = `package ${projectPackage}.generated

import android.content.Context
import com.lynx.tasm.LynxEnv
${imports}

/**
 * This file is generated by the Tamer4Lynx autolinker.
 * Do not edit this file manually.
 */
object GeneratedLynxExtensions {
    fun register(context: Context) {
${registrations || '        // No native modules found to register.'}
    }
}
`;
        // Ensure the `generated` directory exists before writing the file
        fs.mkdirSync(generatedDir, { recursive: true });
        fs.writeFileSync(kotlinExtensionsPath, kotlinContent.trimStart());
        console.log(`✅ Generated Kotlin extensions at ${kotlinExtensionsPath}`);
    }


    // --- Main Execution ---

    function run() {
        console.log('🔎 Finding Tamer4Lynx native packages...');
        const packages = findTamerPackages();

        if (packages.length > 0) {
            console.log(`Found ${packages.length} package(s): ${packages.map(p => p.name).join(', ')}`);
        } else {
            console.log('ℹ️ No Tamer4Lynx native packages found.');
        }

        updateSettingsGradle(packages);
        updateAppBuildGradle(packages);
        generateKotlinExtensionsFile(packages, packageName);

        console.log('✨ Autolinking complete.');
    }

    run();
}
export default autolink;