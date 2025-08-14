// This file defines the 'jiggle' module as a standard Android Library.

plugins {
    // The 'com.android.library' plugin is essential. It tells Gradle to build this
    // module as a library, creating the 'debug' and 'release' variants that the
    // main app expects.
    id("com.android.library")

    // This plugin is needed because the module contains Kotlin code.
    id("org.jetbrains.kotlin.android")
}

android {
    // A unique identifier for this library's resources.
    namespace = "com.module.lynx.vibration"

    // It's best practice to match the compile SDK version of your main application.
    compileSdk = 35

    defaultConfig {
        // Match the minimum SDK version of your main application.
        minSdk = 28
    }

    // Standard compile options for Java/Kotlin compatibility.
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(libs.lynx)
    implementation(libs.lynx.jssdk)
    implementation(libs.lynx.trace)
    // Add any dependencies that this specific module needs to compile.
    // For the JiggleModule, we only need the standard Android/Kotlin libraries,
    // which are implicitly available through the plugins. If you were using other
    // libraries (like AppCompat), you would add them here.
}
