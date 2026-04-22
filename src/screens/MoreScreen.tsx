import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Nav = BottomTabNavigationProp<BottomTabParamList>;

interface Tile {
  /** Nombre de la tab de destino (debe existir en BottomTabParamList). */
  route: keyof BottomTabParamList;
  emoji: string;
  title: string;
  subtitle: string;
}

/**
 * Hub "Más". Rejilla de 2 columnas con las features secundarias que no caben
 * en el bottom tab bar (limitado a 5 tabs para que el texto no se corte en
 * pantallas pequeñas).
 *
 * Cada tile navega a una tab **que existe** en BottomTabParamList pero cuyo
 * botón está oculto del tab bar (ver `BottomTabs.tsx`). De esta forma:
 * - El estado de cada pantalla se conserva cuando se vuelve a "Más".
 * - Los `navigation.navigate('Vetsics', { raceId })` desde otras partes de la
 *   app siguen funcionando sin cambios.
 *
 * Cuando se añada **Solicitudes** como nueva feature, basta con:
 * 1. Registrarla como Tab.Screen con `tabBarButton: () => null` en BottomTabs.
 * 2. Añadir una entrada en el array `TILES` de abajo.
 */
const TILES: Tile[] = [
  {
    route: 'Trainings',
    emoji: '📚',
    title: 'Formación',
    subtitle: 'Webinars y formaciones técnicas',
  },
  {
    route: 'Vetsics',
    emoji: '🏃',
    title: 'VetSICS',
    subtitle: 'Carreras y eventos deportivos',
  },
  {
    route: 'Consultas',
    emoji: '👨‍⚕️',
    title: 'Consultas',
    subtitle: 'Directorio de especialistas',
  },
  {
    route: 'Solicitudes',
    emoji: '📝',
    title: 'Solicitudes',
    subtitle: 'Merchandising, muestras y promociones',
  },
  {
    route: 'Favorites',
    emoji: '❤️',
    title: 'Favoritos',
    subtitle: 'Lo que has marcado para volver después',
  },
  {
    route: 'Asistencias',
    emoji: '🎟️',
    title: 'Asistencias',
    subtitle: 'Carreras y formaciones en las que te inscribiste',
  },
  {
    route: 'CalendarTab',
    emoji: '🗓️',
    title: 'Calendario',
    subtitle: 'Vista temporal de carreras, formaciones y solicitudes',
  },
  {
    route: 'Search',
    emoji: '🔍',
    title: 'Buscar',
    subtitle: 'Encuentra contenido por palabra clave',
  },
];

export default function MoreScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.heading}>Más servicios</Text>
      <Text style={styles.subheading}>
        Todo lo que la app te ofrece, organizado en un solo sitio.
      </Text>

      <View style={styles.grid}>
        {TILES.map((tile) => (
          <TouchableOpacity
            key={tile.route}
            style={styles.tile}
            onPress={() => navigation.navigate(tile.route as never)}
            activeOpacity={0.8}
          >
            <Text style={styles.tileEmoji}>{tile.emoji}</Text>
            <Text style={styles.tileTitle}>{tile.title}</Text>
            <Text style={styles.tileSubtitle} numberOfLines={2}>
              {tile.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  heading: {
    fontSize: FONTS.title,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  subheading: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  /**
   * Cada tile ocupa ~50% del ancho menos la mitad del gap. Se calcula con
   * `flexBasis` en porcentaje para que sea responsive sin medir el viewport.
   */
  tile: {
    flexBasis: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.md,
    minHeight: 140,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tileEmoji: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  tileTitle: {
    fontSize: FONTS.large,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  tileSubtitle: {
    fontSize: FONTS.xsmall,
    color: COLORS.textLight,
    lineHeight: 16,
  },
});
