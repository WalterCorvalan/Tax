import React from "react";
import { StyleSheet, View } from "react-native";
import BottomNav from "../src/components/BottomNav";
import { COLORS } from "../src/constants/theme";
import DashboardScreen from "../src/screens/DashboardScreen";

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <DashboardScreen />
      <BottomNav active="dashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});
