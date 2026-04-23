import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import RenderHtml from 'react-native-render-html';
import {
  getQRCodeByIdentifier,
  getMetaValue,
  getMetaArray,
  getQRTypeDisplay,
} from '../services/qrcodes';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type DetailRoute = RouteProp<RootStackParamList, 'QRDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function decodeHtml(text: string): string {
  return (text || '')
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
 * Pantalla de detalle de un QR escaneado. Muestra info del
 * compromiso/recibí/acuerdo: tipo, título, descripción, taxonomías
 * relacionadas y botón para volver a escanear.
 *
 * No hay acción de "confirmar/registrar" por ahora porque el backend
 * no expone endpoint de submission de QR. Si en el futuro se añade
 * (equivalente al Android original que sí guardaba histórico de
 * escaneados en `RegistroGroup`), este es el sitio para el CTA
 * "Registrar mi escaneado".
 */
export default function QRDetailScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();
  const { cookie } = useAuth();
  const { width } = useWindowDimensions();
  const { identifier } = route.params;

  const { data: qr, isLoading, error } = useQuery({
    queryKey: ['qrcode', identifier, cookie],
    queryFn: () => getQRCodeByIdentifier(cookie!, identifier),
    enabled: !!cookie && !!identifier,
    staleTime: 10 * 60 * 1000, // 10 min — los QR cambian rara vez
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !qr) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>❓</Text>
        <Text style={styles.errorTitle}>Código no encontrado</Text>
        <Text style={styles.errorText}>
          El identificador "{identifier}" ya no está disponible o se ha
          eliminado.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.replace('QRScan')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Escanear otro QR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const qrType = getMetaValue(qr.meta, 'qr_type');
  const typeDisplay = getQRTypeDisplay(qrType);
  const categories = getMetaArray(qr.meta, 'category');
  const especies = getMetaArray(qr.meta, 'user_especie');
  const hasContent = qr.post_content && qr.post_content.trim().length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: SPACING.xl }}
    >
      {qr.thumb_url ? (
        <Image source={{ uri: qr.thumb_url }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]}>
          <Text style={styles.heroPlaceholderEmoji}>{typeDisplay.emoji}</Text>
        </View>
      )}

      <View style={styles.content}>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: typeDisplay.color + '15', borderColor: typeDisplay.color + '40' },
          ]}
        >
          <Text style={[styles.typeBadgeText, { color: typeDisplay.color }]}>
            {typeDisplay.emoji} {typeDisplay.label}
          </Text>
        </View>

        <Text style={styles.title}>{decodeHtml(qr.post_title)}</Text>

        <View style={styles.identifierRow}>
          <Text style={styles.identifierLabel}>Código:</Text>
          <Text style={styles.identifierValue}>{identifier}</Text>
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

        {hasContent ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <RenderHtml
              contentWidth={width - SPACING.md * 2}
              source={{ html: qr.post_content }}
              baseStyle={styles.htmlBase}
              tagsStyles={{
                p: { marginTop: 0, marginBottom: SPACING.sm },
                a: { color: COLORS.primary },
              }}
            />
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.replace('QRScan')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Escanear otro QR</Text>
        </TouchableOpacity>

        <Text style={styles.footnote}>
          El registro de tu escaneo lo gestiona el equipo de Fatro a
          partir del código. Si tienes dudas sobre si se ha contabilizado,
          escríbeles desde la sección de Contacto de la web.
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
  emptyEmoji: {
    fontSize: 56,
    marginBottom: SPACING.sm,
  },
  errorTitle: {
    fontSize: FONTS.large,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  hero: {
    width: '100%',
    height: 220,
    backgroundColor: COLORS.border,
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderEmoji: {
    fontSize: 80,
  },
  content: {
    padding: SPACING.md,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  typeBadgeText: {
    fontSize: FONTS.xsmall,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: FONTS.title,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  identifierRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  identifierLabel: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  identifierValue: {
    fontSize: FONTS.regular,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  section: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.small,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
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
  chipText: {
    fontSize: FONTS.xsmall,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  htmlBase: {
    fontSize: FONTS.regular,
    color: COLORS.text,
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONTS.regular,
    fontWeight: '800',
  },
  footnote: {
    marginTop: SPACING.md,
    fontSize: FONTS.xsmall,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
