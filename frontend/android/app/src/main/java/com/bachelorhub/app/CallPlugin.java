package com.bachelorhub.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CallPlugin")
public class CallPlugin extends Plugin {
    private static final int REQ_PERMISSIONS = 1001;
    private PluginCall pendingCall;

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        boolean camera = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
        boolean microphone = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;

        if (camera && microphone) {
            JSObject ret = new JSObject();
            ret.put("camera", true);
            ret.put("microphone", true);
            call.resolve(ret);
            return;
        }

        pendingCall = call;
        String[] permissions = new String[]{Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA};
        ActivityCompat.requestPermissions(getActivity(), permissions, REQ_PERMISSIONS);
    }

    @PluginMethod
    public void getPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("camera", ContextCompat.checkSelfPermission(getContext(), Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED);
        ret.put("microphone", ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED);
        call.resolve(ret);
    }

    @PluginMethod
    public void startCall(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("message", "Call bridge initialized");
        call.resolve(ret);
    }

    @PluginMethod
    public void endCall(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void toggleMute(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("muted", false);
        call.resolve(ret);
    }

    @PluginMethod
    public void toggleCamera(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("cameraEnabled", true);
        call.resolve(ret);
    }

    @Override
    public void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_PERMISSIONS) {
            JSObject ret = new JSObject();
            ret.put("camera", grantResults.length > 1 && grantResults[1] == PackageManager.PERMISSION_GRANTED);
            ret.put("microphone", grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED);

            if (pendingCall != null) {
                pendingCall.resolve(ret);
                pendingCall = null;
            }

            notifyListeners("permissionsChanged", ret);
        }
    }
}
