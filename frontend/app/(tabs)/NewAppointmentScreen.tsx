import React, { useMemo, useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { palette, spacing, radii, shadow, typography } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { getDepartments, getDoctorsByDepartment, createAppointment, Department, Doctor } from '../../constants/api';

// Available time slots

const HOURS: string[] = [
  '09:00', '09:30', '10:00', '10:30', '11:00',
  '13:00', '13:30', '14:00', '14:30', '15:00',
];

export default function NewAppointmentScreen() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
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

  const canContinue = !!(selectedDepartment && selectedDoctor && selectedHour);

  const handleConfirmAppointment = async () => {
    if (!selectedDepartment || !selectedDoctor || !selectedHour) {
      Alert.alert('Error', 'Please select a department, doctor, and time slot.');
      return;
    }

    try {
      setLoading(true);
      
      // Create appointment date from selected hour
      const today = new Date();
      const [hours, minutes] = selectedHour.split(':').map(Number);
      const appointmentDate = new Date(today);
      appointmentDate.setHours(hours, minutes, 0, 0);
      
      // If the selected time is in the past, set it for tomorrow
      if (appointmentDate < today) {
        appointmentDate.setDate(appointmentDate.getDate() + 1);
      }

      const response = await createAppointment({
        doctorId: selectedDoctor,
        departmentId: selectedDepartment,
        startsAt: appointmentDate.toISOString(),
        reason: 'General consultation',
      });

      Alert.alert(
        'Success!',
        'Your appointment has been booked successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      const errorMessage = error.response?.data?.error || 'Failed to book appointment. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>New Appointment</Text>
          <Text style={styles.subtitle}>Choose a department, doctor, and time</Text>
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
              {departments.map(dep => (
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
                {doctors.map(doc => (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.listItem, selectedDoctor === doc.id && styles.listItemSelected]}
                    onPress={() => {
                      setSelectedDoctor(doc.id);
                      setSelectedHour(null);
                    }}
                  >
                    <View style={[styles.dot, selectedDoctor === doc.id && styles.dotActive]} />
                    <Text style={styles.listItemText}>{doc.title ? `${doc.title} ${doc.name}` : doc.name}</Text>
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
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  loadingText: { marginLeft: spacing.sm, color: palette.mutedText, fontSize: typography.body },
});


