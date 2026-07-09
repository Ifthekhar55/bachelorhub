import type { CallPluginResult, CallPluginWebContract } from './CallPlugin'

export class CallPluginWeb implements CallPluginWebContract {
  async startCall(_options?: { type?: string; callerName?: string; isIncoming?: boolean }): Promise<CallPluginResult> {
    return { success: true, message: 'Web fallback' }
  }

  async endCall(): Promise<CallPluginResult> {
    return { success: true }
  }

  async toggleMute(): Promise<CallPluginResult> {
    return { muted: false }
  }

  async toggleCamera(): Promise<CallPluginResult> {
    return { cameraEnabled: true }
  }

  async getPermissions(): Promise<CallPluginResult> {
    return { camera: true, microphone: true }
  }

  async requestPermissions(): Promise<CallPluginResult> {
    return { camera: true, microphone: true }
  }
}

export default new CallPluginWeb()
