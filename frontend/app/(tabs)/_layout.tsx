import { Stack } from 'expo-router';

export default function TabsLayout() {
  return (
    <Stack initialRouteName="LoginScreen">
      <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
      <Stack.Screen name="RegisterScreen" options={{ headerShown: false }} />
    </Stack>
  );
}


