import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getDoctorSchedule, DoctorScheduleItem } from '../../constants/api';
import { palette, spacing, radii, shadow, typography } from '../../constants/theme';

export default function DoctorScheduleScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DoctorScheduleItem[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getDoctorSchedule();
        if (!mounted) return;
        setItems(res.schedule || []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={palette.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {items.length === 0 ? (
            <Text style={styles.muted}>No appointments scheduled.</Text>
          ) : items.map((it) => (
            <View key={it.id} style={styles.card}>
              <Text style={styles.title}>{new Date(it.startsAt).toLocaleString()} • {it.department?.name || 'Department'}</Text>
              <Text style={styles.row}><Text style={styles.label}>Patient: </Text><Text style={styles.value}>{it.patient?.name || 'Unknown'}</Text></Text>
              <Text style={styles.row}><Text style={styles.label}>Reason: </Text><Text style={styles.value}>{it.reason || 'General consultation'}</Text></Text>
              <Text style={styles.badge}>{String(it.status).toLowerCase()}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: palette.mutedText, padding: spacing.lg },
  card: { backgroundColor: palette.card, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.card },
  title: { fontSize: typography.body, fontWeight: '700', color: palette.text, marginBottom: spacing.xs },
  row: { marginTop: 4 },
  label: { color: palette.mutedText },
  value: { color: palette.text },
  badge: { marginTop: spacing.sm, alignSelf: 'flex-start', backgroundColor: palette.neutral, color: palette.text, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, textTransform: 'capitalize' },
});


