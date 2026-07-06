package com.bachelorhub.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		// Enable WebView debugging so you can inspect with chrome://inspect
		WebView.setWebContentsDebuggingEnabled(true);

		super.onCreate(savedInstanceState);

		// Relax WebView settings to allow media playback and mixed content (if needed)
		try {
			WebView webView = (WebView) getBridge().getWebView();
			WebSettings settings = webView.getSettings();
			settings.setMediaPlaybackRequiresUserGesture(false);
			settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
		} catch (Exception ignored) {
		}
	}
}
