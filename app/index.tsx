import React from "react";
import { StyleSheet, View } from "react-native";
import BottomNav from "../src/components/BottomNav";
import { COLORS } from "../src/constants/theme";
import InputScreen from "../src/screens/InputScreen";

export default function Index() {
  return (
    <View style={styles.container}>
      <InputScreen />
      <BottomNav active="input" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});
