import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
  Platform,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import RenderHtml from 'react-native-render-html';
import {
  getVetsicsRaceById,
  getMetaValue,
  getMetaArray,
  getRaceDistances,
  getRaceDate,
  isSoldOut,
  VetsicsRace,
} from '../services/vetsics';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import FavoriteButton from '../components/FavoriteButton';

type VetsicsDetailRoute = RouteProp<RootStackParamList, 'VetsicsDetail'>;

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
  const { width } = useWindowDimensions();
  const { cookie } = useAuth();
  const [race, setRace] = useState<VetsicsRace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cookie) return;
    (async () => {
      try {
        const r = await getVetsicsRaceById(cookie, route.params.raceId);
        setRace(r);
      } catch (err: any) {
        setError(err.message || 'Error al cargar carrera');
      } finally {
        setLoading(false);
      }
    })();
  }, [cookie, route.params.raceId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !race) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Carrera no encontrada'}</Text>
      </View>
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
  const idFormulario = getMetaValue(race.meta, 'id_formulario');

  const handleInscribirme = () => {
    if (soldOut) return;
    // TODO: integrar con el endpoint de inscripción real del plugin.
    // El formulario del backend se identifica por `id_formulario`.
    const title = 'Inscripción';
    const message = `Próximamente: inscripción online para "${decodeHtml(
      race.post_title
    )}" (form #${idFormulario}).`;
    if (Platform.OS === 'web') {
      // Alert.alert de react-native no funciona en web; usamos el del navegador.
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
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
          style={[styles.ctaButton, soldOut && styles.ctaButtonDisabled]}
          onPress={handleInscribirme}
          disabled={soldOut}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>
            {soldOut ? 'Plazas agotadas' : btnText}
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
  errorText: {
    fontSize: FONTS.regular,
    color: COLORS.error,
    textAlign: 'center',
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
