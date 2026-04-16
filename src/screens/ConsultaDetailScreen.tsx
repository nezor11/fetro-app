import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import {
  getSpecialities,
  findSpecialistBySlug,
  getCategoryEmoji,
  Specialist,
} from '../services/consultas';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type ConsultaDetailRoute = RouteProp<RootStackParamList, 'ConsultaDetail'>;

/**
 * Pantalla de detalle de un especialista. Recibe `groupKey + slug` por
 * params y los resuelve contra una nueva llamada a `get_specialities`
 * (barata: el payload es pequeño). Se podría cachear en el futuro si la
 * lista crece mucho.
 */
export default function ConsultaDetailScreen() {
  const route = useRoute<ConsultaDetailRoute>();
  const { cookie } = useAuth();
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cookie) return;
    (async () => {
      try {
        const map = await getSpecialities(cookie);
        const found = findSpecialistBySlug(
          map,
          route.params.groupKey,
          route.params.slug
        );
        if (!found) {
          setError('Especialista no encontrado');
        } else {
          setSpecialist(found);
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar el especialista');
      } finally {
        setLoading(false);
      }
    })();
  }, [cookie, route.params.groupKey, route.params.slug]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !specialist) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error || 'Especialista no encontrado'}
        </Text>
      </View>
    );
  }

  const emoji = getCategoryEmoji(
    specialist.linea_negocio,
    specialist.category
  );

  /**
   * Placeholder de contacto. Cuando el backend exponga un endpoint de envío
   * (ej. `post_consulta` atado al especialista + formulario), esto se
   * sustituirá por `navigation.navigate('ConsultaForm', {...})`.
   *
   * De momento: en móvil abrimos un `mailto:` genérico al buzón de
   * consultas de Fatro; en web mostramos el mismo contenido en un alert.
   */
  const handleContactar = () => {
    const subject = `Consulta para ${specialist.specialist_name.trim()} (${specialist.speciality})`;
    const body = `Hola,\n\nMe gustaría plantear una consulta sobre ${specialist.speciality} al especialista ${specialist.specialist_name.trim()}.\n\n[Escribe aquí tu consulta]\n\nGracias.`;
    const mailto = `mailto:consultas@fatroiberica.es?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    if (Platform.OS === 'web') {
      // En web, Alert.alert de react-native no funciona; además mailto abre
      // el cliente de correo del sistema igualmente.
      window.alert(
        `Próximamente podrás enviar tu consulta directamente desde la app.\n\nMientras tanto, se abrirá tu cliente de correo con un asunto pre-rellenado para ${specialist.specialist_name.trim()}.`
      );
      window.location.href = mailto;
      return;
    }

    Alert.alert(
      'Contactar con el especialista',
      `Se abrirá tu cliente de correo con un asunto pre-rellenado para ${specialist.specialist_name.trim()}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abrir correo',
          onPress: () => Linking.openURL(mailto),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: SPACING.xl }}
    >
      <View style={styles.heroWrap}>
        {specialist.thumb_url ? (
          <Image
            source={{ uri: specialist.thumb_url }}
            style={styles.hero}
          />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Text style={styles.heroPlaceholderText}>{emoji}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>
          {specialist.specialist_name.trim()}
        </Text>

        <View style={styles.chipsRow}>
          <View style={[styles.chip, styles.chipAccent]}>
            <Text style={[styles.chipText, styles.chipTextAccent]}>
              {emoji} {specialist.category}
            </Text>
          </View>
          {specialist.speciality ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>🩺 {specialist.speciality}</Text>
            </View>
          ) : null}
        </View>

        {specialist.specialist_cv ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Currículum</Text>
            <Text style={styles.paragraph}>
              {specialist.specialist_cv.trim()}
            </Text>
          </View>
        ) : null}

        {specialist.more_info ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Más información</Text>
            <Text style={styles.paragraph}>
              {specialist.more_info.trim()}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleContactar}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>
            ✉️ Contactar con el especialista
          </Text>
        </TouchableOpacity>

        <Text style={styles.footnote}>
          Las consultas se atienden por orden de llegada. Recibirás respuesta
          en el correo con el que te registraste.
        </Text>
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
  heroWrap: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  hero: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.border,
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    fontSize: 80,
  },
  content: {
    padding: SPACING.md,
  },
  name: {
    fontSize: FONTS.title,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
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
  ctaButton: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: COLORS.white,
    fontSize: FONTS.regular,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footnote: {
    marginTop: SPACING.md,
    fontSize: FONTS.xsmall,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
