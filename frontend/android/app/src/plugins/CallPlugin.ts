import { registerPlugin } from '@capacitor/core';

export interface CallPluginInterface {
  startCall(options: { 
    type: 'audio' | 'video';
    callerName: string;
    isIncoming?: boolean;
  }): Promise<{ success: boolean }>;
  endCall(): Promise<{ success: boolean }>;
  toggleMute(): Promise<{ muted: boolean }>;
  toggleCamera(): Promise<{ cameraEnabled: boolean }>;
  getPermissions(): Promise<{ camera: boolean; microphone: boolean }>;
  requestPermissions(): Promise<{ camera: boolean; microphone: boolean }>;
}

const CallPlugin = registerPlugin<CallPluginInterface>('CallPlugin', {
  web: () => import('./CallPluginWeb').then(m => m.CallPluginWeb)
});

export default CallPlugin;