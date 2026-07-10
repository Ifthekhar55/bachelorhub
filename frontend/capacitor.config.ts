{
  "appId": "com.bachelorhub.app",
  "appName": "BachelorHub",
  "webDir": "www",
  "android": {
    "allowMixedContent": true,
    "webContentsDebuggingEnabled": true,
    "captureInput": true,
    "allowClearText": true
  },
  "server": {
    "androidScheme": "https",
    "iosScheme": "capacitor",
    "allowNavigation": ["*"]
  },
  "plugins": {
    "Camera": {
      "permissions": {
        "camera": true,
        "microphone": true
      }
    },
    "Audio": {
      "permissions": {
        "recordAudio": true
      }
    }
  }
}