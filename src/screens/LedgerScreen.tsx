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

  const sortedTxns = [...filtered].sort((a, b) => {
    const aTime = new Date(a.created_at ?? `${a.fecha}T00:00:00`).getTime();
    const bTime = new Date(b.created_at ?? `${b.fecha}T00:00:00`).getTime();
    return bTime - aTime;
  });

  const groupedByDate = new Map<string, typeof transacciones>();
  sortedTxns.forEach((t) => {
    const dateGroup = groupedByDate.get(t.fecha) ?? [];
    dateGroup.push(t);
    groupedByDate.set(t.fecha, dateGroup);
  });

  const sortedDates = Array.from(groupedByDate.keys()).sort().reverse();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Transacciones</Text>
          <Text style={styles.subtitle}>Historial de tus ingresos y gastos</Text>
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
              <View style={styles.dateHeaderRow}>
                <Text style={styles.dateHeader}>
                  {new Date(date + "T00:00:00").toLocaleDateString("es-AR", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <Text style={styles.dateTotal}>
                  {formatSignedAmount(getDateNetTotal(groupedByDate.get(date) ?? []))}
                </Text>
              </View>
              {(groupedByDate.get(date) ?? []).map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.txnItem}
                  onLongPress={() => handleDelete(t.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.txnLeft}>
                    <View
                      style={[
                        styles.txnIconWrap,
                        {
                          backgroundColor:
                            CAT_COLORS[
                              t.categoria as keyof typeof CAT_COLORS
                            ] || COLORS.accent,
                        },
                      ]}
                    >
                      <Text style={styles.txnIconText}>
                        {t.categoria.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.txnInfo}>
                      <Text style={styles.txnDesc}>{t.descripcion}</Text>
                      <Text style={styles.txnMeta}>
                        {t.fuente} • {t.categoria}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.txnRight}>
                    <Text
                      style={[
                        styles.txnAmount,
                        t.tipo === "gasto" ? styles.txnGasto : styles.txnIngreso,
                      ]}
                    >
                      {t.tipo === "gasto" ? "−" : "+"} $
                      {t.monto.toLocaleString("es-AR")}
                    </Text>
                    <Text style={styles.txnHour}>{formatTxnHour(t)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTxnHour(txn: { created_at?: string }) {
  if (!txn.created_at) return "s/hora";
  const date = new Date(txn.created_at);
  if (Number.isNaN(date.getTime())) return "s/hora";
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getDateNetTotal(
  txns: Array<{ monto: number; tipo: "gasto" | "ingreso" }>,
) {
  return txns.reduce(
    (sum, txn) => sum + (txn.tipo === "ingreso" ? txn.monto : -txn.monto),
    0,
  );
}

function formatSignedAmount(amount: number) {
  const sign = amount >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(amount).toLocaleString("es-AR")}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "700", color: COLORS.text1 },
  subtitle: {
    fontSize: 13,
    color: COLORS.text2,
    marginTop: 4,
  },
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
  dateHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dateHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text2,
    textTransform: "uppercase",
  },
  dateTotal: {
    fontSize: 12,
    color: COLORS.text2,
    fontWeight: "700",
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
  txnIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  txnIconText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  txnInfo: { flex: 1 },
  txnDesc: { fontSize: 14, fontWeight: "600", color: COLORS.text1 },
  txnMeta: { fontSize: 11, color: COLORS.text2, marginTop: 2 },
  txnRight: {
    marginLeft: 8,
    alignItems: "flex-end",
  },
  txnAmount: { fontSize: 14, fontWeight: "700" },
  txnHour: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.text2,
  },
  txnGasto: { color: "#ff4757" },
  txnIngreso: { color: "#2ed573" },
});
