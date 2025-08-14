# Tamer4Lynx

A CLI tool for creating, linking, and bundling native modules in Lynx projects.

## Configuration
## Installation

Install globally using npm:

```bash
npm i -g nanofuxion/tamer4lynx
```

Or with Bun:

```bash
bun add -g nanofuxion/tamer4lynx
```

Tamer4Lynx uses configuration files to manage your project.

### 1. Host Application (`tamer.config.json`)

Create this file in the root of your repository to define your main application's properties.

#### Quick Init (Recommended)

You can interactively generate your config file using:

```bash
t4l init
```
Or simply run:
```bash
t4l
```
If no arguments are provided, the CLI will launch the interactive setup.

The script will prompt for:
- Android app name
- Android package name
- Android SDK path (supports `~`, `$ENV_VAR`)
- Whether to use the same name and bundle ID for iOS as Android
- iOS app name and bundle ID (if not using Android values)
- Lynx project path (relative to project root, optional)

Example output:
```json
{
  "android": {
    "appName": "MyApp",
    "packageName": "com.example.myapp",
    "sdk": "~/Library/Android/sdk"
  },
  "ios": {
    "appName": "MyApp",
    "bundleId": "com.example.MyApp"
  },
  "lynxProject": "packages/example"
}
```

---

### Show Help & Version

```bash
t4l --help
t4l --version
```

---

### **Android Commands**

#### Create a Host Android Project

```bash
t4l android create
```

#### Link Native Modules to Android

```bash
t4l android link
```

#### Bundle Native Modules for Android

```bash
t4l android bundle
```

---

### **iOS Commands**

#### Create a Host iOS Project

```bash
t4l ios create
```

#### Link Native Modules to iOS

```bash
t4l ios link
```

#### Bundle Native Modules for iOS

```bash
t4l ios bundle
```

---

### **Cross-Platform Linking**

```bash
# Link only iOS
t4l link --ios

# Link only Android
t4l link --android

# Link both iOS and Android
t4l link --both

# Silent mode (no logs)
t4l link --silent
```

---

## Automatic Linking on Install

For the best experience, add a `postinstall` script to your project's `package.json`:

```json
"scripts": {
  "postinstall": "t4l link --silent"
}
```

---

## Native Module (`tamer.json`)

Place this file in the root of each native module package you create.

```json
{
    "android": {
        "moduleClassName": "com.my-awesome-module.MyAwesomeModule",
        "sourceDir": "android"
    }
}
```

---

## Roadmap

* [ ] Fix iOS linking
* [ ] Restructure `create.ts` files

---

## Android Native Module References

Working Android native modules:

- [Jiggle: Android vibration module](https://github.com/nanofuxion/tamer4lynx/tree/main/packages/jiggle)
- [Lynx-Websockets: Android websocket module](https://github.com/nanofuxion/tamer4lynx/tree/main/packages/lynx-websockets)

---

## Examples

- [Example LynxJS project with Jiggle and Lynx-Websockets](https://github.com/nanofuxion/tamer4lynx/tree/main/packages/example)
## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

## Support

If you find this tool helpful, consider supporting its development. 

<a href="https://ko-fi.com/nanofuxion"> <img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support me on Ko-fi"> </a>