import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ErrorState from '../components/ErrorState';
import { useAuth } from '../context/AuthContext';
import { API_HOST } from '../constants/api';
import {
  buildWebSessionCookieHeader,
  buildWebSessionInjectionScript,
  normalizeWebUrl,
} from '../services/webSession';
import { RootStackParamList } from '../navigation/types';
import { COLORS } from '../constants/theme';

type WebFormRoute = RouteProp<RootStackParamList, 'WebForm'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Abre una página del WordPress dentro de la app con la sesión del
 * usuario ya iniciada (ver `services/webSession.ts`). Se usa para los
 * formularios de Contact Form 7 (inscripción a carreras, solicitudes de
 * promociones) que no merece la pena replicar nativamente.
 *
 * - Los enlaces que salen del dominio de Fatro se abren en el navegador
 *   externo para no convertir la app en un navegador genérico.
 * - En web no existe WebView; las pantallas que llegan aquí usan
 *   `window.open` directamente, pero por si acaso se ofrece un botón.
 */
export default function WebFormScreen() {
  const route = useRoute<WebFormRoute>();
  const navigation = useNavigation<Nav>();
  const { cookie } = useAuth();
  const url = useMemo(() => normalizeWebUrl(route.params.url), [route.params.url]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useLayoutEffect(() => {
    if (route.params.title) {
      navigation.setOptions({ title: route.params.title });
    }
  }, [navigation, route.params.title]);

  const apiHostname = useMemo(() => hostnameOf(API_HOST), []);

  const shouldStartLoad = useCallback(
    (req: WebViewNavigation) => {
      const target = hostnameOf(req.url);
      if (!target || target === apiHostname || target.endsWith(`.${apiHostname}`)) {
        return true;
      }
      Linking.openURL(req.url).catch(() => {});
      return false;
    },
    [apiHostname]
  );

  const retry = useCallback(() => {
    setFailed(false);
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  if (Platform.OS === 'web') {
    return (
      <ErrorState
        title="Este formulario se abre en una pestaña nueva"
        message="En la versión web no es posible mostrarlo dentro de la app."
        onRetry={() => window.open(url, '_blank')}
        retryLabel="Abrir formulario"
      />
    );
  }

  if (failed) {
    return (
      <ErrorState
        title="No se pudo cargar el formulario"
        message="Comprueba tu conexión e inténtalo de nuevo."
        onRetry={retry}
      />
    );
  }

  const session = cookie
    ? {
        headers: { Cookie: buildWebSessionCookieHeader(cookie) },
        script: buildWebSessionInjectionScript(cookie),
      }
    : { headers: undefined, script: undefined };

  return (
    <View style={styles.container}>
      <WebView
        key={reloadKey}
        source={{ uri: url, headers: session.headers }}
        injectedJavaScriptBeforeContentLoaded={session.script}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        onLoadEnd={() => setLoading(false)}
        onError={() => setFailed(true)}
        onHttpError={(e) => {
          if (e.nativeEvent.statusCode >= 500) setFailed(true);
        }}
        onShouldStartLoadWithRequest={shouldStartLoad}
        style={styles.webview}
        allowsBackForwardNavigationGestures
      />
      {loading ? (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : null}
    </View>
  );
}

function hostnameOf(url: string): string | null {
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(url);
  if (!match) return null;
  return match[1].toLowerCase().replace(/:\d+$/, '');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  webview: { flex: 1, backgroundColor: COLORS.background },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});
