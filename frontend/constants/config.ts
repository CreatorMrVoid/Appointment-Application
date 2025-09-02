// Choose API base URL depending on platform and environment

import { Platform } from 'react-native';

// For Android emulator, localhost of host machine is 10.0.2.2
const ANDROID_EMULATOR_HOST = 'http://10.0.2.2:4000';
const LOCALHOST = 'http://localhost:4000';

// You can override with process.env.EXPO_PUBLIC_API_BASE_URL if set
const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export function getApiBaseUrl(): string {
  if (ENV_BASE_URL && ENV_BASE_URL.length > 0) return ENV_BASE_URL;

  if (Platform.OS === 'android') {
    return ANDROID_EMULATOR_HOST;
  }

  // iOS simulator and web can use localhost
  return LOCALHOST;
}

export const API_BASE_URL = getApiBaseUrl();
