import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getQRCodeByIdentifier } from '../services/qrcodes';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Pantalla de escaneo QR. Tres estados posibles:
 *
 * 1. **Permiso de cámara no concedido** → pide permiso.
 * 2. **Permiso OK** → muestra cámara en vivo con overlay de marco y
 *    escucha `onBarcodeScanned`. Al detectar un QR consulta el
 *    backend y navega a `QRDetail` si existe, o muestra error si no.
 * 3. **Fallback manual** → input de texto para introducir el
 *    identifier a mano. Útil en web (sin cámara), cuando el permiso se
 *    deniega, o si el QR está dañado/borroso.
 *
 * El estado `scanningLocked` evita que mientras estamos validando un
 * QR contra el backend, la cámara detecte el mismo frame N veces y
 * dispare navegaciones repetidas.
 *
 * Tras un error (QR no reconocido o fallo de red) el bloqueo **no** se
 * libera hasta que el usuario cierra la alerta y pasa un pequeño
 * cooldown: la cámara sigue apuntando al mismo código y, si liberásemos
 * al instante, el siguiente frame volvería a disparar petición + alerta
 * en bucle. Además se recuerda el último identifier fallido para
 * ignorarlo mientras el usuario no apunte a otro código distinto.
 */

/** Ms de gracia tras cerrar la alerta antes de volver a escanear. */
const RESCAN_COOLDOWN_MS = 1500;

/**
 * Forma esperada de un identifier de QR de Fatro: letras, dígitos,
 * guion y guion bajo, longitud acotada. Cualquier otra cosa (URLs,
 * códigos de barras de productos, texto largo) se ignora sin consultar
 * al backend.
 */
const IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function isValidIdentifier(raw: string): boolean {
  return IDENTIFIER_PATTERN.test(raw.trim());
}

export default function QRScanScreen() {
  const navigation = useNavigation<Nav>();
  const { cookie } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualIdentifier, setManualIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  // Evita navegaciones múltiples por el mismo QR.
  const scanningLockedRef = useRef(false);
  // Último identifier que falló; se ignora hasta que se escanee otro.
  const lastFailedRef = useRef<string | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  /** Libera el bloqueo de escaneo tras el cooldown. */
  const unlockAfterCooldown = () => {
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => {
      scanningLockedRef.current = false;
    }, RESCAN_COOLDOWN_MS);
  };

  /**
   * Muestra un error y solo cuando el usuario lo cierra vuelve a
   * habilitar el escaneo (con cooldown). En web `window.alert` es
   * síncrono, así que el cooldown arranca al volver de la llamada.
   */
  const showErrorAndUnlock = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      unlockAfterCooldown();
    } else {
      Alert.alert(title, message, [
        { text: 'OK', onPress: unlockAfterCooldown },
      ]);
    }
  };

  const resolveIdentifier = async (identifier: string) => {
    const trimmed = identifier.trim();
    if (!cookie || !trimmed) {
      scanningLockedRef.current = false;
      return;
    }
    setLoading(true);
    try {
      const qr = await getQRCodeByIdentifier(cookie, trimmed);
      if (!qr) {
        lastFailedRef.current = trimmed;
        showErrorAndUnlock(
          'QR no reconocido',
          `El código "${trimmed}" no coincide con ningún compromiso o merchandising registrado en Fatro. Verifica que has escaneado el correcto o intenta introducirlo manualmente.`
        );
        return;
      }
      navigation.replace('QRDetail', { identifier: trimmed });
    } catch (err: any) {
      lastFailedRef.current = trimmed;
      showErrorAndUnlock(
        'Error de conexión',
        err.message || 'Inténtalo de nuevo en unos segundos.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanningLockedRef.current || loading) return;
    const raw = (result.data || '').trim();
    // Ignoramos payloads que no tienen pinta de identifier de Fatro y
    // el mismo código que acaba de fallar (el usuario aún no ha movido
    // la cámara).
    if (!isValidIdentifier(raw) || raw === lastFailedRef.current) return;
    scanningLockedRef.current = true;
    resolveIdentifier(raw);
  };

  const handleManualSubmit = () => {
    if (loading) return;
    // La entrada manual es una acción explícita del usuario: no espera
    // al cooldown de la cámara y sí permite reintentar el mismo código.
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    lastFailedRef.current = null;
    scanningLockedRef.current = true;
    resolveIdentifier(manualIdentifier);
  };

  // Estado 1: permiso aún no pedido (valor undefined en el primer render)
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Estado 2: permiso rechazado → mostramos solo la entrada manual
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionBlock}>
          <Text style={styles.permissionEmoji}>📷</Text>
          <Text style={styles.permissionTitle}>
            Permiso de cámara no concedido
          </Text>
          <Text style={styles.permissionText}>
            Para escanear códigos QR necesitamos acceso a la cámara.
            También puedes introducir el código manualmente abajo.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Dar permiso</Text>
          </TouchableOpacity>
        </View>
        {renderManualInput()}
      </View>
    );
  }

  // Estado 3: permiso OK → mostramos cámara + fallback manual abajo
  return (
    <View style={styles.container}>
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            // Solo QR: los códigos de Fatro son siempre QR y aceptar
            // formatos de barras hacía que cualquier producto del
            // súper disparase una consulta al backend y un alert.
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.overlayBox} />
          <Text style={styles.overlayText}>
            {loading ? 'Consultando…' : 'Apunta al QR del compromiso'}
          </Text>
        </View>
        {loading ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={COLORS.white} />
          </View>
        ) : null}
      </View>
      {renderManualInput()}
    </View>
  );

  function renderManualInput() {
    return (
      <View style={styles.manualBlock}>
        <Text style={styles.manualLabel}>
          ¿No puedes escanear? Introduce el código a mano:
        </Text>
        <View style={styles.manualRow}>
          <TextInput
            style={styles.manualInput}
            value={manualIdentifier}
            onChangeText={setManualIdentifier}
            placeholder="Ej. 0001"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.manualButton,
              (!isValidIdentifier(manualIdentifier) || loading) &&
                styles.manualButtonDisabled,
            ]}
            onPress={handleManualSubmit}
            disabled={!isValidIdentifier(manualIdentifier) || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.manualButtonText}>Buscar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  cameraWrap: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBox: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: COLORS.white,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  overlayText: {
    marginTop: SPACING.md,
    color: COLORS.white,
    fontSize: FONTS.regular,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    paddingHorizontal: SPACING.md,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  permissionBlock: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    borderRadius: 12,
  },
  permissionEmoji: {
    fontSize: 56,
    marginBottom: SPACING.sm,
  },
  permissionTitle: {
    fontSize: FONTS.large,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONTS.regular,
    fontWeight: '700',
  },
  manualBlock: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  manualLabel: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  manualRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  manualInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONTS.regular,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  manualButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 10,
    justifyContent: 'center',
  },
  manualButtonDisabled: {
    opacity: 0.5,
  },
  manualButtonText: {
    color: COLORS.white,
    fontSize: FONTS.regular,
    fontWeight: '700',
  },
});
