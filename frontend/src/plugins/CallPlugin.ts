import { registerPlugin } from '@capacitor/core'

export interface CallPluginResult {
  success?: boolean
  camera?: boolean
  microphone?: boolean
  muted?: boolean
  cameraEnabled?: boolean
  message?: string
}

export interface CallPluginWebContract {
  startCall(options?: { type?: string; callerName?: string; isIncoming?: boolean }): Promise<CallPluginResult>
  endCall(): Promise<CallPluginResult>
  toggleMute(): Promise<CallPluginResult>
  toggleCamera(): Promise<CallPluginResult>
  getPermissions(): Promise<CallPluginResult>
  requestPermissions(): Promise<CallPluginResult>
}

const CallPlugin = registerPlugin<CallPluginWebContract>('CallPlugin', {
  web: () => import('./CallPluginWeb').then((module) => module.default),
})

export default CallPlugin
