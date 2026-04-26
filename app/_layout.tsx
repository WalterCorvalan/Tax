import { Stack } from "expo-router";
import { COLORS } from "../src/constants/theme";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="ledger" />
    </Stack>
  );
}
