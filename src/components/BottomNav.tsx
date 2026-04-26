import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/theme";

type RouteKey = "input" | "dashboard" | "ledger";

type Props = {
  active: RouteKey;
};

const ITEMS: Array<{ key: RouteKey; label: string; icon: string; href: "/" | "/dashboard" | "/ledger" }> = [
  { key: "input", label: "Nuevo", icon: "✍️", href: "/" },
  { key: "dashboard", label: "Dashboard", icon: "📊", href: "/dashboard" },
  { key: "ledger", label: "Transacciones", icon: "💸", href: "/ledger" },
];

export default function BottomNav({ active }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {ITEMS.map((item) => {
        const isActive = active === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.navBtn}
            onPress={() => {
              if (!isActive) router.replace(item.href);
            }}
            activeOpacity={0.75}
          >
            <Text style={[styles.navIcon, isActive && styles.navIconActive]}>{item.icon}</Text>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.75,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 11,
    color: COLORS.text2,
    fontWeight: "500",
  },
  navLabelActive: {
    color: COLORS.accent,
    fontWeight: "700",
  },
});
