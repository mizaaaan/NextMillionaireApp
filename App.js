import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

// The website this app wraps. Update this if the domain ever changes.
const SITE_URL = 'https://nextmillionaireqr.com';
const SITE_HOSTS = ['nextmillionaireqr.com', 'www.nextmillionaireqr.com'];
const BRAND_COLOR = '#54C2FE';

function getHost(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (e) {
    return null;
  }
}

export default function App() {
  const webviewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  // Keep the WebView locked to our own site. Anything else (mailto:, tel:,
  // or a link to an outside domain) opens in the system browser / mail app
  // instead of navigating away inside the app.
  const onShouldStartLoadWithRequest = useCallback((request) => {
    const host = getHost(request.url);

    if (host && SITE_HOSTS.includes(host)) {
      return true;
    }

    // Anything that isn't our own site (external links, mailto:, tel:, etc.)
    // gets handed off to the OS instead of loading inside the WebView.
    Linking.openURL(request.url).catch(() => {});
    return false;
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    webviewRef.current?.reload();
  }, []);

  // Android hardware back button should navigate the page history first,
  // and only exit the app once there's nowhere left to go back to.
  React.useEffect(() => {
    if (Platform.OS !== 'android') return undefined;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) {
        webviewRef.current?.goBack();
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  const source = useMemo(() => ({ uri: SITE_URL }), []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar style="light" />

        {!hasError && (
          <WebView
            ref={webviewRef}
            source={source}
            style={styles.webview}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
            onHttpError={(syntheticEvent) => {
              // A 4xx/5xx on the top-level page means the site didn't load
              // correctly; a failed request for a sub-resource is normal
              // and shouldn't trigger the full error screen.
              if (syntheticEvent.nativeEvent.canGoBack === undefined) return;
            }}
            pullToRefreshEnabled
            startInLoadingState={false}
            allowsBackForwardNavigationGestures
            decelerationRate="normal"
            sharedCookiesEnabled
            domStorageEnabled
            javaScriptEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
          />
        )}

        {isLoading && !hasError && (
          <View style={styles.overlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}

        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Can't reach Next Millionaire</Text>
            <Text style={styles.errorSubtitle}>
              Check your internet connection and try again.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND_COLOR,
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: BRAND_COLOR,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  retryButtonText: {
    color: BRAND_COLOR,
    fontSize: 16,
    fontWeight: '600',
  },
});
