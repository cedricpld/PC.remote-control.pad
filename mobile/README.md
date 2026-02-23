# Control Pad Mobile

A modern, Glassmorphic React Native application for Control Pad.
Built with Expo, TypeScript, and React Native Reanimated.

## Features

- **Ergonomic Mobile UI**: Adaptive layout optimized for touch screens.
- **Glassmorphism Design**: Modern UI with blur effects and dark/light mode.
- **Full Control**: Manage Yeelight, System Volume, Audio, Shortcuts, and more.
- **Customization**: Drag & Drop interface to reorder buttons.
- **Server Management**: Connect to any Control Pad server instance.

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- **For Android Development:** Android Studio installed and configured (SDK, Emulator).
- **For iOS Development (Mac only):** Xcode installed.

## Installation

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the App

### 1. Development Mode (Expo Go)
Quickly test on your phone without installing Android Studio.

1. Start the server:
   ```bash
   npx expo start
   ```
2. Scan the QR code with the **Expo Go** app (Android/iOS).

### 2. Local Build (Android Studio) - Recommended
Builds the native APK directly on your machine.

1. Generate native android/ios folders:
   ```bash
   npx expo prebuild
   ```

2. Build and run on a connected device or emulator:
   ```bash
   npx expo run:android
   ```
   *Note: This will compile the Java/Kotlin code and install the debug APK.*

### 3. Build APK for Release (EAS)
If you prefer to use Expo's cloud build service to get a standalone APK:

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. Configure and Build:
   ```bash
   eas build -p android --profile preview
   ```

## Troubleshooting

- **"Failed to resolve plugin":** Ensure `expo-router` is removed from `app.json` (fixed in latest version).
- **Network Error:** Ensure your phone is on the same Wi-Fi as your PC. Check firewall settings.
