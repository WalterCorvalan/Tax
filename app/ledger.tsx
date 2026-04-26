import React from "react";
import { StyleSheet, View } from "react-native";
import BottomNav from "../src/components/BottomNav";
import { COLORS } from "../src/constants/theme";
import LedgerScreen from "../src/screens/LedgerScreen";

export default function Ledger() {
  return (
    <View style={styles.container}>
      <LedgerScreen />
      <BottomNav active="ledger" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});
