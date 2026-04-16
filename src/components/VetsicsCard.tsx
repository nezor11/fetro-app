import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import {
  VetsicsRace,
  getMetaValue,
  getRaceDistances,
  getRaceDate,
  isSoldOut,
} from '../services/vetsics';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface Props {
  race: VetsicsRace;
  onPress: () => void;
}

/**
 * Decodifica entidades HTML comunes que vienen en los títulos de WordPress.
 */
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

function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export default function VetsicsCard({ race, onPress }: Props) {
  const image = race.thumb_url || race.app_img;
  const distances = getRaceDistances(race.meta);
  const date = getRaceDate(race);
  const soldOut = isSoldOut(race);
  const subtitle = getMetaValue(race.meta, 'subtitulo_del_bloque');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>🏃</Text>
        </View>
      )}

      {soldOut ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>AGOTADAS</Text>
        </View>
      ) : null}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {decodeHtml(race.post_title)}
        </Text>

        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {decodeHtml(subtitle)}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {date ? (
            <View style={[styles.chip, styles.chipAccent]}>
              <Text style={[styles.chipText, styles.chipTextAccent]}>
                📅 {formatDate(date)}
              </Text>
            </View>
          ) : null}

          {distances.slice(0, 3).map((d) => (
            <View key={d} style={styles.chip}>
              <Text style={styles.chipText}>🏃 {d}</Text>
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
    marginVertical: SPACING.sm,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
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
  placeholderText: {
    fontSize: 48,
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
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONTS.large,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  chip: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  chipAccent: {
    backgroundColor: COLORS.primary + '15',
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
