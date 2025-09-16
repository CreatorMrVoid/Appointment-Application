import React, { useEffect, useState } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { palette, spacing, radii, shadow, typography } from '../../constants/theme';
import { getMyHealthInfo, upsertMyHealthInfo, HealthInfo, loadCurrentUser } from '../../constants/api';

const BLOOD_TYPES = ['A_POS','A_NEG','B_POS','B_NEG','AB_POS','AB_NEG','O_POS','O_NEG'] as const;

const prettyBlood = (bt?: HealthInfo['bloodType'] | null) => {
  if (!bt) return '—';
  const map: Record<string, string> = {
    A_POS: 'A+', A_NEG: 'A-',
    B_POS: 'B+', B_NEG: 'B-',
    AB_POS: 'AB+', AB_NEG: 'AB-',
    O_POS: 'O+', O_NEG: 'O-',
  };
  return map[String(bt)] ?? String(bt);
};

export default function HealthInfoScreen() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [health, setHealth] = useState<HealthInfo | null>(null);

  // When there is no data yet, we start directly in edit mode
  const [edit, setEdit] = useState(false);

  // local form state
  const [age, setAge] = useState<string>('');
  const [bloodType, setBloodType] = useState<HealthInfo['bloodType']>(null);
  const [height, setHeight] = useState<string>(''); // cm
  const [weight, setWeight] = useState<string>(''); // kg

  useEffect(() => {
    (async () => {
      const u = await loadCurrentUser();
      setMe(u);

      const res = await getMyHealthInfo();
      const h = res.health ?? null;
      setHealth(h);

      // Populate form fields from DB (if any)
      if (h) {
        setAge(h.age != null ? String(h.age) : '');
        setBloodType((h.bloodType ?? null) as any);
        setHeight(h.height != null ? String(h.height) : '');
        setWeight(h.weight != null ? String(h.weight) : '');
        setEdit(false);                // show read-only when data exists
      } else {
        setEdit(true);                 // no data -> allow entering immediately
      }

      setLoading(false);
    })();
  }, []);

  const validate = () => {
    // Accept empty fields; only validate provided numbers
    const ageN = age ? Number(age) : null;
    const heightN = height ? Number(height) : null;
    const weightN = weight ? Number(weight) : null;
    
    if (age && (!Number.isFinite(ageN) || ageN === null || ageN < 0 || ageN > 150 )) {
      Alert.alert('Invalid age', 'Please enter a valid age between 0 and 150.');
      return false;
    }
    if (height && (!Number.isFinite(heightN) || heightN === null || heightN < 50 || heightN > 250)) {
      Alert.alert('Invalid height', 'Please enter height in centimeters (50–250).');
      return false;
    }
    if (weight && (!Number.isFinite(weightN) || weightN === null || weightN < 10 || weightN > 500)) {
      Alert.alert('Invalid weight', 'Please enter weight in kilograms (10–500).');
      return false;
    }
    return true;
  };

  const save = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      const body = {
        age: age ? Number(age) : null,
        bloodType: (bloodType as any) ?? null,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
      };
      const { health: updated } = await upsertMyHealthInfo(body);
      setHealth(updated);

      // If this was the first time entry, switch to display mode after save
      setEdit(false);
      Alert.alert('Saved', 'Your health information has been updated.');
    } catch (e: any) {
      Alert.alert('Save failed', e?.response?.data?.error ?? e?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderRow = (label: string, value?: string | number | null) => (
    <View style={styles.row} key={label}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? '—'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{'‹ Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Health Information</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.userName}>{me?.name || me?.fullName || 'User'}</Text>
          <Text style={styles.muted}>
            {health ? 'View your health details' : 'Please enter your health details below'}
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : (
          <View style={styles.card}>
            {!edit ? (
              <>
                {renderRow('Age', health?.age ?? null)}
                {renderRow('Blood Type', prettyBlood(health?.bloodType))}
                {renderRow('Height (cm)', health?.height ?? null)}
                {renderRow('Weight (kg)', health?.weight ?? null)}

                {/* Edit button visible only if data exists */}
                {!!health && (
                  <TouchableOpacity
                    style={[styles.primaryBtn, { marginTop: spacing.md }]}
                    onPress={() => setEdit(true)}
                  >
                    <Text style={styles.primaryBtnText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Age</Text>
                  <TextInput
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                    placeholder="e.g. 29"
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Blood Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ columnGap: 8 }}>
                    {BLOOD_TYPES.map(bt => {
                      const active = bloodType === bt;
                      const label = prettyBlood(bt as any);
                      return (
                        <TouchableOpacity
                          key={bt}
                          onPress={() => setBloodType(bt)}
                          style={[styles.chip, active && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Height (cm)</Text>
                  <TextInput
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 175"
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 70"
                    style={styles.input}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
                  {/* Show Cancel only if there was existing data; for first-time entry, hide Cancel */}
                  {!!health && (
                    <TouchableOpacity style={[styles.secondaryBtn]} onPress={() => setEdit(false)} disabled={saving}>
                      <Text style={styles.secondaryBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
                    onPress={save}
                    disabled={saving}
                  >
                    <Text style={styles.primaryBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: spacing.lg },
  center: { padding: spacing.lg, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: 70,
    paddingVertical: spacing.sm,
  },
  backText: { color: palette.primary, fontWeight: '700' },
  title: { flex: 1, textAlign: 'center', fontSize: typography.heading, color: palette.text, fontWeight: '700' },

  card: {
    backgroundColor: palette.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  userName: { fontSize: typography.heading, fontWeight: '700', color: palette.text },
  muted: { color: palette.mutedText, marginTop: 4 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.surface,
  },
  label: { color: palette.mutedText },
  value: { color: palette.text, fontWeight: '700' },

  // edit form
  inputRow: { marginTop: spacing.sm },
  inputLabel: { color: palette.mutedText, marginBottom: 6 },
  input: {
    backgroundColor: palette.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: palette.text,
  },

  chip: {
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { color: palette.text, fontWeight: '700' },
  chipTextActive: { color: palette.white },

  primaryBtn: {
    backgroundColor: palette.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  primaryBtnText: { color: palette.white, fontWeight: '700' },

  secondaryBtn: {
    backgroundColor: palette.neutral,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  secondaryBtnText: { color: palette.text, fontWeight: '700' },
});
