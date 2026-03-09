# Control Pad Mobile (Android Native)

This is the native Android client for the Control Pad system, built with **Kotlin** and **Jetpack Compose**.

## Features

- **Native Performance:** Written in pure Kotlin for optimal speed and reliability on Android.
- **Glassmorphism UI:** Modern interface using Jetpack Compose with custom glass-effect components.
- **Full Control:** Supports Yeelight, Shortcuts, Audio commands, and System monitoring.
- **Persistence:** Remembers your server IP and Auth Token.
- **Dark Mode:** Optimized for OLED screens.

## Prerequisites

- **Android Studio** (Koala or newer recommended).
- JDK 17 (bundled with Android Studio).
- An Android device or Emulator (API 26+).

## Setup & Build Instructions

1.  **Open Project:**
    *   Launch Android Studio.
    *   Select **File > Open...**
    *   Navigate to the `mobile/` directory of this repository and click **OK**.
    *   *Wait for Gradle Sync to finish (this may take a few minutes).*

2.  **Run on Device:**
    *   Connect your Android phone via USB (ensure Developer Options > USB Debugging is ON).
    *   OR create an Android Virtual Device (AVD) in Device Manager.
    *   Select your device in the toolbar dropdown.
    *   Click the green **Play** button (Run 'app').

3.  **Troubleshooting:**
    *   *Gradle Sync Failed?* Check your internet connection or JDK version in Settings > Build, Execution, Deployment > Build Tools > Gradle.
    *   *Connection Refused?* Ensure your phone is on the same Wi-Fi network as your PC server. Check the IP address in `LoginScreen`.

## Project Structure

*   `app/src/main/java/com/controlpad/mobile/`
    *   `data/`: API models, Retrofit service, and DataStore repository.
    *   `ui/theme/`: Colors, Typography, and Theme definition.
    *   `ui/components/`: Reusable UI widgets (`GlassBox`, `ControlBlockItem`).
    *   `ui/screens/`: Feature screens (`LoginScreen`, `HomeScreen`).
    *   `MainActivity.kt`: Entry point and Navigation host.

## Development

- This project uses **Jetpack Compose** for UI (no XML layouts).
- Networking is handled by **Retrofit** and **OkHttp**.
- Data persistence uses **DataStore** (Preferences).
