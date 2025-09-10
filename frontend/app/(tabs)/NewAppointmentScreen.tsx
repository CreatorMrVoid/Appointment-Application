import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { palette, spacing, radii, shadow, typography } from '../../constants/theme';
import { useRouter } from 'expo-router';
import {
  getDepartments,
  getDoctorsByDepartment,
  createAppointment,
  Department,
  Doctor,
} from '../../constants/api';

// Available time slots
const HOURS: string[] = [
  '09:00', '09:30', '10:00', '10:30', '11:00',
  '13:00', '13:30', '14:00', '14:30', '15:00',
];

// Max length for reason field
const MAX_REASON_LEN = 200;

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

export default function NewAppointmentScreen() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);

  // calendar
  const today = useMemo(() => startOfDay(new Date()), []);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  // Load departments on component mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setDepartmentsLoading(true);
        const response = await getDepartments();
        setDepartments(response.departments);
      } catch (error) {
        console.error('Error loading departments:', error);
        Alert.alert('Error', 'Failed to load departments. Please try again.');
      } finally {
        setDepartmentsLoading(false);
      }
    };
    loadDepartments();
  }, []);

  // Load doctors when department is selected
  useEffect(() => {
    if (selectedDepartment) {
      const loadDoctors = async () => {
        try {
          setDoctorsLoading(true);
          const response = await getDoctorsByDepartment(selectedDepartment);
          setDoctors(response.doctors);
        } catch (error) {
          console.error('Error loading doctors:', error);
          Alert.alert('Error', 'Failed to load doctors. Please try again.');
        } finally {
          setDoctorsLoading(false);
        }
      };
      loadDoctors();
    } else {
      setDoctors([]);
    }
  }, [selectedDepartment]);

  // Calendar helpers
  const monthLabel = useMemo(() => {
    return calendarMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  }, [calendarMonth]);

  const daysGrid = useMemo(() => {
    // Build a 7-column grid with weekday headers and the days of the month
    const firstDay = new Date(calendarMonth);
    const startWeekday = firstDay.getDay(); // 0 Sun ... 6 Sat
    const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();

    // We’ll show Mon-Sun headers visually, but JS getDay() is Sun=0.
    // For a consistent grid, we’ll treat Monday as the first column.
    const shiftToMonday = (w: number) => (w === 0 ? 6 : w - 1); // Sun->6, Mon->0, ... Sat->5
    const leadingBlanks = shiftToMonday(startWeekday);

    const cells: (number | null)[] = Array(leadingBlanks).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [calendarMonth]);

  const goPrevMonth = () => {
    const d = new Date(calendarMonth);
    d.setMonth(d.getMonth() - 1);
    setCalendarMonth(d);
  };
  const goNextMonth = () => {
    const d = new Date(calendarMonth);
    d.setMonth(d.getMonth() + 1);
    setCalendarMonth(d);
  };

  // Selections & validation
  const hasReason = reason.trim().length > 0;
  const canContinue = !!(selectedDepartment && selectedDoctor && selectedDate && selectedHour && hasReason);

  const handleConfirmAppointment = async () => {
    if (!selectedDepartment || !selectedDoctor || !selectedDate || !selectedHour || !hasReason) {
      Alert.alert('Error', 'Please select a department, doctor, date, time slot, and enter your complaint.');
      return;
    }

    try {
      setLoading(true);

      const [h, m] = selectedHour.split(':').map(Number);
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(h, m, 0, 0);

      const now = new Date();
      if (appointmentDate < now) {
        return Alert.alert('Invalid time', 'The selected time is in the past. Please choose a future time.');
      }

      await createAppointment({
        doctorId: selectedDoctor,
        departmentId: selectedDepartment,
        startsAt: appointmentDate.toISOString(),
        reason: reason.trim(),
      });

      Alert.alert('Success!', 'Your appointment has been booked successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to book appointment. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>New Appointment</Text>
          <Text style={styles.subtitle}>Select a date, time, department, and doctor</Text>
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

          {/* Weekday headers Mon-Sun */}
          <View style={styles.weekRow}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((w) => (
              <Text key={w} style={styles.weekday}>
                {w}
              </Text>
            ))}
          </View>

          {/* Days grid */}
          <View style={styles.daysGrid}>
            {daysGrid.map((d, idx) => {
              if (d === null) {
                return <View key={`blank-${idx}`} style={styles.dayCell} />;
              }
              const dateObj = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d);
              const disabled = startOfDay(dateObj) < today; // past days disabled
              const selected = selectedDate ? isSameDay(dateObj, selectedDate) : false;

              return (
                <TouchableOpacity
                  key={`day-${d}-${idx}`}
                  style={[
                    styles.dayCell,
                    selected && styles.daySelected,
                    disabled && styles.dayDisabled,
                  ]}
                  disabled={disabled}
                  onPress={() => {
                    setSelectedDate(dateObj);
                    setSelectedHour(null); // reset hour when date changes
                  }}
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
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Departments</Text>
          {departmentsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={palette.primary} />
              <Text style={styles.loadingText}>Loading departments...</Text>
            </View>
          ) : (
            <View style={styles.chipRow}>
              {departments.map((dep) => (
                <TouchableOpacity
                  key={dep.id}
                  style={[styles.chip, selectedDepartment === dep.id && styles.chipSelected]}
                  onPress={() => {
                    setSelectedDepartment(dep.id);
                    setSelectedDoctor(null);
                    setSelectedHour(null);
                  }}
                >
                  <Text
                    style={[styles.chipText, selectedDepartment === dep.id && styles.chipTextSelected]}
                  >
                    {dep.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {!!selectedDepartment && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Available Doctors</Text>
            {doctorsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={palette.primary} />
                <Text style={styles.loadingText}>Loading doctors...</Text>
              </View>
            ) : doctors.length ? (
              <View style={styles.list}>
                {doctors.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.listItem, selectedDoctor === doc.id && styles.listItemSelected]}
                    onPress={() => {
                      setSelectedDoctor(doc.id);
                      setSelectedHour(null);
                    }}
                  >
                    <View style={[styles.dot, selectedDoctor === doc.id && styles.dotActive]} />
                    <Text style={styles.listItemText}>
                      {doc.title ? `${doc.title} ${doc.name}` : doc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.muted}>No doctors available for this department.</Text>
            )}
          </View>
        )}

        {!!selectedDoctor && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Available Hours</Text>
            <View style={styles.grid}>
              {HOURS.map((h) => {
                // Disable times in the past if selectedDate is today
                const disabled =
                  selectedDate &&
                  isSameDay(selectedDate, today) &&
                  (() => {
                    const [hh, mm] = h.split(':').map(Number);
                    const t = new Date();
                    const candidate = new Date(t);
                    candidate.setHours(hh, mm, 0, 0);
                    return candidate < new Date();
                  })();

                const selected = selectedHour === h;

                return (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.slot,
                      selected && styles.slotSelected,
                      disabled && styles.slotDisabled,
                    ]}
                    onPress={() => !disabled && setSelectedHour(h)}
                    disabled={!!disabled}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        selected && styles.slotTextSelected,
                        disabled && styles.slotTextDisabled,
                      ]}
                    >
                      {h}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Reason / Complaint */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Reason / Complaint</Text>
          <TextInput
            value={reason}
            onChangeText={(t) => {
              if (t.length <= MAX_REASON_LEN) setReason(t);
            }}
            placeholder="Briefly describe your issue (e.g., sore throat, 38°C fever, started 2 days ago)..."
            multiline
            numberOfLines={5}
            style={styles.textArea}
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect
            returnKeyType="done"
            blurOnSubmit
          />
          <View style={styles.counterRow}>
            {!hasReason ? (
              <Text style={styles.helperText}>This helps your doctor prepare before your visit.</Text>
            ) : (
              <Text style={styles.helperText}>Looks good.</Text>
            )}
            <Text style={styles.counterText}>
              {reason.length}/{MAX_REASON_LEN}
            </Text>
          </View>
        </View>

        <View style={{ height: spacing.md }} />
        <View style={styles.row}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, (!canContinue || loading) && styles.primaryBtnDisabled]}
            disabled={!canContinue || loading}
            onPress={handleConfirmAppointment}
          >
            {loading ? (
              <ActivityIndicator size="small" color={palette.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Confirm</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CELL = `${100 / 7}%`;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: spacing.lg },
  header: { marginBottom: spacing.lg },
  title: { fontSize: typography.title, fontWeight: 'bold', color: palette.text },
  subtitle: { fontSize: typography.subtitle, color: palette.mutedText },
  card: {
    backgroundColor: palette.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  sectionTitle: { fontSize: typography.heading, fontWeight: '700', color: palette.text, marginBottom: spacing.sm },
  muted: { color: palette.mutedText },

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
  },
  daySelected: { backgroundColor: palette.primary },
  dayDisabled: { opacity: 0.4 },
  dayText: { color: palette.text, fontWeight: '700' },
  dayTextSelected: { color: palette.white },
  dayTextDisabled: { color: palette.mutedText },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: palette.neutral,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipSelected: { backgroundColor: palette.primary },
  chipText: { color: palette.text, fontWeight: '600' },
  chipTextSelected: { color: palette.white },

  list: {},
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  listItemSelected: { backgroundColor: palette.surface, borderRadius: radii.md, paddingHorizontal: spacing.sm },
  dot: { width: 10, height: 10, backgroundColor: palette.dotInactive, borderRadius: 5, marginRight: 10 },
  dotActive: { backgroundColor: palette.primary },
  listItemText: { color: palette.text, fontWeight: '600' },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  slot: {
    width: '30%',
    margin: '1.66%',
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: palette.neutral,
    alignItems: 'center',
  },
  slotSelected: { backgroundColor: palette.primary },
  slotDisabled: { opacity: 0.5 },
  slotText: { color: palette.text, fontWeight: '700' },
  slotTextSelected: { color: palette.white },
  slotTextDisabled: { color: palette.mutedText },

  row: { flexDirection: 'row', justifyContent: 'space-between' },
  primaryBtn: {
    backgroundColor: palette.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    flex: 1,
    marginLeft: spacing.sm,
  },
  primaryBtnDisabled: { backgroundColor: '#a3c4de' },
  primaryBtnText: { color: palette.white, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: palette.neutral,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  secondaryBtnText: { color: palette.text, fontWeight: '700' },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  loadingText: { marginLeft: spacing.sm, color: palette.mutedText, fontSize: typography.body },

  textArea: {
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 120,
    color: palette.text,
    fontSize: typography.body,
  },
  counterRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterText: { color: palette.mutedText, fontSize: typography.body }, // no caption usage
  helperText: { color: palette.mutedText, fontSize: typography.body }, // no caption usage
});
