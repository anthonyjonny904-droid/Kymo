# KYMO CHAT (com.kymo.chat)
### Android Flutter APK & AAB Build Bundle
- **Author / Generated for**: `ogkymo@gmail.com`
- **GitHub Repository**: `anthonyjonny904-droid/Kymo`
- **Package Name**: `com.kymo.chat`
- **Version**: `1.0.0+1`

---

## 🚀 GitHub Actions Automated Debug APK Build

This repository is equipped with `.github/workflows/build-aab.yml` which automatically builds the **Debug APK (`app-debug.apk`)** on every push to `main` (no signing, no secrets, no AAB) and makes the APK artifact downloadable directly from the Actions tab.

---

## 🛠️ Local Build Instructions

### 1. Prerequisites
- **Flutter SDK 3.24+**: [flutter.dev](https://flutter.dev)
- **Java 17 JDK**
- **Android SDK 34**

### 2. Install Dependencies
```bash
flutter pub get
```

### 3. Build Android App Bundle (AAB) for Google Play
```bash
flutter build appbundle --release
# Output located at:
# build/app/outputs/bundle/release/app-release.aab
```

### 4. Build Release APK for Direct Phone Installation
```bash
flutter build apk --release
# Output located at:
# build/app/outputs/flutter-apk/app-release.apk

# Install via ADB:
adb install build/app/outputs/flutter-apk/app-release.apk
```

---

## ⚡ Cloud Functions FCM Push Notification
The Cloud Function in `functions/index.js` listens to `chats/{chatId}/messages/{messageId}` and checks `users/{receiverId}` in Firestore:
- **Suppressed**: If `recipient.isOnline && recipient.activeChatId === chatId` (real-time stream delivers it).
- **Dispatched**: If recipient is backgrounded, sends high-priority FCM payload with `channelId: "high_importance_channel"` and `click_action: "FLUTTER_NOTIFICATION_CLICK"`.
