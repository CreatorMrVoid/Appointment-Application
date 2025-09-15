// app/(tabs)/MapScreen.tsx
import React, { useMemo } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { palette, spacing, radii, shadow, typography } from '../../constants/theme';

// TODO: Replace with your real hospital coordinates & display info
const HOSPITAL = {
  name: 'MedData Hospital',
  address: '123 Health Ave, City, Country',
  latitude: 41.0082,   // <-- replace with your hospital latitude
  longitude: 28.9784,  // <-- replace with your hospital longitude
};

export default function MapScreen() {
  const router = useRouter();

  const region: Region = useMemo(() => ({
    latitude: HOSPITAL.latitude,
    longitude: HOSPITAL.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }), []);

  const openInMaps = () => {
    const { latitude, longitude, name } = HOSPITAL;
    const encodedName = encodeURIComponent(name);
    if (Platform.OS === 'ios') {
      const url = `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodedName}`;
      Linking.openURL(url);
    } else {
      // Works on Android and iOS (opens Google Maps if available)
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}(${encodedName})`;
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        // comment PROVIDER_GOOGLE if you haven't set an Android/iOS key yet
        provider={PROVIDER_GOOGLE}
      >
        <Marker
          coordinate={{ latitude: HOSPITAL.latitude, longitude: HOSPITAL.longitude }}
          title={HOSPITAL.name}
          description={HOSPITAL.address}
        />
      </MapView>

      {/* Top bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>{'‹ Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hospital Map</Text>
        <View style={{ width: 80 }} />
      </View>

      {/* Info card */}
      <View style={styles.infoCard}>
        <Text style={styles.hospitalName}>{HOSPITAL.name}</Text>
        <Text style={styles.hospitalAddr}>{HOSPITAL.address}</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.primaryBtn} onPress={openInMaps}>
            <Text style={styles.primaryBtnText}>Directions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  header: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.9)',
    ...shadow.card,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },
  headerBtn: {
    width: 80, height: '100%',
    alignItems: 'flex-start', justifyContent: 'center',
  },
  headerBtnText: { color: palette.primary, fontWeight: '700' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: typography.heading, color: palette.text, fontWeight: '700' },

  infoCard: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: palette.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  hospitalName: { color: palette.text, fontSize: typography.heading, fontWeight: '700' },
  hospitalAddr: { color: palette.mutedText, marginTop: 4 },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  primaryBtn: {
    backgroundColor: palette.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  primaryBtnText: { color: palette.white, fontWeight: '700' },
});
