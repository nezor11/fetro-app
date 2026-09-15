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
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RenderHtml from 'react-native-render-html';
import {
  getVetsicsRaces,
  getMetaValue,
  getMetaArray,
  getRaceDistances,
  getRaceDate,
  isSoldOut,
  isFormDisabled,
} from '../services/vetsics';
import { normalizeWebUrl } from '../services/webSession';
import { useQuery } from '@tanstack/react-query';
import ErrorState from '../components/ErrorState';
import { queryKeys } from '../queryClient';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import FavoriteButton from '../components/FavoriteButton';

type VetsicsDetailRoute = RouteProp<RootStackParamList, 'VetsicsDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

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

export default function VetsicsDetailScreen() {
  const route = useRoute<VetsicsDetailRoute>();
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const { cookie } = useAuth();
  const {
    data: race,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.vetsics(cookie),
    queryFn: () => getVetsicsRaces(cookie!),
    enabled: !!cookie,
    // Misma query que el listado: si venimos de él, el detalle sale de
    // caché sin volver a pedir nada al servidor.
    select: (list) => list.find((r) => r.ID === route.params.raceId) ?? null,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="No se pudo cargar la carrera"
        message={(error as Error).message}
        onRetry={refetch}
      />
    );
  }

  if (!race) {
    return (
      <ErrorState
        title="Carrera no encontrada"
        message="Puede que ya no esté disponible. Prueba a actualizar."
        onRetry={refetch}
        retryLabel="Actualizar"
      />
    );
  }

  const image = race.thumb_url || race.app_img;
  const subtitle = getMetaValue(race.meta, 'subtitulo_del_bloque');
  const date = getRaceDate(race);
  const distances = getRaceDistances(race.meta);
  const soldOut = isSoldOut(race);
  const btnText = getMetaValue(race.meta, 'texto_boton_formulario') || 'Inscribirme';
  const description = race.post_excerpt || race.post_content;
  const indications = getMetaValue(race.meta, 'indications');
  const moreInfo = getMetaValue(race.meta, 'more_info');
  const practical = getMetaValue(race.meta, 'practical_information');
  const contacts = getMetaValue(race.meta, 'contact_people');
  const categories = getMetaArray(race.meta, 'category');

  /**
   * La inscripción es un formulario Contact Form 7 que vive en la página
   * pública de la carrera (`guid`). Se abre dentro de la app con la
   * sesión iniciada (ver `WebFormScreen`), así llega pre-rellenado con
   * los datos del perfil. En web no hay WebView: pestaña nueva.
   */
  const formDisabled = isFormDisabled(race);
  const formUrl = race.guid ? normalizeWebUrl(race.guid) : null;
  const canRegister = !soldOut && !formDisabled && formUrl !== null;

  const handleInscribirme = () => {
    if (!canRegister || !formUrl) return;
    if (Platform.OS === 'web') {
      window.open(formUrl, '_blank');
      return;
    }
    navigation.navigate('WebForm', {
      url: formUrl,
      title: decodeHtml(race.post_title),
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: SPACING.xl }}
    >
      {image ? <Image source={{ uri: image }} style={styles.hero} /> : null}

      <View style={styles.content}>
        <Text style={styles.title}>{decodeHtml(race.post_title)}</Text>
        {subtitle ? (
          <Text style={styles.subtitle}>{decodeHtml(subtitle)}</Text>
        ) : null}

        <FavoriteButton
          data={{
            kind: 'vetsics',
            id: race.ID,
            title: decodeHtml(race.post_title),
            subtitle: date ? formatDate(date) : subtitle || undefined,
            imageUrl: image,
          }}
          style={{ marginTop: SPACING.sm, marginBottom: SPACING.md, alignSelf: 'flex-start' }}
        />

        <View style={styles.chipsRow}>
          {date ? (
            <View style={[styles.chip, styles.chipAccent]}>
              <Text style={[styles.chipText, styles.chipTextAccent]}>
                📅 {formatDate(date)}
              </Text>
            </View>
          ) : null}
          {distances.map((d) => (
            <View key={`dist-${d}`} style={styles.chip}>
              <Text style={styles.chipText}>🏃 {d}</Text>
            </View>
          ))}
          {soldOut ? (
            <View style={[styles.chip, styles.chipError]}>
              <Text style={[styles.chipText, styles.chipTextError]}>AGOTADAS</Text>
            </View>
          ) : null}
        </View>

        {description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <RenderHtml
              contentWidth={width - SPACING.md * 2}
              source={{ html: description }}
              baseStyle={styles.htmlBase}
            />
          </View>
        ) : null}

        {indications || moreInfo ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información</Text>
            <RenderHtml
              contentWidth={width - SPACING.md * 2}
              source={{ html: indications || moreInfo }}
              baseStyle={styles.htmlBase}
            />
          </View>
        ) : null}

        {practical ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información práctica</Text>
            <RenderHtml
              contentWidth={width - SPACING.md * 2}
              source={{ html: practical }}
              baseStyle={styles.htmlBase}
            />
          </View>
        ) : null}

        {contacts ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contacto</Text>
            <Text style={styles.paragraph}>{decodeHtml(contacts)}</Text>
          </View>
        ) : null}

        {categories.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categorías</Text>
            <View style={styles.chipsRow}>
              {categories.map((c) => (
                <View key={`cat-${c}`} style={styles.chip}>
                  <Text style={styles.chipText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.ctaButton, !canRegister && styles.ctaButtonDisabled]}
          onPress={handleInscribirme}
          disabled={!canRegister}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>
            {soldOut
              ? 'Plazas agotadas'
              : canRegister
                ? btnText
                : 'Inscripción no disponible'}
          </Text>
        </TouchableOpacity>
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
  hero: {
    width: '100%',
    height: 220,
    backgroundColor: COLORS.border,
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONTS.title,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.regular,
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
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
  chipError: {
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
  chipTextError: {
    color: COLORS.error,
    fontWeight: '800',
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
  paragraph: {
    fontSize: FONTS.regular,
    color: COLORS.text,
    lineHeight: 22,
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
    letterSpacing: 0.5,
  },
});
