import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Training, getMetaValue, getMetaArray } from '../services/trainings';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface Props {
  training: Training;
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

/**
 * Formatea una fecha ISO (YYYY-MM-DD HH:MM:SS) a formato ES (DD/MM/YYYY).
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return dateStr;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export default function TrainingCard({ training, onPress }: Props) {
  const image = training.thumb_url || training.app_img;
  const courseDate = getMetaValue(training.meta, 'course_date');
  const former = getMetaValue(training.meta, 'former');
  const modalidades = getMetaArray(training.meta, 'modalidades');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>📚</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {decodeHtml(training.post_title)}
        </Text>

        {former ? <Text style={styles.former}>{former}</Text> : null}

        <View style={styles.metaRow}>
          {courseDate ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>📅 {formatDate(courseDate)}</Text>
            </View>
          ) : null}

          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {training.sesions} {training.sesions === 1 ? 'sesión' : 'sesiones'}
            </Text>
          </View>

          {modalidades.slice(0, 1).map((m) => (
            <View key={m} style={[styles.chip, styles.chipAccent]}>
              <Text style={[styles.chipText, styles.chipTextAccent]}>{m}</Text>
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
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONTS.large,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  former: {
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
