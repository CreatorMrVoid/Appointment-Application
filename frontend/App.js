import React from 'react';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './app/(tabs)/LoginScreen';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <LoginScreen />
    </>
  );
}