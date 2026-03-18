/**
 * PhylloConnectWebView — abre o widget Phyllo Connect dentro de um Modal WebView
 * Recebe sdkToken + userId do backend e gerencia callbacks via postMessage
 */

import React, { useRef } from 'react';
import { Modal, View, Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { borderRadius, fontSize, spacing } from '@/lib/theme';

interface PhylloConnectProps {
  visible: boolean;
  sdkToken: string;
  userId: string;
  environment: string;
  onAccountConnected: (accountId: string, workPlatformId: string, userId: string) => void;
  onClose: () => void;
}

export default function PhylloConnectWebView({
  visible,
  sdkToken,
  userId,
  environment,
  onAccountConnected,
  onClose,
}: PhylloConnectProps) {
  const { colors } = useTheme();
  const webViewRef = useRef<WebView>(null);

  // HTML que carrega o Phyllo Connect SDK e se comunica via postMessage
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          background: #0A0A0F;
          color: #fff;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .loading {
          text-align: center;
          padding: 20px;
        }
        .spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(124,58,237,0.2);
          border-top-color: #7C3AED;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error { color: #EF4444; padding: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="loading" id="status">
        <div class="spinner"></div>
        <p>Carregando conexao...</p>
      </div>

      <script src="https://cdn.getphyllo.com/connect/v2/phyllo-connect.js"></script>
      <script>
        (function() {
          function send(type, data) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
          }

          try {
            var phyllo = PhylloConnect.initialize({
              clientDisplayName: "Brandly",
              environment: "${environment}",
              userId: "${userId}",
              token: "${sdkToken}",
            });

            phyllo.on("accountConnected", function(accountId, workPlatformId, userId) {
              send("accountConnected", { accountId: accountId, workPlatformId: workPlatformId, userId: userId });
            });

            phyllo.on("accountDisconnected", function(accountId, workPlatformId, userId) {
              send("accountDisconnected", { accountId: accountId, workPlatformId: workPlatformId, userId: userId });
            });

            phyllo.on("tokenExpired", function(userId) {
              send("tokenExpired", { userId: userId });
            });

            phyllo.on("exit", function(reason, userId) {
              send("exit", { reason: reason, userId: userId });
            });

            phyllo.open();
          } catch(e) {
            document.getElementById("status").innerHTML = '<p class="error">Erro: ' + e.message + '</p>';
            send("error", { message: e.message });
          }
        })();
      </script>
    </body>
    </html>
  `;

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'accountConnected':
          onAccountConnected(data.accountId, data.workPlatformId, data.userId);
          onClose();
          break;
        case 'accountDisconnected':
        case 'tokenExpired':
        case 'exit':
        case 'error':
          onClose();
          break;
      }
    } catch {
      // ignore parse errors
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Conectar Rede Social</Text>
          <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceLight }]}>
            <Feather name="x" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
