plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.nanofuxion.lynxwebsockets"
    compileSdk = 35

    defaultConfig {
        minSdk = 28
    }

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
    implementation(libs.okhttp)
    // Add Lynx dependencies if they are not provided by the main app
    // compileOnly("org.lynxsdk.lynx:lynx:...")
    // compileOnly("org.lynxsdk.lynx:lynx-jssdk:...")
}