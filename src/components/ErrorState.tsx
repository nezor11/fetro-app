import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface Props {
  /** Titular corto, p.ej. "No se pudieron cargar las noticias". */
  title: string;
  /** Detalle del error (normalmente `error.message`). Opcional. */
  message?: string | null;
  /** Si se pasa, se muestra un botón "Reintentar" que lo invoca. */
  onRetry?: () => void;
  /** Texto del botón de reintento. */
  retryLabel?: string;
  /**
   * `true` para renderizarlo como bloque dentro de una lista
   * (`ListEmptyComponent`) en lugar de ocupar toda la pantalla.
   */
  inline?: boolean;
}

/**
 * Bloque de error uniforme para todas las pantallas. Sustituye a los
 * "estados vacíos" que antes se mostraban también cuando fallaba la
 * red, lo que hacía creer al usuario que no tenía inscripciones,
 * resultados o categorías cuando en realidad la petición había fallado.
 */
export default function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = 'Reintentar',
  inline = false,
}: Props) {
  return (
    <View style={inline ? styles.inline : styles.full}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry ? (
        <TouchableOpacity
          style={styles.button}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{retryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  inline: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl * 2,
  },
  emoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONTS.large,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  message: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  button: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
    borderRadius: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONTS.regular,
    fontWeight: '700',
  },
});
