import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CAT_COLORS, COLORS } from "../constants/theme";
import { useTransacciones } from "../hooks/useTransacciones";

export default function LedgerScreen() {
  const { transacciones, remove } = useTransacciones();
  const [filter, setFilter] = useState<"all" | "gasto" | "ingreso">("all");

  const filtered =
    filter === "all"
      ? transacciones
      : transacciones.filter((t) => t.tipo === filter);

  const handleDelete = (id: string) => {
    Alert.alert("Eliminar", "¿Estás seguro?", [
      { text: "Cancelar", onPress: () => {} },
      {
        text: "Eliminar",
        onPress: () => remove(id),
        style: "destructive",
      },
    ]);
  };

  const groupedByDate: { [key: string]: typeof transacciones } = {};
  filtered.forEach((t) => {
    if (!groupedByDate[t.fecha]) groupedByDate[t.fecha] = [];
    groupedByDate[t.fecha].push(t);
  });

  const sortedDates = Object.keys(groupedByDate).sort().reverse();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Libro Mayor</Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(["all", "gasto", "ingreso"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                filter === f && styles.filterPillActive,
              ]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {f === "all" ? "Todas" : f === "gasto" ? "Gastos" : "Ingresos"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions by Date */}
        {sortedDates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay transacciones</Text>
          </View>
        ) : (
          sortedDates.map((date) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>
                {new Date(date + "T00:00:00").toLocaleDateString("es-AR", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
              {groupedByDate[date].map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.txnItem}
                  onLongPress={() => handleDelete(t.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.txnLeft}>
                    <View
                      style={[
                        styles.txnDot,
                        {
                          backgroundColor:
                            CAT_COLORS[
                              t.categoria as keyof typeof CAT_COLORS
                            ] || COLORS.accent,
                        },
                      ]}
                    />
                    <View style={styles.txnInfo}>
                      <Text style={styles.txnDesc}>{t.descripcion}</Text>
                      <Text style={styles.txnMeta}>
                        {t.categoria} • {t.fuente}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.txnAmount,
                      t.tipo === "gasto" ? styles.txnGasto : styles.txnIngreso,
                    ]}
                  >
                    {t.tipo === "gasto" ? "−" : "+"} $
                    {t.monto.toLocaleString("es-AR")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "700", color: COLORS.text1 },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "transparent",
  },
  filterPillActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterText: { fontSize: 13, color: COLORS.text2, fontWeight: "500" },
  filterTextActive: { color: "#fff" },
  emptyState: { paddingVertical: 60, alignItems: "center" },
  emptyText: { fontSize: 16, color: COLORS.text2 },
  dateGroup: { paddingHorizontal: 20, marginBottom: 16 },
  dateHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  txnItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  txnLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  txnDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  txnInfo: { flex: 1 },
  txnDesc: { fontSize: 14, fontWeight: "600", color: COLORS.text1 },
  txnMeta: { fontSize: 11, color: COLORS.text2, marginTop: 2 },
  txnAmount: { fontSize: 14, fontWeight: "700", marginLeft: 8 },
  txnGasto: { color: "#ff4757" },
  txnIngreso: { color: "#2ed573" },
});
