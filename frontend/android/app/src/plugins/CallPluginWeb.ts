import { WebPlugin } from '@capacitor/core';
import { CallPluginInterface } from './CallPlugin';

export class CallPluginWeb extends WebPlugin implements CallPluginInterface {
  private stream: MediaStream | null = null;
  private isMuted = false;
  private isCameraOn = true;

  async startCall(options: { type: 'audio' | 'video'; callerName: string; isIncoming?: boolean }): Promise<{ success: boolean }> {
    console.log('Starting web call:', options);
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      if (options.type === 'video') {
        constraints.video = {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        };
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Dispatch event for UI
      window.dispatchEvent(new CustomEvent('callStarted', { 
        detail: { stream: this.stream, type: options.type } 
      }));

      return { success: true };
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  async endCall(): Promise<{ success: boolean }> {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    window.dispatchEvent(new CustomEvent('callEnded'));
    return { success: true };
  }

  async toggleMute(): Promise<{ muted: boolean }> {
    if (this.stream) {
      const audioTracks = this.stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      this.isMuted = !this.isMuted;
    }
    return { muted: this.isMuted };
  }

  async toggleCamera(): Promise<{ cameraEnabled: boolean }> {
    if (this.stream) {
      const videoTracks = this.stream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      this.isCameraOn = !this.isCameraOn;
    }
    return { cameraEnabled: this.isCameraOn };
  }

  async getPermissions(): Promise<{ camera: boolean; microphone: boolean }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach(track => track.stop());
      return { camera: true, microphone: true };
    } catch {
      return { camera: false, microphone: false };
    }
  }

  async requestPermissions(): Promise<{ camera: boolean; microphone: boolean }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach(track => track.stop());
      return { camera: true, microphone: true };
    } catch (error) {
      console.error('Permission denied:', error);
      return { camera: false, microphone: false };
    }
  }
}

export const CallPluginWeb = new CallPluginWeb();