import fs from "fs";
import path from "path";
import os from "os"; // Import the 'os' module
import { setupGradleWrapper } from "./getGradle";

const create = () => {
    // --- Configuration Loading ---

    let osName: string = "android"; // Renamed to avoid conflict with 'os' module
    let appName: string;
    let packageName: string;
    let androidSdk: string | undefined;

    try {
        const configPath = path.join(process.cwd(), "tamer.config.json");
        if (!fs.existsSync(configPath)) {
            throw new Error("tamer.config.json not found in the project root.");
        }
        const configRaw = fs.readFileSync(configPath, "utf8");
        const config = JSON.parse(configRaw);
        packageName = config.android?.packageName;
        appName = config.android?.appName;
        androidSdk = config.android?.sdk;

        // MODIFICATION: Normalize the SDK path if it starts with a tilde (~)
        if (androidSdk && androidSdk.startsWith("~")) {
            androidSdk = androidSdk.replace(/^~/, os.homedir());
        }

        if (!appName || !packageName) {
            throw new Error(
                '"android.appName" and "android.packageName" must be defined in tamer.config.json'
            );
        }
    } catch (error: any) {
        console.error(`❌ Error loading configuration: ${error.message}`);
        process.exit(1);
    }

    // --- Project Setup ---

    const kotlinDir = packageName.replace(/\./g, "/");
    const gradleVersion = "8.14.2";

    const rootDir = path.join(process.cwd(), osName);
    const appDir = path.join(rootDir, "app");
    const mainDir = path.join(appDir, "src", "main");
    const javaDir = path.join(mainDir, "kotlin", kotlinDir);
    const kotlinGeneratedDir = path.join(javaDir, "generated");
    const assetsDir = path.join(mainDir, "assets");
    const themesDir = path.join(mainDir, "res", "values");
    const gradleDir = path.join(rootDir, "gradle");

    interface WriteFileOptions {
        encoding?: BufferEncoding;
        mode?: number;
        flag?: string;
    }

    function writeFile(
        filePath: string,
        content: string,
        options?: WriteFileOptions
    ): void {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(
            filePath,
            content.trimStart(),
            options?.encoding ?? "utf8"
        );
    }

    // Clean up previous generation if it exists
    if (fs.existsSync(rootDir)) {
        console.log(`🧹 Removing existing directory: ${rootDir}`);
        fs.rmSync(rootDir, { recursive: true, force: true });
    }

    console.log(`🚀 Creating a new Tamer4Lynx project in: ${rootDir}`);

    // --- Start File Generation ---

    // gradle/libs.versions.toml
    writeFile(
        path.join(gradleDir, "libs.versions.toml"),
        `
[versions]
agp = "8.9.1"
commonsCompress = "1.26.1"
commonsLang3 = "3.14.0"
fresco = "2.3.0"
kotlin = "2.0.21"
coreKtx = "1.10.1"
junit = "4.13.2"
junitVersion = "1.1.5"
espressoCore = "3.5.1"
appcompat = "1.6.1"
lynx = "3.3.1"
material = "1.10.0"
activity = "1.8.0"
constraintlayout = "2.1.4"
okhttp = "4.9.0"
primjs = "2.12.0"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
animated-base = { module = "com.facebook.fresco:animated-base", version.ref = "fresco" }
animated-gif = { module = "com.facebook.fresco:animated-gif", version.ref = "fresco" }
animated-webp = { module = "com.facebook.fresco:animated-webp", version.ref = "fresco" }
commons-compress = { module = "org.apache.commons:commons-compress", version.ref = "commonsCompress" }
commons-lang3 = { module = "org.apache.commons:commons-lang3", version.ref = "commonsLang3" }
fresco = { module = "com.facebook.fresco:fresco", version.ref = "fresco" }
junit = { group = "junit", name = "junit", version.ref = "junit" }
androidx-junit = { group = "androidx.test.ext", name = "junit", version.ref = "junitVersion" }
androidx-espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version.ref = "espressoCore" }
androidx-appcompat = { group = "androidx.appcompat", name = "appcompat", version.ref = "appcompat" }
lynx = { module = "org.lynxsdk.lynx:lynx", version.ref = "lynx" }
lynx-jssdk = { module = "org.lynxsdk.lynx:lynx-jssdk", version.ref = "lynx" }
lynx-processor = { module = "org.lynxsdk.lynx:lynx-processor", version.ref = "lynx" }
lynx-service-http = { module = "org.lynxsdk.lynx:lynx-service-http", version.ref = "lynx" }
lynx-service-image = { module = "org.lynxsdk.lynx:lynx-service-image", version.ref = "lynx" }
lynx-service-log = { module = "org.lynxsdk.lynx:lynx-service-log", version.ref = "lynx" }
lynx-trace = { module = "org.lynxsdk.lynx:lynx-trace", version.ref = "lynx" }
material = { group = "com.google.android.material", name = "material", version.ref = "material" }
androidx-activity = { group = "androidx.activity", name = "activity", version.ref = "activity" }
androidx-constraintlayout = { group = "androidx.constraintlayout", name = "constraintlayout", version.ref = "constraintlayout" }
okhttp = { module = "com.squareup.okhttp3:okhttp", version.ref = "okhttp" }
primjs = { module = "org.lynxsdk.lynx:primjs", version.ref = "primjs" }
webpsupport = { module = "com.facebook.fresco:webpsupport", version.ref = "fresco" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-kapt = { id = "org.jetbrains.kotlin.kapt", version.ref = "kotlin" }
`
    );

    // settings.gradle.kts (with GENERATED block)
    writeFile(
        path.join(rootDir, "settings.gradle.kts"),
        `
pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${appName}"
include(":app")

// GENERATED AUTOLINK START
// This section is automatically generated by Tamer4Lynx.
// Manual edits will be overwritten.
println("If you have native modules please run tamer android link")
// GENERATED AUTOLINK END
`
    );

    // Root build.gradle
    writeFile(
        path.join(rootDir, "build.gradle.kts"),
        `
// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
}
`
    );

    // gradle.properties
    writeFile(
        path.join(rootDir, "gradle.properties"),
        `
org.gradle.jvmargs=-Xmx2048m
android.useAndroidX=true
kotlin.code.style=official
android.enableJetifier=true
`
    );

    // app/build.gradle.kts (UPDATED)
    writeFile(
        path.join(appDir, "build.gradle.kts"),
        `
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    id("org.jetbrains.kotlin.kapt")
}

android {
    namespace = "${packageName}"
    compileSdk = 35

    defaultConfig {
        applicationId = "${packageName}"
        minSdk = 28
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        ndk {
            abiFilters += listOf("armeabi-v7a", "arm64-v8a")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    sourceSets {
        getByName("main") {
            jniLibs.srcDirs("src/main/jniLibs")
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.constraintlayout)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    implementation(libs.lynx)
    implementation(libs.lynx.jssdk)
    implementation(libs.lynx.trace)
    implementation(libs.primjs)
    implementation(libs.lynx.service.image)
    implementation(libs.fresco)
    implementation(libs.animated.gif)
    implementation(libs.animated.webp)
    implementation(libs.webpsupport)
    implementation(libs.animated.base)
    implementation(libs.lynx.service.log)
    implementation(libs.lynx.service.http)
    implementation(libs.okhttp)
    kapt(libs.lynx.processor)
    implementation(libs.commons.lang3)
    implementation(libs.commons.compress)

    // GENERATED AUTOLINK DEPENDENCIES START
    // This section is automatically generated by Tamer4Lynx.
    // Manual edits will be overwritten.
    // GENERATED AUTOLINK DEPENDENCIES END
}
`
    );

    // themes.xml
    writeFile(
        path.join(themesDir, "themes.xml"),
        `
<resources>
    <style name="Theme.MyApp" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:windowLightStatusBar">false</item>
        <item name="android:navigationBarColor">@android:color/transparent</item>
    </style>
</resources>
`
    );

    // AndroidManifest.xml
    writeFile(
        path.join(mainDir, "AndroidManifest.xml"),
        `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:name=".Application"
        android:label="${appName}"
        android:usesCleartextTraffic="true"
        android:theme="@style/Theme.MyApp">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`
    );

    // Placeholder GeneratedLynxExtensions.kt
    writeFile(
        path.join(kotlinGeneratedDir, "GeneratedLynxExtensions.kt"),
        `
package ${packageName}.generated

import android.content.Context
import com.lynx.tasm.LynxEnv

/**
 * This file is generated by the Tamer4Lynx autolinker.
 * Do not edit this file manually.
 */
object GeneratedLynxExtensions {
    fun register(context: Context) {
        // This will be populated by the autolinker.
    }
}
`
    );

    // Application.kt (Cleaned up to use the generated file)
    writeFile(
        path.join(javaDir, "Application.kt"),
        `
package ${packageName}

import android.app.Application
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.imagepipeline.core.ImagePipelineConfig
import com.facebook.imagepipeline.memory.PoolConfig
import com.facebook.imagepipeline.memory.PoolFactory
import com.lynx.service.http.LynxHttpService
import com.lynx.service.image.LynxImageService
import com.lynx.service.log.LynxLogService
import com.lynx.tasm.LynxEnv
import com.lynx.tasm.service.LynxServiceCenter
import ${packageName}.generated.GeneratedLynxExtensions

class Application : Application() {
    override fun onCreate() {
        super.onCreate()
        initLynxService()
        initLynxEnv()
    }

    private fun initLynxService() {
        // init Fresco which is needed by LynxImageService
        val factory = PoolFactory(PoolConfig.newBuilder().build())
        val builder =
            ImagePipelineConfig.newBuilder(applicationContext).setPoolFactory(factory)
        Fresco.initialize(applicationContext, builder.build())

        LynxServiceCenter.inst().registerService(LynxImageService.getInstance())
        LynxServiceCenter.inst().registerService(LynxLogService)
        LynxServiceCenter.inst().registerService(LynxHttpService)
    }

    private fun initLynxEnv() {
        // Register all autolinked modules and components first
        GeneratedLynxExtensions.register(this)

        LynxEnv.inst().init(
            this,
            null,
            TemplateProvider(this),
            null
        )
    }
}
`
    );

    // TemplateProvider.kt
    writeFile(
        path.join(javaDir, "TemplateProvider.kt"),
        `
package ${packageName}

import android.content.Context
import com.lynx.tasm.provider.AbsTemplateProvider
import java.io.ByteArrayOutputStream
import java.io.IOException

class TemplateProvider(context: Context) : AbsTemplateProvider() {
    private val mContext: Context = context.applicationContext

    override fun loadTemplate(uri: String, callback: Callback) {
        Thread {
            try {
                mContext.assets.open(uri).use { inputStream ->
                    ByteArrayOutputStream().use { byteArrayOutputStream ->
                        val buffer = ByteArray(1024)
                        var length: Int
                        while (inputStream.read(buffer).also { length = it } != -1) {
                            byteArrayOutputStream.write(buffer, 0, length)
                        }
                        callback.onSuccess(byteArrayOutputStream.toByteArray())
                    }
                }
            } catch (e: IOException) {
                callback.onFailed(e.message)
            }
        }.start()
    }
}
`
    );

    // MainActivity.kt
    writeFile(
        path.join(javaDir, "MainActivity.kt"),
        `
package ${packageName}

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.core.view.updatePadding
import com.lynx.tasm.LynxView
import com.lynx.tasm.LynxViewBuilder

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = true
        val lynxView = buildLynxView()
        setContentView(lynxView)
        androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(lynxView) { view, insets ->
            val imeVisible = insets.isVisible(WindowInsetsCompat.Type.ime())
            val imeHeight = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
            view.updatePadding(bottom = if (imeVisible) imeHeight else 0)
            insets
        }
        val uri = "main.lynx.bundle"
        lynxView.renderTemplateUrl(uri, "")
    }

    private fun buildLynxView(): LynxView {
        val viewBuilder = LynxViewBuilder()
        viewBuilder.setTemplateProvider(TemplateProvider(this))
        return viewBuilder.build(this)
    }
}
`
    );

    // Create an empty assets directory so the project builds correctly
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(path.join(assetsDir, ".gitkeep"), "");

    console.log(`✅ Android Kotlin project created at ${rootDir}`);

    async function finalizeProjectSetup() {
        if (androidSdk) {
            try {
                const sdkDirContent = `sdk.dir=${androidSdk.replace(/\\/g, "/")}`;
                writeFile(path.join(rootDir, "local.properties"), sdkDirContent);
                console.log("📦 Created local.properties from tamer.config.json.");
            } catch (err: any) {
                console.error(`❌ Failed to create local.properties: ${err.message}`);
            }
        } else {
            const localPropsPath = path.join(process.cwd(), "local.properties");
            if (fs.existsSync(localPropsPath)) {
                try {
                    fs.copyFileSync(localPropsPath, path.join(rootDir, "local.properties"));
                    console.log("📦 Copied existing local.properties to the android project.");
                } catch (err) {
                    console.error("❌ Failed to copy local.properties:", err);
                }
            } else {
                console.warn(
                    "⚠️ `android.sdk` not found in tamer.config.json. You may need to create local.properties manually."
                );
            }
        }

        // The Gradle wrapper setup logic is now handled by the imported function
        await setupGradleWrapper(rootDir, gradleVersion);
    }

    finalizeProjectSetup();
};
export default create;