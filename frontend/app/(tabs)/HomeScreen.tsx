import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { api } from '../../constants/api';
import { getAppointments } from '../../constants/api';
import { palette, spacing, radii, shadow, typography } from '../../constants/theme';
import { useRouter } from 'expo-router';

type UserProfile = {
  id: number | string;
  name?: string;
  fullName?: string;
  email?: string;
  usertype?: 'patient' | 'doctor' | string;
};

type Appointment = {
  id: string;
  date: string;
  department: string;
  doctor: string;
  location: string;
  status: 'upcoming' | 'checked-in' | 'completed' | 'cancelled' | 'pending';
};

export default function HomeScreen() {
  const router = useRouter();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/api/auth/me');
        if (!mounted) return;
        setMe(res.data?.user || null);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getAppointments();
        if (!mounted) return;
        const mapped: Appointment[] = (res.appointments || []).map((a: any) => ({
          id: String(a.id),
          date: a.startsAt,
          department: a?.department?.name ?? 'Department',
          doctor: a?.doctor?.name ?? 'Doctor',
          location: a?.department?.name ?? 'Hospital',
          status: ((): Appointment['status'] => {
            const s = String(a.status || '').toLowerCase();
            if (s === 'pending') return 'pending';
            if (s === 'confirmed') return 'upcoming';
            if (s === 'rescheduled') return 'upcoming';
            if (s === 'completed') return 'completed';
            if (s === 'cancelled' || s === 'canceled') return 'cancelled';
            return 'pending';
          })(),
        }));
        setAppts(mapped);
      } catch (e) {
        // ignore for homescreen
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const nextAppointment = useMemo(() => {
    return appts.length
      ? [...appts].sort((a, b) => +new Date(a.date) - +new Date(b.date))[0]
      : undefined;
  }, [appts]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.logo}><Text style={styles.logoText}>+</Text></View>
          <Text style={styles.title}>MedData Hospital</Text>
          <Text style={styles.subtitle}>Appointment Management {me?.usertype === 'doctor' ? '• Doctor' : ''}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardUser}>
            {(me?.name || me?.fullName || 'User')}{me?.usertype === 'doctor' ? ' (Doctor)' : ''}
          </Text>
          {loading ? (
            <View style={styles.skeleton} />
          ) : nextAppointment ? (
            <View style={styles.nextApptBox}>
              <Text style={styles.nextApptTitle}>{nextAppointment.department} with Dr. {nextAppointment.doctor}</Text>
              <Text style={styles.nextApptSub}>{new Date(nextAppointment.date).toLocaleString()} • {nextAppointment.location}</Text>
            </View>
          ) : (
            <Text style={styles.muted}>No upcoming appointments.</Text>
          )}
          {me?.usertype === 'doctor' ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/DoctorScheduleScreen')}><Text style={styles.primaryBtnText}>View My Schedule</Text></TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/NewAppointmentScreen')}><Text style={styles.primaryBtnText}>New Appointment</Text></TouchableOpacity>
          )}
        </View>

        {me?.usertype === 'doctor' ? (
          <View style={styles.row}>
            <View style={styles.stat}><Text style={styles.statLabel}>Today</Text><Text style={styles.statValue}>{appts.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>Upcoming</Text><Text style={styles.statValue}>{appts.filter(a => new Date(a.date) > new Date()).length}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>Completed</Text><Text style={styles.statValue}>{appts.filter(a => a.status === 'completed').length}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>Notes</Text><Text style={styles.statValue}>—</Text></View>
          </View>
        ) : (
          <View style={styles.row}>
            <View style={styles.stat}><Text style={styles.statLabel}>Upcoming</Text><Text style={styles.statValue}>{appts.filter(a => a.status === 'upcoming').length}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>Pending</Text><Text style={styles.statValue}>{appts.filter(a => a.status === 'pending').length}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>Completed</Text><Text style={styles.statValue}>{appts.filter(a => a.status === 'completed').length}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>Messages</Text><Text style={styles.statValue}>5</Text></View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Appointments</Text>
          {appts.length ? appts.map(a => (
            <View key={a.id} style={styles.apptRow}>
              <View style={styles.apptDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.apptTitle}>{a.department} • Dr. {a.doctor}</Text>
                <Text style={styles.apptSub}>{new Date(a.date).toLocaleString()} • {a.location}</Text>
              </View>
              <Text style={styles.badge}>{a.status}</Text>
            </View>
          )) : (
            <Text style={styles.muted}>No appointments found.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  logo: { width: 56, height: 56, borderRadius: 28, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  logoText: { color: palette.white, fontSize: 24, fontWeight: 'bold' },
  title: { fontSize: typography.title, fontWeight: 'bold', color: palette.text },
  subtitle: { fontSize: typography.subtitle, color: palette.mutedText },
  card: { backgroundColor: palette.card, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.card },
  cardTitle: { fontSize: typography.body, color: palette.mutedText },
  cardUser: { fontSize: 20, fontWeight: '700', color: palette.text, marginBottom: spacing.sm },
  skeleton: { height: 64, backgroundColor: palette.neutral, borderRadius: radii.md, marginVertical: spacing.sm },
  nextApptBox: { padding: spacing.md, borderRadius: radii.md, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.surfaceBorder, marginBottom: spacing.sm },
  nextApptTitle: { fontWeight: '600', color: palette.text },
  nextApptSub: { color: palette.mutedText, fontSize: typography.subtitle },
  muted: { color: palette.mutedText },
  primaryBtn: { marginTop: spacing.md, backgroundColor: palette.primary, paddingVertical: spacing.md, borderRadius: radii.md, alignItems: 'center' },
  primaryBtnText: { color: palette.white, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  stat: { flex: 1, backgroundColor: palette.card, borderRadius: radii.lg, padding: spacing.md, marginHorizontal: 4, alignItems: 'center' },
  statLabel: { color: palette.mutedText, fontSize: typography.subtitle },
  statValue: { color: palette.text, fontWeight: '700', fontSize: 18 },
  sectionTitle: { fontSize: typography.heading, fontWeight: '700', color: palette.text, marginBottom: spacing.sm },
  apptRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  apptDot: { width: 10, height: 10, backgroundColor: palette.primary, borderRadius: 5, marginRight: 10 },
  apptTitle: { color: palette.text, fontWeight: '600' },
  apptSub: { color: palette.mutedText, fontSize: typography.subtitle },
  badge: { backgroundColor: palette.neutral, color: palette.text, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, textTransform: 'capitalize' },
});


