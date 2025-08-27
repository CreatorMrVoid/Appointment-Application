import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { api } from '../../constants/api';

type UserProfile = {
  id: number | string;
  name?: string;
  fullName?: string;
  email?: string;
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
          <Text style={styles.subtitle}>Appointment Management</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardUser}>{me?.name || me?.fullName || 'Patient'}</Text>
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
          <TouchableOpacity style={styles.primaryBtn}><Text style={styles.primaryBtnText}>New Appointment</Text></TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={styles.stat}><Text style={styles.statLabel}>Upcoming</Text><Text style={styles.statValue}>{appts.filter(a => a.status === 'upcoming').length}</Text></View>
          <View style={styles.stat}><Text style={styles.statLabel}>Pending</Text><Text style={styles.statValue}>{appts.filter(a => a.status === 'pending').length}</Text></View>
          <View style={styles.stat}><Text style={styles.statLabel}>Completed</Text><Text style={styles.statValue}>{appts.filter(a => a.status === 'completed').length}</Text></View>
          <View style={styles.stat}><Text style={styles.statLabel}>Messages</Text><Text style={styles.statValue}>5</Text></View>
        </View>

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
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 16 },
  header: { alignItems: 'center', marginBottom: 16 },
  logo: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2E86C1', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50' },
  subtitle: { fontSize: 12, color: '#7F8C8D' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 14, color: '#7F8C8D' },
  cardUser: { fontSize: 20, fontWeight: '700', color: '#2C3E50', marginBottom: 8 },
  skeleton: { height: 64, backgroundColor: '#EEF2F4', borderRadius: 12, marginVertical: 8 },
  nextApptBox: { padding: 12, borderRadius: 12, backgroundColor: '#F4F8FB', borderWidth: 1, borderColor: '#E6EEF6', marginBottom: 8 },
  nextApptTitle: { fontWeight: '600', color: '#2C3E50' },
  nextApptSub: { color: '#7F8C8D', fontSize: 12 },
  muted: { color: '#7F8C8D' },
  primaryBtn: { marginTop: 12, backgroundColor: '#2E86C1', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12, marginHorizontal: 4, alignItems: 'center' },
  statLabel: { color: '#7F8C8D', fontSize: 12 },
  statValue: { color: '#2C3E50', fontWeight: '700', fontSize: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2C3E50', marginBottom: 8 },
  apptRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  apptDot: { width: 10, height: 10, backgroundColor: '#2E86C1', borderRadius: 5, marginRight: 10 },
  apptTitle: { color: '#2C3E50', fontWeight: '600' },
  apptSub: { color: '#7F8C8D', fontSize: 12 },
  badge: { backgroundColor: '#EEF2F4', color: '#2C3E50', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, textTransform: 'capitalize' },
});


