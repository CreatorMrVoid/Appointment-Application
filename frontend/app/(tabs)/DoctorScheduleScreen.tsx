import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  getDoctorSchedule,
  DoctorScheduleItem,
  updateAppointmentStatus, // <-- ADD THIS IN YOUR API
} from '../../constants/api';
import { palette, spacing, radii, shadow, typography } from '../../constants/theme';

export default function DoctorScheduleScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DoctorScheduleItem[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const applyLocalStatus = (id: string, status: 'pending' | 'upcoming' | 'completed' | 'cancelled' | string) => {
    setItems(prev =>
      prev.map(it => (String(it.id) === String(id) ? { ...it, status } : it))
    );
  };

  const onChangeStatus = async (it: DoctorScheduleItem, next: 'upcoming' | 'cancelled') => {
    // guard rails
    const current = String(it.status || '').toLowerCase();
    if (current === 'cancelled') {
      Alert.alert('Not allowed', 'This appointment was cancelled by the patient and cannot be changed.');
      return;
    }
    if (current !== 'pending') {
      Alert.alert('Only pending', 'Only pending appointments can be approved or cancelled.');
      return;
    }

    try {
      setUpdatingId(String(it.id));
      // optimistic update
      const previous = current as DoctorScheduleItem['status'];
      applyLocalStatus(String(it.id), next);

      // API call
      const res = await updateAppointmentStatus(it.id, next);

      // If API returns the updated item, trust it; else keep optimistic value
      if (res?.item) {
        setItems(prev =>
          prev.map(x => (String(x.id) === String(it.id) ? { ...x, ...res.item } : x))
        );
      }
    } catch (e: any) {
      // revert on failure
      //Alert.alert('Update failed', e?.message ?? 'Could not update status. Please try again.');
      Alert.alert('Update failed', e?.response?.data?.error ?? e?.message ?? 'Could not update status.');
      applyLocalStatus(String(it.id), 'pending');
    } finally {
      setUpdatingId(null);
    }
  };

  const renderActions = (it: DoctorScheduleItem) => {
    const status = String(it.status || '').toLowerCase();
    if (status === 'cancelled') {
      return <Text style={styles.noteText}>Patient cancelled • no changes allowed</Text>;
    }
    if (status !== 'pending') {
      return null; // Only show actions for "pending"
    }
    const disabled = updatingId === String(it.id);
    return (
      <View style={styles.actionsRow}>
        <TouchableOpacity
          disabled={disabled}
          style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
          onPress={() => onChangeStatus(it, 'upcoming')}
        >
          <Text style={styles.actionBtnText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={disabled}
          style={[styles.dangerBtn, disabled && styles.actionBtnDisabled]}
          onPress={() => onChangeStatus(it, 'cancelled')}
        >
          <Text style={styles.actionBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={palette.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {items.length === 0 ? (
            <Text style={styles.muted}>No appointments scheduled.</Text>
          ) : items.map((it) => {
            const status = String(it.status || '').toLowerCase();
            return (
              <View key={it.id} style={styles.card}>
                <Text style={styles.title}>
                  {new Date(it.startsAt).toLocaleString()} • {it.department?.name || 'Department'}
                </Text>
                <Text style={styles.row}>
                  <Text style={styles.label}>Patient: </Text>
                  <Text style={styles.value}>{it.patient?.name || 'Unknown'}</Text>
                </Text>
                <Text style={styles.row}>
                  <Text style={styles.label}>Reason: </Text>
                  <Text style={styles.value}>{it.reason || 'General consultation'}</Text>
                </Text>
                <Text style={[styles.badge, status === 'cancelled' ? styles.badgeCancelled :
                                          status === 'pending' ? styles.badgePending :
                                          styles.badgeDefault]}>
                  {status}
                </Text>

                {renderActions(it)}
              </View>
            );
          })}
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
  badge: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: palette.neutral,
    color: palette.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    textTransform: 'capitalize',
  },
  badgeCancelled: { backgroundColor: '#eee' },
  badgePending: { backgroundColor: '#ddd' },
  badgeDefault: { backgroundColor: palette.neutral },

  actionsRow: { flexDirection: 'row', marginTop: spacing.md, gap: 8 },
  actionBtn: {
    backgroundColor: palette.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
  },
  dangerBtn: {
    backgroundColor: '#d9534f',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { color: palette.white, fontWeight: '700' },
  noteText: { marginTop: spacing.sm, color: palette.mutedText },
});
