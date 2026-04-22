import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { getVetsicsRaces } from '../services/vetsics';
import { getTrainings } from '../services/trainings';
import { getSolicitudes } from '../services/solicitudes';
import {
  aggregateCalendarEvents,
  buildMarkedDates,
  CalendarEvent,
  EVENT_COLORS,
  EVENT_EMOJIS,
  EVENT_LABELS,
  toDateKey,
} from '../services/calendar';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../queryClient';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Configuración de locale ES para react-native-calendars. La librería
 * viene en inglés por defecto, hay que registrar los nombres de meses
 * y días nosotros. Se registra una sola vez a nivel de módulo (no en
 * cada render).
 */
LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ],
  monthNamesShort: [
    'Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.',
    'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.',
  ],
  dayNames: [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
  ],
  dayNamesShort: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

/**
 * CalendarScreen: vista agregadora de todos los eventos con fecha que
 * el usuario puede encontrar en la app (carreras VetSICS, formaciones
 * con sesiones, solicitudes con fecha de caducidad). No consume
 * endpoints nuevos: reutiliza el cache de las 3 queries existentes.
 *
 * Flujo:
 * 1. Tres `useQuery` en paralelo con las mismas keys que las pestañas
 *    correspondientes → cache compartido.
 * 2. `aggregateCalendarEvents` junta todo en una lista cronológica.
 * 3. `buildMarkedDates` produce el objeto que consume `<Calendar>`
 *    con multi-dot (un color por tipo de evento).
 * 4. Al tocar un día se filtra la lista para mostrar solo los eventos
 *    de ese día debajo del calendario.
 */
export default function CalendarScreen() {
  const navigation = useNavigation<Nav>();
  const { cookie } = useAuth();

  const vetsicsQuery = useQuery({
    queryKey: queryKeys.vetsics(cookie),
    queryFn: () => getVetsicsRaces(cookie!),
    enabled: !!cookie,
  });
  const trainingsQuery = useQuery({
    queryKey: queryKeys.trainings(cookie),
    queryFn: () => getTrainings(cookie!),
    enabled: !!cookie,
  });
  const solicitudesQuery = useQuery({
    queryKey: queryKeys.solicitudes(cookie),
    queryFn: () => getSolicitudes(cookie!),
    enabled: !!cookie,
  });

  const isLoading =
    vetsicsQuery.isLoading ||
    trainingsQuery.isLoading ||
    solicitudesQuery.isLoading;

  const events = useMemo<CalendarEvent[]>(() => {
    return aggregateCalendarEvents({
      vetsics: vetsicsQuery.data,
      trainings: trainingsQuery.data,
      solicitudes: solicitudesQuery.data,
    });
  }, [vetsicsQuery.data, trainingsQuery.data, solicitudesQuery.data]);

  // Día seleccionado. Arranca en hoy. Se guarda como string `YYYY-MM-DD`
  // porque es el formato que react-native-calendars usa nativamente.
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() =>
    toDateKey(new Date())
  );

  const markedDates = useMemo(
    () => buildMarkedDates(events, selectedDateKey),
    [events, selectedDateKey]
  );

  const eventsOfDay = useMemo(
    () => events.filter((e) => e.dateKey === selectedDateKey),
    [events, selectedDateKey]
  );

  const openEvent = (event: CalendarEvent) => {
    switch (event.kind) {
      case 'vetsics':
        navigation.navigate('VetsicsDetail', { raceId: event.id });
        break;
      case 'training':
        navigation.navigate('TrainingDetail', { trainingId: event.id });
        break;
      case 'solicitud':
        navigation.navigate('SolicitudDetail', { solicitudId: event.id });
        break;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDateKey}
        onDayPress={(day) => setSelectedDateKey(day.dateString)}
        markingType="multi-dot"
        markedDates={markedDates}
        theme={{
          backgroundColor: COLORS.white,
          calendarBackground: COLORS.white,
          textSectionTitleColor: COLORS.textMuted,
          selectedDayBackgroundColor: COLORS.primary,
          selectedDayTextColor: COLORS.white,
          todayTextColor: COLORS.primary,
          dayTextColor: COLORS.text,
          textDisabledColor: COLORS.textMuted + '55',
          arrowColor: COLORS.primary,
          monthTextColor: COLORS.text,
          textMonthFontWeight: '700',
          textDayFontWeight: '500',
          textDayHeaderFontWeight: '600',
        }}
        firstDay={1} // Semana empieza en lunes, convención española.
      />

      <View style={styles.legend}>
        {(
          [
            ['vetsics', 'VetSICS'],
            ['training', 'Formación'],
            ['solicitud', 'Solicitud'],
          ] as const
        ).map(([kind, label]) => (
          <View key={kind} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: EVENT_COLORS[kind] },
              ]}
            />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.dayHeader}>
        <Text style={styles.dayHeaderText}>
          {formatSpanishDate(selectedDateKey)}
        </Text>
        <Text style={styles.dayHeaderCount}>
          {eventsOfDay.length}{' '}
          {eventsOfDay.length === 1 ? 'evento' : 'eventos'}
        </Text>
      </View>

      <FlatList
        data={eventsOfDay}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        contentContainerStyle={{ paddingBottom: SPACING.xl }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.eventCard}
            onPress={() => openEvent(item)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.eventAccent,
                { backgroundColor: EVENT_COLORS[item.kind] },
              ]}
            />
            <View style={styles.eventBody}>
              <Text style={styles.eventKind}>
                {EVENT_EMOJIS[item.kind]} {EVENT_LABELS[item.kind]}
              </Text>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
            <Text style={styles.eventChevron}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No hay eventos este día.
            </Text>
            <Text style={styles.emptyHint}>
              Toca cualquier día con punto de color en el calendario
              para ver qué hay programado.
            </Text>
          </View>
        }
      />
    </View>
  );
}

/**
 * Convierte `"2026-04-23"` a `"jueves, 23 de abril de 2026"`. Usamos
 * Intl.DateTimeFormat que está disponible en React Native moderno
 * sin polyfills.
 */
function formatSpanishDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  try {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    // Fallback por si Intl no está disponible
    return dateKey;
  }
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
    backgroundColor: COLORS.background,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: FONTS.xsmall,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  dayHeaderText: {
    flex: 1,
    fontSize: FONTS.regular,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'capitalize',
  },
  dayHeaderCount: {
    fontSize: FONTS.xsmall,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  eventAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  eventBody: {
    flex: 1,
    padding: SPACING.sm + 2,
  },
  eventKind: {
    fontSize: FONTS.xsmall,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: FONTS.regular,
    fontWeight: '700',
    color: COLORS.text,
  },
  eventChevron: {
    fontSize: 28,
    color: COLORS.textMuted,
    fontWeight: '300',
    paddingHorizontal: SPACING.sm,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: FONTS.regular,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyHint: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});
