import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { palette, spacing, radii, shadow, typography } from '../../constants/theme';
import { getAppointments } from '../../constants/api'; 
import { api } from '../../constants/api';

// ---- date helpers
const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};
const endOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
};
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

// ---- calendar grid
const buildMonthGrid = (calendarMonth: Date) => {
  const firstDay = startOfMonth(calendarMonth);
  const startWeekday = firstDay.getDay(); // 0 Sun ... 6 Sat
  const shiftToMonday = (w: number) => (w === 0 ? 6 : w - 1); // Mon=0 ... Sun=6
  const leadingBlanks = shiftToMonday(startWeekday);
  const daysInMonth = endOfMonth(firstDay).getDate();

  const cells: (number | null)[] = Array(leadingBlanks).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

export default function HomeScreen() {
  const router = useRouter();

  // TEMP user placeholder to avoid undefined references
  const [me] = useState<any>(null);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout'); // backend does not has this!
    } catch (e) {
      // ignore
    } finally {
      router.replace('/(tabs)/LoginScreen'); // navigate to login page
    }
  };
  
  // calendar state
  const today = useMemo(() => startOfDay(new Date()), []);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));

  // data state
  const [monthAppointments, setMonthAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // derived
  const monthLabel = useMemo(
    () => calendarMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    [calendarMonth]
  );
  const daysGrid = useMemo(() => buildMonthGrid(calendarMonth), [calendarMonth]);

  // fetch appointments for the visible month
  const fetchMonthAppointments = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const start = startOfMonth(calendarMonth).toISOString();
      const end = endOfMonth(calendarMonth).toISOString();

      // Adjust this call if your API is different:
      const res = await getAppointments({ start, end });
      // normalize defensively
      const items = Array.isArray(res?.appointments) ? res.appointments : Array.isArray(res) ? res : [];
      setMonthAppointments(items);
    } catch (e: any) {
      console.error('Failed to load appointments:', e);
      setError(e?.response?.data?.error || 'Failed to load appointments.');
      setMonthAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [calendarMonth]);

  useEffect(() => {
    fetchMonthAppointments();
  }, [fetchMonthAppointments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMonthAppointments();
    setRefreshing(false);
  }, [fetchMonthAppointments]);

  // appointments for the selected day
  const dayAppointments = useMemo(() => {
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);
    return monthAppointments.filter((a: any) => {
      const d = new Date(a.startsAt);
      return d >= start && d <= end;
    }).sort((a: any, b: any) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [monthAppointments, selectedDate]);

  const goPrevMonth = () => {
    const d = new Date(calendarMonth);
    d.setMonth(d.getMonth() - 1);
    setCalendarMonth(startOfMonth(d));
    // ensure selected date stays within (or move to 1st)
    setSelectedDate(startOfMonth(d));
  };
  const goNextMonth = () => {
    const d = new Date(calendarMonth);
    d.setMonth(d.getMonth() + 1);
    setCalendarMonth(startOfMonth(d));
    setSelectedDate(startOfMonth(d));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header with Logout Button */}
        <View style={styles.header}>
          <View style={styles.logo}><Text style={styles.logoText}>+</Text></View>
          <Text style={styles.title}>MedData Hospital</Text>
          <Text style={styles.subtitle}>Appointment Management {me?.usertype === 'doctor' ? '• Doctor' : ''}</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardUser}>
            {(me?.name || me?.fullName || 'User')}{me?.usertype === 'doctor' ? ' (Doctor)' : ''}
          </Text>
        </View>

        {/* Doctor area */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Doctor tools</Text>
          <Text style={styles.muted}>Review and manage your appointments</Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: spacing.md }]}
            onPress={() => router.push('/(tabs)/DoctorScheduleScreen')}
          >
            <Text style={styles.primaryBtnText}>Open Doctor Schedule</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Home</Text>
          <Text style={styles.subtitle}>Your calendar and appointments</Text>
        </View>

        {/* Calendar */}
        <View style={styles.card}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goPrevMonth} style={styles.monthBtn}>
              <Text style={styles.monthBtnText}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{monthLabel}</Text>
            <TouchableOpacity onPress={goNextMonth} style={styles.monthBtn}>
              <Text style={styles.monthBtnText}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((w) => (
              <Text key={w} style={styles.weekday}>
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {daysGrid.map((d, idx) => {
              if (d === null) return <View key={`b-${idx}`} style={styles.dayCell} />;
              const cellDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d);
              const disabled = startOfDay(cellDate) < today;
              const selected = isSameDay(cellDate, selectedDate);

               //badge: how many appts that day? İt looks bad so I removed it.
              const count = monthAppointments.reduce((acc: number, a: any) => {
                const ad = new Date(a.startsAt);
                return isSameDay(ad, cellDate) ? acc + 1 : acc;
              }, 0);

              return (
                <TouchableOpacity
                  key={`d-${d}-${idx}`}
                  style={[
                    styles.dayCell,
                    selected && styles.daySelected,
                    disabled && styles.dayDisabled,
                  ]}
                  disabled={disabled}
                  onPress={() => setSelectedDate(startOfDay(cellDate))}
                >
                  <Text
                    style={[
                      styles.dayText,
                      selected && styles.dayTextSelected,
                      disabled && styles.dayTextDisabled,
                    ]}
                  >
                    {d}
                  </Text>
                  {!!count && (
                    <View style={[styles.badge, selected && styles.badgeSelected]}>
                      <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Appointments list */}
        <View style={styles.card}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.sectionTitle}>
              Appointments — {selectedDate.toLocaleDateString()}
            </Text>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={palette.primary} />
              <Text style={styles.loadingText}>Loading appointments...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : dayAppointments.length === 0 ? (
            <Text style={styles.muted}>No appointments for this day.</Text>
          ) : (
            <View style={styles.list}>
              {dayAppointments.map((a: any) => {
                const d = new Date(a.startsAt);
                const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                const doctorName =
                  a.doctor?.title && a.doctor?.name
                    ? `${a.doctor.title} ${a.doctor.name}`
                    : a.doctor?.name || a.doctorName || 'Doctor';
                const departmentName = a.department?.name || a.departmentName || 'Department';
                const status = (a.status || 'confirmed') as string;

                return (
                  <View key={a.id} style={styles.apptItem}>
                    <View style={styles.apptTimePill}>
                      <Text style={styles.apptTimeText}>{time}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.apptTitle}>{doctorName}</Text>
                      <Text style={styles.apptSub}>{departmentName}</Text>
                    </View>
                    <View style={[styles.statusPill, statusStyles[status] || statusStyles.default]}>
                      <Text style={styles.statusText}>{status}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(tabs)/NewAppointmentScreen')}
        >
          <Text style={styles.primaryBtnText}>New Appointment</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const CELL = `${100 / 7}%`;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: spacing.lg },
  header: { marginBottom: spacing.lg, alignItems: 'center' },
  title: { fontSize: typography.title, fontWeight: 'bold', color: palette.text },
  subtitle: { fontSize: typography.subtitle, color: palette.mutedText },

  card: {
    backgroundColor: palette.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  sectionTitle: { fontSize: typography.heading, fontWeight: '700', color: palette.text },

  // Header/logo/logout additions
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoText: { color: palette.white, fontWeight: '700', fontSize: 24 },
  logoutBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.neutral,
    borderRadius: radii.md,
  },
  logoutText: { color: palette.text, fontWeight: '700' },
  cardTitle: { fontSize: typography.heading, fontWeight: '700', color: palette.text },
  cardUser: { marginTop: 4, color: palette.mutedText },

  // Calendar
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.neutral,
    borderRadius: radii.md,
  },
  monthBtnText: { color: palette.text, fontWeight: '700' },
  monthTitle: { fontSize: typography.heading, fontWeight: '700', color: palette.text },

  weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekday: { width: CELL, textAlign: 'center', color: palette.mutedText, fontSize: typography.body },

  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: CELL,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: palette.neutral,
    position: 'relative',
    paddingTop: 2, //adjutable

  },
  daySelected: { backgroundColor: palette.primary },
  dayDisabled: { opacity: 0.4 },
  dayText: { color: palette.text, fontWeight: '700' },
  dayTextSelected: { color: palette.white },
  dayTextDisabled: { color: palette.mutedText },
  // Replace these styles in your StyleSheet:

  badge: {
    position: 'absolute',
    top: 1,            // moved from bottom to top
    right: 1,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: palette.surface,   // non-selected bg
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,         // ensure it stays above the day number
  },
  badgeSelected: {
    backgroundColor: palette.white,     // when the cell is selected
  },
  badgeText: {
    fontSize: 10,       // smaller so it won’t collide visually
    fontWeight: '700',
    color: palette.text,
  },
  badgeTextSelected: {
    color: palette.primary,
  },

  // Appointments list
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  refreshBtn: { paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: palette.neutral, borderRadius: radii.md },
  refreshText: { color: palette.text, fontWeight: '700' },
  list: {},
  apptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.surface,
  },
  apptTimePill: {
    marginRight: spacing.md,
    backgroundColor: palette.surface,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  apptTimeText: { color: palette.text, fontWeight: '700' },
  apptTitle: { color: palette.text, fontWeight: '700' },
  apptSub: { color: palette.mutedText, marginTop: 2 },

  statusPill: {
    marginLeft: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: palette.neutral,
  },
  statusText: { color: palette.text, fontWeight: '700', textTransform: 'capitalize' },

  // CTA
  primaryBtn: {
    backgroundColor: palette.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  primaryBtnText: { color: palette.white, fontWeight: '700' },

  // Misc
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  loadingText: { marginLeft: spacing.sm, color: palette.mutedText, fontSize: typography.body },
  errorText: { color: 'crimson' },
  muted: { color: palette.mutedText },
});

// simple color mapping for statuses (tweak to your palette)
const statusStyles: Record<string, any> = {
  confirmed: { backgroundColor: '#d6f4d6' },
  pending: { backgroundColor: '#fff3cd' },
  cancelled: { backgroundColor: '#f8d7da' },
  completed: { backgroundColor: '#dbeafe' },
  default: { backgroundColor: '#e5e7eb' },
};
