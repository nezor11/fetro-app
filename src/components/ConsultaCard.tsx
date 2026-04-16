import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Specialist, getCategoryEmoji } from '../services/consultas';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface Props {
  specialist: Specialist;
  onPress: () => void;
}

/**
 * Card de especialista en el directorio de consultas. Se diseña con el
 * thumbnail a la izquierda y el contenido a la derecha (formato "fila")
 * para que quepan más por pantalla y el usuario pueda escanearlos rápido.
 */
export default function ConsultaCard({ specialist, onPress }: Props) {
  const emoji = getCategoryEmoji(
    specialist.linea_negocio,
    specialist.category
  );

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {specialist.thumb_url ? (
        <Image source={{ uri: specialist.thumb_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarPlaceholderText}>{emoji}</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {specialist.specialist_name.trim()}
        </Text>
        <View style={styles.specialityRow}>
          <Text style={styles.specialityEmoji}>{emoji}</Text>
          <Text style={styles.speciality} numberOfLines={1}>
            {specialist.speciality}
          </Text>
        </View>
        {specialist.specialist_cv ? (
          <Text style={styles.cv} numberOfLines={2}>
            {specialist.specialist_cv.trim()}
          </Text>
        ) : null}
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    padding: SPACING.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.border,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 32,
  },
  content: {
    flex: 1,
    marginLeft: SPACING.sm,
    marginRight: SPACING.xs,
  },
  name: {
    fontSize: FONTS.regular,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  specialityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  specialityEmoji: {
    fontSize: FONTS.small,
    marginRight: 4,
  },
  speciality: {
    flex: 1,
    fontSize: FONTS.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  cv: {
    fontSize: FONTS.xsmall,
    color: COLORS.textLight,
    lineHeight: 16,
  },
  chevron: {
    fontSize: 28,
    color: COLORS.textMuted,
    fontWeight: '300',
    marginLeft: 4,
  },
});
