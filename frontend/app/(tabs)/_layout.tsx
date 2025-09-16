import { Stack } from 'expo-router';

export default function TabsLayout() {
  return (
    <Stack initialRouteName="LoginScreen">
      <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
      <Stack.Screen name="RegisterScreen" options={{ headerShown: false }} />
      <Stack.Screen name="HomeScreen" options={{ headerShown: false }} />
      <Stack.Screen name="HealthInfoScreen" options={{ title: 'Health Info' }} />
      <Stack.Screen name="NewAppointmentScreen" options={{ title: 'New Appointment' }} />
      <Stack.Screen name="DoctorScheduleScreen" options={{ title: 'My Schedule' }} />
    </Stack>
  );
}


