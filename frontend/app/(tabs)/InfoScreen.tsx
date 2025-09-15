import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, spacing, radii, shadow, typography } from '../../constants/theme';

export default function InfoScreen() {
  const router = useRouter();

  const tel = '+90 212 000 0000';
  const fax = '+90 212 000 0001';
  const address = '123 Health Ave, City, Country';
  const postal = '34000';
  const email = 'info@meddata-hospital.example';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>{'‹ Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact & Info</Text>
        <View style={{ width: 80 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>MedData Hospital</Text>
        <Text style={styles.item}><Text style={styles.label}>Tel: </Text>{tel}</Text>
        <Text style={styles.item}><Text style={styles.label}>Fax: </Text>{fax}</Text>
        <Text style={styles.item}><Text style={styles.label}>Email: </Text>{email}</Text>
        <Text style={styles.item}><Text style={styles.label}>Address: </Text>{address}</Text>
        <Text style={styles.item}><Text style={styles.label}>Postal Code: </Text>{postal}</Text>

        <View style={styles.row}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => Linking.openURL(`tel:${tel.replace(/\s+/g, '')}`)}>
            <Text style={styles.primaryBtnText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => Linking.openURL(`mailto:${email}`)}>
            <Text style={styles.secondaryBtnText}>Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background, padding: spacing.lg },
  header: {
    height: 44,
    borderRadius: radii.md,
    backgroundColor: palette.card,
    ...shadow.card,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  headerBtn: { width: 80, height: '100%', alignItems: 'flex-start', justifyContent: 'center' },
  headerBtnText: { color: palette.primary, fontWeight: '700' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: typography.heading, color: palette.text, fontWeight: '700' },

  card: { backgroundColor: palette.card, borderRadius: radii.lg, padding: spacing.lg, ...shadow.card },
  title: { color: palette.text, fontSize: typography.heading, fontWeight: '700', marginBottom: spacing.sm },
  item: { color: palette.text, marginTop: 6 },
  label: { color: palette.mutedText },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  primaryBtn: { backgroundColor: palette.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.md },
  primaryBtnText: { color: palette.white, fontWeight: '700' },
  secondaryBtn: { backgroundColor: palette.neutral, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.md },
  secondaryBtnText: { color: palette.text, fontWeight: '700' },
});


