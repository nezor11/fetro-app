import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Solicitud,
  getMetaArray,
  getMetaValue,
  formatDatePromo,
  isSolicitudVigente,
  getSolicitudEmoji,
} from '../services/solicitudes';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface Props {
  solicitud: Solicitud;
  onPress: () => void;
}

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
 * Card de solicitud para el listado. Imagen principal arriba, título y
 * chips abajo. Si la promoción ha caducado se aplica una overlay de
 * atenuación + badge "FINALIZADA" para dejar claro que ya no se puede
 * solicitar, pero se muestra igualmente por valor informativo.
 */
export default function SolicitudCard({ solicitud, onPress }: Props) {
  const image = solicitud.app_img || solicitud.thumb_url;
  const lineas = getMetaArray(solicitud.meta, 'linea_negocio');
  const emoji = getSolicitudEmoji(lineas);
  const datePromoRaw = getMetaValue(solicitud.meta, 'date_promo');
  const dateLabel = formatDatePromo(datePromoRaw);
  const vigente = isSolicitudVigente(solicitud);
  const categories = getMetaArray(solicitud.meta, 'category');

  return (
    <TouchableOpacity
      style={[styles.card, !vigente && styles.cardInactive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderText}>{emoji}</Text>
          </View>
        )}
        {!vigente ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>FINALIZADA</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {decodeHtml(solicitud.post_title)}
        </Text>

        <View style={styles.chipsRow}>
          {dateLabel ? (
            <View style={[styles.chip, vigente && styles.chipAccent]}>
              <Text
                style={[
                  styles.chipText,
                  vigente && styles.chipTextAccent,
                ]}
              >
                {vigente ? '🗓️ Hasta ' : '⏱️ '}
                {dateLabel}
              </Text>
            </View>
          ) : null}
          {lineas.slice(0, 2).map((l) => (
            <View key={`l-${l}`} style={styles.chip}>
              <Text style={styles.chipText}>
                {emoji} {l}
              </Text>
            </View>
          ))}
          {categories.slice(0, 1).map((c) => (
            <View key={`c-${c}`} style={styles.chip}>
              <Text style={styles.chipText}>{c}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardInactive: {
    opacity: 0.65,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.border,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 64,
  },
  badge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: FONTS.xsmall,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  body: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONTS.large,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    backgroundColor: COLORS.background,
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
  chipText: {
    fontSize: FONTS.xsmall,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  chipTextAccent: {
    color: COLORS.primary,
  },
});
