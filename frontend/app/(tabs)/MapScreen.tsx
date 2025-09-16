// app/(tabs)/MapScreen.tsx
import React, { useMemo, useRef, useState, useCallback } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { palette, spacing, radii, shadow, typography } from '../../constants/theme';

// TODO: Replace with your real hospital coordinates & display info
const HOSPITAL = {
  name: 'MedData Bilişim İletişim Sistemleri',
  address: 'Mustafa Kemal, 2129. Sk. no: 6, 06510 Çankaya/Ankara',
  latitude: 39.912516375243584,
  longitude: 32.76988386513041,
};

// Zoom constraints (tweak as you like)
const MIN_DELTA = 0.001; // most zoomed-in
const MAX_DELTA = 0.5;   // most zoomed-out
const ZOOM_FACTOR_IN = 0.5; // halve deltas -> zoom in
const ZOOM_FACTOR_OUT = 2;  // double deltas -> zoom out

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);

  // initial region
  const initialRegion: Region = useMemo(
    () => ({
      latitude: HOSPITAL.latitude,
      longitude: HOSPITAL.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }),
    []
  );

  // track current region to compute next zoom deltas
  const [mapRegion, setMapRegion] = useState<Region>(initialRegion);

  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  const animateToRegion = useCallback((r: Region) => {
    setMapRegion(r);
    mapRef.current?.animateToRegion(r, 200);
  }, []);

  const zoomIn = useCallback(() => {
    const next: Region = {
      ...mapRegion,
      latitudeDelta: clamp(mapRegion.latitudeDelta * ZOOM_FACTOR_IN, MIN_DELTA, MAX_DELTA),
      longitudeDelta: clamp(mapRegion.longitudeDelta * ZOOM_FACTOR_IN, MIN_DELTA, MAX_DELTA),
    };
    animateToRegion(next);
  }, [mapRegion, animateToRegion]);

  const zoomOut = useCallback(() => {
    const next: Region = {
      ...mapRegion,
      latitudeDelta: clamp(mapRegion.latitudeDelta * ZOOM_FACTOR_OUT, MIN_DELTA, MAX_DELTA),
      longitudeDelta: clamp(mapRegion.longitudeDelta * ZOOM_FACTOR_OUT, MIN_DELTA, MAX_DELTA),
    };
    animateToRegion(next);
  }, [mapRegion, animateToRegion]);

  const openInMaps = () => {
    const { latitude, longitude, name } = HOSPITAL;
    const encodedName = encodeURIComponent(name);
    if (Platform.OS === 'ios') {
      const url = `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodedName}`;
      Linking.openURL(url);
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}(${encodedName})`;
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        onRegionChangeComplete={(r) => setMapRegion(r)}
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

      {/* Zoom controls */}
      <View style={styles.zoomStack} pointerEvents="box-none">
        <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn} accessibilityLabel="Zoom in">
          <Text style={styles.zoomText}>＋</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut} accessibilityLabel="Zoom out">
          <Text style={styles.zoomText}>−</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const BTN_SIZE = 46;

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

  // Zoom controls (floats on right side, above info card)
  zoomStack: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl + 100, // keeps it clear of the info card
    alignItems: 'center',
    gap: 10,
  },
  zoomBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  zoomText: { color: palette.text, fontSize: 22, fontWeight: '800' },
});
