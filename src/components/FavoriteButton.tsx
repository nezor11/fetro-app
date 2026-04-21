import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { Favorite } from '../services/favorites';
import { useFavorites } from '../context/FavoritesContext';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface Props {
  /**
   * Todos los campos del favorito excepto `addedAt` (lo calcula el
   * context). Se pasa desde la pantalla de detalle porque es quien
   * conoce el title/subtitle/imageUrl reales.
   */
  data: Omit<Favorite, 'addedAt'>;
  /** Variantes visuales. `icon` solo el corazón (útil en header).
   *  `pill` corazón + texto ("Añadir a favoritos" / "Quitar"). */
  variant?: 'icon' | 'pill';
  style?: ViewStyle;
}

/**
 * Botón toggle de favorito. Se puede usar como icono suelto (variante
 * `icon`) o como píldora con texto (variante `pill`). Al tocarlo añade
 * o elimina del favoritos y lanza una animación breve de "latido" como
 * feedback.
 */
export default function FavoriteButton({
  data,
  variant = 'pill',
  style,
}: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(data.kind, data.id);
  // Animated scale: 1 -> 1.25 -> 1 en cada toggle para feedback táctil.
  const [scale] = useState(() => new Animated.Value(1));

  const handlePress = async () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.25,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
    await toggleFavorite(data);
  };

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.iconButton, style]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={active ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      >
        <Animated.Text style={[styles.heart, { transform: [{ scale }] }]}>
          {active ? '❤️' : '🤍'}
        </Animated.Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.pillButton, active && styles.pillButtonActive, style]}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Quitar de favoritos' : 'Añadir a favoritos'}
    >
      <Animated.Text style={[styles.pillHeart, { transform: [{ scale }] }]}>
        {active ? '❤️' : '🤍'}
      </Animated.Text>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {active ? 'En favoritos' : 'Añadir a favoritos'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    padding: SPACING.xs,
  },
  heart: {
    fontSize: 24,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs + 2,
  },
  pillButtonActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary + '30',
  },
  pillHeart: {
    fontSize: 16,
  },
  pillText: {
    fontSize: FONTS.small,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  pillTextActive: {
    color: COLORS.primary,
  },
});
