import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { palette, spacing, radii, shadow, typography } from '../../constants/theme';
import { useRouter } from 'expo-router';

type Department = {
  id: string;
  name: string;
};

type Doctor = {
  id: string;
  name: string;
  departmentId: string;
};

// Temporary mock data. Replace with API calls when backend endpoints are ready.
const DEPARTMENTS: Department[] = [
  { id: 'cardiology', name: 'Cardiology' },
  { id: 'dermatology', name: 'Dermatology' },
  { id: 'neurology', name: 'Neurology' },
  { id: 'orthopedics', name: 'Orthopedics' },
  { id: 'pediatrics', name: 'Pediatrics' },
];

const DOCTORS: Doctor[] = [
  { id: 'd1', name: 'Dr. Alice Carter', departmentId: 'cardiology' },
  { id: 'd2', name: 'Dr. Ben Hughes', departmentId: 'cardiology' },
  { id: 'd3', name: 'Dr. Priya Patel', departmentId: 'dermatology' },
  { id: 'd4', name: 'Dr. Omar Ali', departmentId: 'neurology' },
  { id: 'd5', name: 'Dr. Jane Smith', departmentId: 'orthopedics' },
  { id: 'd6', name: 'Dr. Mark Johnson', departmentId: 'pediatrics' },
];

const HOURS: string[] = [
  '09:00', '09:30', '10:00', '10:30', '11:00',
  '13:00', '13:30', '14:00', '14:30', '15:00',
];

export default function NewAppointmentScreen() {
  const router = useRouter();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);

  const doctorsForDepartment = useMemo(() => DOCTORS.filter(d => d.departmentId === selectedDepartment), [selectedDepartment]);

  const canContinue = !!(selectedDepartment && selectedDoctor && selectedHour);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>New Appointment</Text>
          <Text style={styles.subtitle}>Choose a department, doctor, and time</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Departments</Text>
          <View style={styles.chipRow}>
            {DEPARTMENTS.map(dep => (
              <TouchableOpacity
                key={dep.id}
                style={[styles.chip, selectedDepartment === dep.id && styles.chipSelected]}
                onPress={() => {
                  setSelectedDepartment(dep.id);
                  setSelectedDoctor(null);
                  setSelectedHour(null);
                }}
              >
                <Text style={[styles.chipText, selectedDepartment === dep.id && styles.chipTextSelected]}>{dep.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {!!selectedDepartment && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Available Doctors</Text>
            {doctorsForDepartment.length ? (
              <View style={styles.list}>
                {doctorsForDepartment.map(doc => (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.listItem, selectedDoctor === doc.id && styles.listItemSelected]}
                    onPress={() => {
                      setSelectedDoctor(doc.id);
                      setSelectedHour(null);
                    }}
                  >
                    <View style={[styles.dot, selectedDoctor === doc.id && styles.dotActive]} />
                    <Text style={styles.listItemText}>{doc.name}</Text>
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
              {HOURS.map(h => (
                <TouchableOpacity
                  key={h}
                  style={[styles.slot, selectedHour === h && styles.slotSelected]}
                  onPress={() => setSelectedHour(h)}
                >
                  <Text style={[styles.slotText, selectedHour === h && styles.slotTextSelected]}>{h}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: spacing.md }} />
        <View style={styles.row}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryBtn, !canContinue && styles.primaryBtnDisabled]} disabled={!canContinue} onPress={() => router.back()}>
            <Text style={styles.primaryBtnText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: spacing.lg },
  header: { marginBottom: spacing.lg },
  title: { fontSize: typography.title, fontWeight: 'bold', color: palette.text },
  subtitle: { fontSize: typography.subtitle, color: palette.mutedText },
  card: { backgroundColor: palette.card, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.card },
  sectionTitle: { fontSize: typography.heading, fontWeight: '700', color: palette.text, marginBottom: spacing.sm },
  muted: { color: palette.mutedText },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: palette.neutral, marginRight: spacing.sm, marginBottom: spacing.sm },
  chipSelected: { backgroundColor: palette.primary },
  chipText: { color: palette.text, fontWeight: '600' },
  chipTextSelected: { color: palette.white },
  list: { },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  listItemSelected: { backgroundColor: palette.surface, borderRadius: radii.md, paddingHorizontal: spacing.sm },
  dot: { width: 10, height: 10, backgroundColor: palette.dotInactive, borderRadius: 5, marginRight: 10 },
  dotActive: { backgroundColor: palette.primary },
  listItemText: { color: palette.text, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  slot: { width: '30%', margin: '1.66%', paddingVertical: 12, borderRadius: radii.md, backgroundColor: palette.neutral, alignItems: 'center' },
  slotSelected: { backgroundColor: palette.primary },
  slotText: { color: palette.text, fontWeight: '700' },
  slotTextSelected: { color: palette.white },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  primaryBtn: { backgroundColor: palette.primary, paddingVertical: spacing.md, borderRadius: radii.md, alignItems: 'center', flex: 1, marginLeft: spacing.sm },
  primaryBtnDisabled: { backgroundColor: '#a3c4de' },
  primaryBtnText: { color: palette.white, fontWeight: '700' },
  secondaryBtn: { backgroundColor: palette.neutral, paddingVertical: spacing.md, borderRadius: radii.md, alignItems: 'center', flex: 1, marginRight: spacing.sm },
  secondaryBtnText: { color: palette.text, fontWeight: '700' },
});


