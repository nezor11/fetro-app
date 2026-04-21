import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFavorites } from '../context/FavoritesContext';
import {
  Favorite,
  FavoriteKind,
  FAVORITE_KIND_LABELS,
} from '../services/favorites';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Section {
  key: FavoriteKind;
  title: string;
  emoji: string;
  data: Favorite[];
}

/**
 * Lista unificada de favoritos del usuario. A diferencia de otras
 * pantallas listado, ésta NO hace peticiones: lee del
 * `FavoritesContext` y renderiza directamente. Eso la hace instantánea
 * y funcional offline.
 *
 * Cada tap navega al detalle correspondiente (`PostDetail`,
 * `ProductDetail`, `VetsicsDetail`, etc.) usando el tipo discriminado
 * `kind` del favorito.
 */
export default function FavoritesScreen() {
  const navigation = useNavigation<Nav>();
  const { favorites, isLoading } = useFavorites();

  /**
   * Orden de las secciones: el mismo que el orden visual del hub "Más"
   * para que el usuario encuentre su contenido rápido. Dentro de cada
   * sección, los más recientes primero (ya vienen así del context,
   * porque `addToList` añade al principio del array).
   */
  const SECTION_ORDER: FavoriteKind[] = [
    'post',
    'product',
    'training',
    'vetsics',
    'consulta',
    'solicitud',
  ];

  const sections = useMemo<Section[]>(() => {
    const groups: Record<FavoriteKind, Favorite[]> = {
      post: [],
      product: [],
      training: [],
      vetsics: [],
      consulta: [],
      solicitud: [],
    };
    for (const f of favorites) {
      groups[f.kind].push(f);
    }
    return SECTION_ORDER.filter((k) => groups[k].length > 0).map((k) => ({
      key: k,
      title: FAVORITE_KIND_LABELS[k].label,
      emoji: FAVORITE_KIND_LABELS[k].emoji,
      data: groups[k],
    }));
  }, [favorites]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  /**
   * Dispatcher de navegación según `kind`. Cada tipo sabe a qué ruta va
   * y con qué params. Si algún día cambian las rutas, se cambia aquí.
   */
  const openFavorite = (fav: Favorite) => {
    switch (fav.kind) {
      case 'post':
        navigation.navigate('PostDetail', { postId: Number(fav.id) });
        break;
      case 'product':
        navigation.navigate('ProductDetail', { productId: Number(fav.id) });
        break;
      case 'training':
        navigation.navigate('TrainingDetail', { trainingId: fav.id });
        break;
      case 'vetsics':
        navigation.navigate('VetsicsDetail', { raceId: fav.id });
        break;
      case 'consulta':
        navigation.navigate('ConsultaDetail', {
          groupKey: String(fav.routeParams?.groupKey ?? ''),
          slug: String(fav.routeParams?.slug ?? fav.id),
        });
        break;
      case 'solicitud':
        navigation.navigate('SolicitudDetail', { solicitudId: fav.id });
        break;
    }
  };

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => `${item.kind}-${item.id}`}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => openFavorite(item)}
          activeOpacity={0.8}
        >
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Text style={styles.thumbPlaceholderText}>
                {FAVORITE_KIND_LABELS[item.kind].emoji}
              </Text>
            </View>
          )}
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.subtitle ? (
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            ) : null}
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      )}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {section.emoji} {section.title}
          </Text>
          <Text style={styles.sectionCount}>
            {section.data.length}{' '}
            {section.data.length === 1 ? 'ítem' : 'ítems'}
          </Text>
        </View>
      )}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingVertical: SPACING.sm }}
      ListHeaderComponent={
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Tus favoritos</Text>
          <Text style={styles.introText}>
            Todo lo que has marcado con el corazón, reunido en un sitio.
            Los favoritos se guardan en tu dispositivo y funcionan sin
            conexión.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🤍</Text>
          <Text style={styles.emptyTitle}>Todavía no tienes favoritos</Text>
          <Text style={styles.emptyText}>
            Toca el corazón en cualquier detalle (carrera, especialista,
            promoción…) para guardarlo aquí y encontrarlo rápido.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  intro: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  introTitle: {
    fontSize: FONTS.title,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  introText: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    fontSize: FONTS.large,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionCount: {
    fontSize: FONTS.xsmall,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
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
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderText: {
    fontSize: 28,
  },
  cardBody: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONTS.regular,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: FONTS.xsmall,
    color: COLORS.textLight,
  },
  chevron: {
    fontSize: 28,
    color: COLORS.textMuted,
    fontWeight: '300',
    marginLeft: 4,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl * 2,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.large,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});
