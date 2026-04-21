import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import RenderHtml from 'react-native-render-html';
import {
  getTrainingById,
  getMetaValue,
  getMetaArray,
  Training,
  TrainingSession,
} from '../services/trainings';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type TrainingDetailRoute = RouteProp<RootStackParamList, 'TrainingDetail'>;

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&nbsp;/g, ' ');
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return dateStr;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/**
 * Extrae el metadata específico de una sesión filtrando las claves
 * con prefijo sesions_N_ y devuelve un meta "plano" con los tags sin prefijo.
 */
function extractSessionMeta(
  parentMeta: Training['meta'],
  sessionIndex: number
) {
  const prefix = `sesions_${sessionIndex}_`;
  const clean: Record<string, string> = {};
  for (const m of parentMeta) {
    if (m.tag.startsWith(prefix)) {
      clean[m.tag.slice(prefix.length)] = m.value;
    }
  }
  return clean;
}

export default function TrainingDetailScreen() {
  const route = useRoute<TrainingDetailRoute>();
  const { width } = useWindowDimensions();
  const { cookie } = useAuth();
  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cookie) return;
    (async () => {
      try {
        const t = await getTrainingById(cookie, route.params.trainingId);
        setTraining(t);
      } catch (err: any) {
        setError(err.message || 'Error al cargar formación');
      } finally {
        setLoading(false);
      }
    })();
  }, [cookie, route.params.trainingId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !training) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Formación no encontrada'}</Text>
      </View>
    );
  }

  const image = training.thumb_url || training.app_img;
  const former = getMetaValue(training.meta, 'former');
  const trayectoria = getMetaValue(training.meta, 'trayectoria_formador');
  const description =
    getMetaValue(training.meta, 'course_description') ||
    training.post_excerpt ||
    training.post_content;
  const courseDate = getMetaValue(training.meta, 'course_date');
  const modalidades = getMetaArray(training.meta, 'modalidades');
  const especies = getMetaArray(training.meta, 'user_especie');
  const lineas = getMetaArray(training.meta, 'linea_negocio');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
      {image ? <Image source={{ uri: image }} style={styles.hero} /> : null}

      <View style={styles.content}>
        <Text style={styles.title}>{decodeHtml(training.post_title)}</Text>

        {former ? (
          <Text style={styles.former}>
            Formador/a: <Text style={styles.formerName}>{former}</Text>
          </Text>
        ) : null}

        <View style={styles.chipsRow}>
          {courseDate ? (
            <View style={[styles.chip, styles.chipAccent]}>
              <Text style={[styles.chipText, styles.chipTextAccent]}>
                📅 {formatDate(courseDate)}
              </Text>
            </View>
          ) : null}
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {training.sesions}{' '}
              {training.sesions === 1 ? 'sesión' : 'sesiones'}
            </Text>
          </View>
          {modalidades.map((m) => (
            <View key={`mod-${m}`} style={styles.chip}>
              <Text style={styles.chipText}>{m}</Text>
            </View>
          ))}
        </View>

        {trayectoria ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre el formador</Text>
            <Text style={styles.paragraph}>{decodeHtml(trayectoria)}</Text>
          </View>
        ) : null}

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

        {especies.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Especies</Text>
            <View style={styles.chipsRow}>
              {especies.map((e) => (
                <View key={`esp-${e}`} style={styles.chip}>
                  <Text style={styles.chipText}>{e}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {lineas.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Línea de negocio</Text>
            <View style={styles.chipsRow}>
              {lineas.map((l) => (
                <View key={`lin-${l}`} style={styles.chip}>
                  <Text style={styles.chipText}>{l}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {training.sesiones.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sesiones</Text>
            {training.sesiones.map((session, idx) => (
              <SessionItem
                key={session.ID}
                session={session}
                index={idx}
                parentMeta={training.meta}
              />
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function SessionItem({
  session,
  index,
  parentMeta,
}: {
  session: TrainingSession;
  index: number;
  parentMeta: Training['meta'];
}) {
  const sessionMeta = extractSessionMeta(parentMeta, index);
  const date = sessionMeta['sesion_date'] || '';
  const desc = sessionMeta['descripcion_de_la_sesion'] || '';

  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionNumberBadge}>
        <Text style={styles.sessionNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.sessionBody}>
        <Text style={styles.sessionTitle}>{decodeHtml(session.post_title)}</Text>
        {date ? (
          <Text style={styles.sessionDate}>📅 {formatDate(date)}</Text>
        ) : null}
        {desc ? (
          <Text style={styles.sessionDesc} numberOfLines={3}>
            {decodeHtml(desc)}
          </Text>
        ) : null}
      </View>
    </View>
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
    marginBottom: SPACING.sm,
  },
  former: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  formerName: {
    fontWeight: '700',
    color: COLORS.primary,
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
  chipText: {
    fontSize: FONTS.xsmall,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  chipTextAccent: {
    color: COLORS.primary,
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
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  sessionNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  sessionNumberText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: FONTS.regular,
  },
  sessionBody: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: FONTS.regular,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: FONTS.xsmall,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  sessionDesc: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
  },
});
