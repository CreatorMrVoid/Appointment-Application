import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  getDoctorSchedule,
  DoctorScheduleItem,
  updateAppointmentStatus,
} from '../../constants/api';
import { palette, spacing, radii, shadow, typography } from '../../constants/theme';

type SItem = DoctorScheduleItem & { cancellationReason?: string };

type FilterKey =
  | 'all'
  | 'today'
  | 'tomorrow'
  | 'next3'
  | 'thisweek'
  | 'thismonth'
  | 'nextmonth'
  | 'past'
  | 'upcoming';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'next3', label: 'Next 3 Days' },
  { key: 'thisweek', label: 'This Week' },
  { key: 'thismonth', label: 'This Month' },
  { key: 'nextmonth', label: 'Next Month' },
  { key: 'past', label: 'Past' },
  { key: 'upcoming', label: 'Upcoming' },
];

// ----- date helpers (local time, inclusive ranges)
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
const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};
const addMonths = (d: Date, n: number) => {
  const c = new Date(d);
  c.setMonth(c.getMonth() + n);
  return c;
};
const startOfWeekMon = (d: Date) => {
  const c = startOfDay(d);
  const day = c.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // Monday=0
  c.setDate(c.getDate() - diff);
  return c;
};
const endOfWeekMon = (d: Date) => {
  const s = startOfWeekMon(d);
  const e = addDays(s, 6);
  return endOfDay(e);
};
const startOfMonth = (d: Date) => {
  const c = new Date(d.getFullYear(), d.getMonth(), 1);
  c.setHours(0, 0, 0, 0);
  return c;
};
const endOfMonth = (d: Date) => {
  const firstNext = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  firstNext.setHours(0, 0, 0, 0);
  return new Date(firstNext.getTime() - 1);
};
const inRangeInclusive = (x: Date, from: Date, to: Date) =>
  x.getTime() >= from.getTime() && x.getTime() <= to.getTime();

export default function DoctorScheduleScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SItem[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');

  // cancel dialog state
  const [cancelState, setCancelState] = useState<{
    visible: boolean;
    item: SItem | null;
    reason: string;
    submitting: boolean;
  }>({ visible: false, item: null, reason: '', submitting: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getDoctorSchedule();
        if (!mounted) return;
        setItems((res.schedule as SItem[]) || []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ---- filtering
  const filtered = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const tomorrowStart = startOfDay(addDays(now, 1));
    const tomorrowEnd = endOfDay(addDays(now, 1));

    const next3Start = startOfDay(addDays(now, 1));
    const next3End = endOfDay(addDays(now, 3));

    const weekStart = startOfWeekMon(now);
    const weekEnd = endOfWeekMon(now);

    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const nextMonthStart = startOfMonth(addMonths(now, 1));
    const nextMonthEnd = endOfMonth(addMonths(now, 1));

    const base = items
      .filter(it => !!it?.startsAt)
      .map(it => ({ ...it, _d: new Date(it.startsAt) })) // parsed date cache
      .filter(it => !isNaN(it._d.getTime()));

    let out: (SItem & { _d: Date })[] = base;

    switch (filter) {
      case 'today':
        out = base.filter(it => inRangeInclusive(it._d, todayStart, todayEnd));
        break;
      case 'tomorrow':
        out = base.filter(it => inRangeInclusive(it._d, tomorrowStart, tomorrowEnd));
        break;
      case 'next3':
        out = base.filter(it => inRangeInclusive(it._d, next3Start, next3End));
        break;
      case 'thisweek':
        out = base.filter(it => inRangeInclusive(it._d, weekStart, weekEnd));
        break;
      case 'thismonth':
        out = base.filter(it => inRangeInclusive(it._d, monthStart, monthEnd));
        break;
      case 'nextmonth':
        out = base.filter(it => inRangeInclusive(it._d, nextMonthStart, nextMonthEnd));
        break;
      case 'past':
        out = base.filter(it => it._d.getTime() < nowMs);
        break;
      case 'upcoming':
        out = base.filter(it => it._d.getTime() >= nowMs);
        break;
      case 'all':
      default:
        out = base;
    }

    // sort ascending by start time
    out.sort((a, b) => a._d.getTime() - b._d.getTime());
    // strip helper
    return out.map(({ _d, ...rest }) => rest as SItem);
  }, [items, filter]);

  const applyLocalStatus = (
    id: string,
    status: 'pending' | 'upcoming' | 'completed' | 'cancelled' | string,
    cancellationReason?: string
  ) => {
    setItems(prev =>
      prev.map(it =>
        String(it.id) === String(id)
          ? { ...it, status, ...(cancellationReason ? { cancellationReason } : {}) }
          : it
      )
    );
  };

  const onChangeStatus = async (
    it: SItem,
    next: 'upcoming' | 'cancelled',
    opts?: { cancellationReason?: string }
  ) => {
    const current = String(it.status || '').toLowerCase();
    if (current === 'cancelled') {
      Alert.alert('Not allowed', 'This appointment was cancelled by the patient and cannot be changed.');
      return;
    }
    if (current !== 'pending') {
      Alert.alert('Only pending', 'Only pending appointments can be approved or cancelled.');
      return;
    }
    if (next === 'cancelled') {
      const reason = (opts?.cancellationReason || '').trim();
      if (reason.length < 3) {
        Alert.alert('Reason required', 'Please provide a brief cancellation reason (min 3 characters).');
        return;
      }
    }

    try {
      setUpdatingId(String(it.id));
      applyLocalStatus(String(it.id), next, opts?.cancellationReason);

      const res = await updateAppointmentStatus(it.id, next, {
        cancellationReason: next === 'cancelled' ? opts?.cancellationReason : undefined,
      });

      if (res?.item) {
        setItems(prev =>
          prev.map(x => (String(x.id) === String(it.id) ? { ...x, ...res.item } : x))
        );
      }
    } catch (e: any) {
      Alert.alert('Update failed', e?.response?.data?.error ?? e?.message ?? 'Could not update status.');
      applyLocalStatus(String(it.id), 'pending');
    } finally {
      setUpdatingId(null);
    }
  };

  const openCancelDialog = (it: SItem) => {
    const status = String(it.status || '').toLowerCase();
    if (status === 'cancelled') {
      Alert.alert('Not allowed', 'This appointment is already cancelled.');
      return;
    }
    if (status !== 'pending') {
      Alert.alert('Only pending', 'Only pending appointments can be cancelled.');
      return;
    }
    setCancelState({ visible: true, item: it, reason: '', submitting: false });
  };

  const confirmCancel = async () => {
    if (!cancelState.item) return;
    const reason = cancelState.reason.trim();
    if (reason.length < 3) {
      Alert.alert('Reason required', 'Please provide a brief cancellation reason (min 3 characters).');
      return;
    }
    try {
      setCancelState(s => ({ ...s, submitting: true }));
      await onChangeStatus(cancelState.item, 'cancelled', { cancellationReason: reason });
      setCancelState({ visible: false, item: null, reason: '', submitting: false });
    } finally {
      setCancelState(s => ({ ...s, submitting: false }));
    }
  };

  const renderActions = (it: SItem) => {
    const status = String(it.status || '').toLowerCase();
    if (status === 'cancelled') {
      return <Text style={styles.noteText}>Patient cancelled • no changes allowed</Text>;
    }
    if (status !== 'pending') {
      return null;
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
          onPress={() => openCancelDialog(it)}
        >
          <Text style={styles.actionBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCancelModal = () => (
    <Modal
      visible={cancelState.visible}
      transparent
      animationType="slide"
      onRequestClose={() => setCancelState(s => ({ ...s, visible: false }))}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Cancellation reason</Text>
          <Text style={styles.modalSubtitle}>
            Please provide a short note that will be visible to the patient.
          </Text>
          <TextInput
            value={cancelState.reason}
            onChangeText={(t) => setCancelState(s => ({ ...s, reason: t }))}
            placeholder="e.g., Doctor is unavailable due to emergency"
            placeholderTextColor={palette.mutedText}
            style={styles.input}
            multiline
            numberOfLines={4}
            editable={!cancelState.submitting}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.secondaryBtn, cancelState.submitting && styles.actionBtnDisabled]}
              onPress={() => setCancelState({ visible: false, item: null, reason: '', submitting: false })}
              disabled={cancelState.submitting}
            >
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dangerBtn, cancelState.submitting && styles.actionBtnDisabled]}
              onPress={confirmCancel}
              disabled={cancelState.submitting}
            >
              <Text style={styles.actionBtnText}>
                {cancelState.submitting ? 'Cancelling…' : 'Confirm Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={palette.primary} /></View>
      ) : (
        <>
          {/* Filter chips */}
          <View style={styles.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTERS.map(f => {
                const active = filter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setFilter(f.key)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {filtered.length === 0 ? (
              <Text style={styles.muted}>No appointments.</Text>
            ) : filtered.map((it) => {
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

                  <Text style={[
                    styles.badge,
                    status === 'cancelled' ? styles.badgeCancelled :
                    status === 'pending' ? styles.badgePending :
                    styles.badgeDefault
                  ]}>
                    {status}
                  </Text>

                  {status === 'cancelled' && !!it.cancellationReason && (
                    <Text style={[styles.row, styles.cancelReason]}>
                      <Text style={styles.label}>Cancellation note: </Text>
                      <Text style={styles.value}>{it.cancellationReason}</Text>
                    </Text>
                  )}

                  {renderActions(it)}
                </View>
              );
            })}
          </ScrollView>

          {renderCancelModal()}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: palette.mutedText, padding: spacing.lg },

  // Filters
  filterBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  filterRow: { columnGap: 8 },
  chip: {
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  chipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  chipText: { color: palette.text, fontWeight: '600' },
  chipTextActive: { color: palette.white },

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

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: palette.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  modalTitle: { fontSize: typography.body, fontWeight: '700', color: palette.text, marginBottom: spacing.xs },
  modalSubtitle: { color: palette.mutedText, marginBottom: spacing.sm },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: radii.md,
    padding: spacing.md,
    color: palette.text,
    backgroundColor: palette.background,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: spacing.md,
  },
  secondaryBtn: {
    backgroundColor: '#f1f1f1',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
  },
  secondaryBtnText: { color: palette.text, fontWeight: '700' },
  cancelReason: { marginTop: spacing.sm },
});
