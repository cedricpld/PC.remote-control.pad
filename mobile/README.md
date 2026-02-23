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

### Development Mode

Start the Expo development server:

```bash
npx expo start
```

- Scan the QR code with the **Expo Go** app on your Android/iOS device.
- Or press `a` to run on Android Emulator / `i` for iOS Simulator.

### Building for Android (APK)

To build a standalone APK for your Android device:

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to your Expo account (free):
   ```bash
   eas login
   ```

3. Configure the build:
   ```bash
   eas build:configure
   ```

4. Run the build command:
   ```bash
   eas build -p android --profile preview
   ```

   This will generate an APK that you can download and install on your phone.

## Project Structure

- `src/components/ui`: Reusable Glassmorphic components (Buttons, Inputs, Dialogs).
- `src/components/control`: Widget components for different action types.
- `src/components/layout`: Layout components like the Sortable Grid.
- `src/screens`: Main application screens (Login, Home, Settings).
- `src/context`: State management (Auth, Theme).
- `src/utils`: API and helpers.

## Configuration

The app connects to your Control Pad Node.js server.
- Ensure your phone is on the same Wi-Fi network as the server.
- Enter the IP address and Port (default 3000) on the Login screen.
- Use the password defined in your server config.
