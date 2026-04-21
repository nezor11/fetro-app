import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { useRoute, RouteProp } from '@react-navigation/native';
import {
  getSolicitudById,
  getMetaValue,
  getMetaArray,
  formatDatePromo,
  isSolicitudVigente,
  getSolicitudEmoji,
  sanitizeSolicitudHtml,
  Solicitud,
} from '../services/solicitudes';
import FavoriteButton from '../components/FavoriteButton';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type SolicitudDetailRoute = RouteProp<RootStackParamList, 'SolicitudDetail'>;

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Detalle de una solicitud concreta.
 *
 * El formulario (Contact Form 7) se rellena en la web; aquí solo se
 * presenta info descriptiva y un CTA que abre el `guid` del post en el
 * navegador del dispositivo. Si la promoción ha caducado, el CTA queda
 * deshabilitado y se muestra un aviso.
 */
export default function SolicitudDetailScreen() {
  const route = useRoute<SolicitudDetailRoute>();
  const { cookie } = useAuth();
  const { width } = useWindowDimensions();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cookie) return;
    (async () => {
      try {
        const s = await getSolicitudById(cookie, route.params.solicitudId);
        if (!s) {
          setError('Solicitud no encontrada');
        } else {
          setSolicitud(s);
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar la solicitud');
      } finally {
        setLoading(false);
      }
    })();
  }, [cookie, route.params.solicitudId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !solicitud) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error || 'Solicitud no encontrada'}
        </Text>
      </View>
    );
  }

  const image = solicitud.app_img || solicitud.thumb_url;
  const lineas = getMetaArray(solicitud.meta, 'linea_negocio');
  const categories = getMetaArray(solicitud.meta, 'category');
  const especies = getMetaArray(solicitud.meta, 'user_especie');
  const emoji = getSolicitudEmoji(lineas);
  const datePromoRaw = getMetaValue(solicitud.meta, 'date_promo');
  const dateLabel = formatDatePromo(datePromoRaw);
  const vigente = isSolicitudVigente(solicitud);
  const moreInfo = sanitizeSolicitudHtml(
    getMetaValue(solicitud.meta, 'more_info')
  );
  const noRequiereDireccion =
    getMetaValue(solicitud.meta, 'no_requiere_direccion') === '1';

  /**
   * Abre el formulario web en el navegador externo. El usuario debería
   * estar logueado allí también; si no lo está, WP le pedirá autenticarse.
   * TODO: una vez implementemos SSO móvil-web con cookie compartida,
   * podríamos abrir en WebView sin fricción de login.
   */
  const handleSolicitar = () => {
    if (!solicitud.guid) return;

    const openUrl = () => Linking.openURL(solicitud.guid);

    if (Platform.OS === 'web') {
      window.alert(
        'El formulario se abrirá en una nueva pestaña. Si pide usuario y contraseña, inicia sesión con las mismas credenciales que usas en la app.'
      );
      window.open(solicitud.guid, '_blank');
      return;
    }

    Alert.alert(
      'Rellenar solicitud',
      'El formulario se abre en tu navegador. Si te pide usuario y contraseña, inicia sesión con las mismas credenciales que usas aquí.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir formulario', onPress: openUrl },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: SPACING.xl }}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]}>
          <Text style={styles.heroPlaceholderText}>{emoji}</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{decodeHtml(solicitud.post_title)}</Text>
        </View>

        <FavoriteButton
          data={{
            kind: 'solicitud',
            id: String(solicitud.ID),
            title: decodeHtml(solicitud.post_title),
            subtitle: dateLabel ? `Hasta ${dateLabel}` : undefined,
            imageUrl: image,
          }}
          style={{ marginBottom: SPACING.md, alignSelf: 'flex-start' }}
        />

        <View style={styles.chipsRow}>
          {dateLabel ? (
            <View
              style={[
                styles.chip,
                vigente ? styles.chipAccent : styles.chipWarn,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  vigente ? styles.chipTextAccent : styles.chipTextWarn,
                ]}
              >
                {vigente
                  ? `🗓️ Vigente hasta ${dateLabel}`
                  : `⏱️ Finalizada el ${dateLabel}`}
              </Text>
            </View>
          ) : null}
          {lineas.map((l) => (
            <View key={`l-${l}`} style={styles.chip}>
              <Text style={styles.chipText}>
                {emoji} {l}
              </Text>
            </View>
          ))}
        </View>

        {categories.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categorías</Text>
            <View style={styles.chipsRow}>
              {categories.map((c) => (
                <View key={`c-${c}`} style={styles.chip}>
                  <Text style={styles.chipText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {especies.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Especies</Text>
            <View style={styles.chipsRow}>
              {especies.map((e) => (
                <View key={`e-${e}`} style={styles.chip}>
                  <Text style={styles.chipText}>{e}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {moreInfo ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información de la promoción</Text>
            <RenderHtml
              contentWidth={width - SPACING.md * 2}
              source={{ html: moreInfo }}
              baseStyle={styles.htmlBase}
              tagsStyles={{
                p: { marginTop: 0, marginBottom: SPACING.sm },
                a: { color: COLORS.primary },
              }}
            />
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.ctaButton, !vigente && styles.ctaButtonDisabled]}
          onPress={handleSolicitar}
          disabled={!vigente}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>
            {vigente ? '📝 Rellenar solicitud' : 'Promoción finalizada'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footnote}>
          {noRequiereDireccion
            ? 'No se requerirá dirección de envío. '
            : 'El envío se hará a la dirección registrada en tu perfil. '}
          El formulario se abre en el navegador con tus datos pre-rellenados.
        </Text>
      </View>
    </ScrollView>
  );
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
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: FONTS.regular,
    color: COLORS.error,
    textAlign: 'center',
  },
  hero: {
    width: '100%',
    height: 240,
    backgroundColor: COLORS.border,
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    fontSize: 80,
  },
  content: {
    padding: SPACING.md,
  },
  titleRow: {
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONTS.title,
    fontWeight: '800',
    color: COLORS.text,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipAccent: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary + '30',
  },
  chipWarn: {
    backgroundColor: COLORS.error + '15',
    borderColor: COLORS.error + '40',
  },
  chipText: {
    fontSize: FONTS.xsmall,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  chipTextAccent: {
    color: COLORS.primary,
  },
  chipTextWarn: {
    color: COLORS.error,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.large,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  htmlBase: {
    fontSize: FONTS.regular,
    color: COLORS.text,
    lineHeight: 22,
  },
  ctaButton: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  ctaButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  ctaButtonText: {
    color: COLORS.white,
    fontSize: FONTS.regular,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footnote: {
    marginTop: SPACING.md,
    fontSize: FONTS.xsmall,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
