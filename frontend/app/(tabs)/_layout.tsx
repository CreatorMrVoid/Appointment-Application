import { Stack } from 'expo-router';

export default function TabsLayout() {
  return (
    <Stack initialRouteName="LoginScreen">
      <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
      <Stack.Screen name="RegisterScreen" options={{ headerShown: false }} />
      <Stack.Screen name="HomeScreen" options={{ headerShown: false }} />
      <Stack.Screen name="NewAppointmentScreen" options={{ title: 'New Appointment' }} />
    </Stack>
  );
}


