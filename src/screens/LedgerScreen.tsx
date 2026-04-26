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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CAT_COLORS, COLORS } from "../constants/theme";
import { useTransacciones } from "../hooks/useTransacciones";

export default function LedgerScreen() {
  const { transacciones, remove } = useTransacciones();
  // NUEVO: Sumamos transferencia a los filtros posibles
  const [filter, setFilter] = useState<"all" | "gasto" | "ingreso" | "transferencia" | "categoria">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categoriasActivas = new Set(transacciones.map((t) => t.categoria)).size;
  const categories = Array.from(new Set(transacciones.map((t) => t.categoria))).sort();

  const filtered = transacciones.filter((t) => {
    if (filter === "all") return true;
    if (filter === "categoria") {
      if (!selectedCategory) return true;
      return t.categoria === selectedCategory;
    }
    return t.tipo === filter;
  });

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
          <Text style={styles.subtitle}>
            Historial de tus ingresos y gastos • {categoriasActivas} categorías
          </Text>
        </View>

        {/* Filter Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterWrap}
          contentContainerStyle={styles.filterRow}
        >
          {(["all", "gasto", "ingreso", "transferencia", "categoria"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                filter === f && styles.filterPillActive,
              ]}
              onPress={() => {
                setFilter(f);
                if (f === "categoria" && !selectedCategory && categories.length > 0) {
                  setSelectedCategory(categories[0]);
                }
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {f === "all"
                  ? "Todas"
                  : f === "gasto"
                    ? "Gastos"
                    : f === "ingreso"
                      ? "Ingresos"
                      : f === "transferencia"
                        ? "Transferencias"
                        : "Categorías"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filter === "categoria" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.categoryText, isActive && styles.categoryTextActive]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

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
              {(groupedByDate.get(date) ?? []).map((t) => {
                const isExpanded = expandedId === t.id;
                const isTransfer = t.tipo === "transferencia";

                return (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.txnItem}
                    onPress={() => setExpandedId(isExpanded ? null : t.id)}
                    onLongPress={() => handleDelete(t.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.txnTopRow}>
                      <View style={styles.txnLeft}>
                        <View
                          style={[
                            styles.txnIconWrap,
                            {
                              backgroundColor: isTransfer 
                                ? COLORS.border 
                                : (CAT_COLORS[t.categoria as keyof typeof CAT_COLORS] || COLORS.accent),
                            },
                          ]}
                        >
                          {getTxnIcon(t.categoria, t.tipo, 18, '#fff')}
                        </View>
                        <View style={styles.txnInfo}>
                          <Text style={styles.txnDesc}>{t.categoria}</Text>
                          <Text style={styles.txnMeta} numberOfLines={1}>
                            {t.fuente} • {t.descripcion}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.txnRight}>
                        <Text
                          style={[
                            styles.txnAmount,
                            t.tipo === "gasto" ? styles.txnGasto : t.tipo === "ingreso" ? styles.txnIngreso : styles.txnTransfer,
                          ]}
                        >
                          {t.tipo === "gasto" ? "− " : t.tipo === "ingreso" ? "+ " : ""} $
                          {t.monto.toLocaleString("es-AR")}
                        </Text>
                        <Text style={styles.txnHour}>{formatTxnHour(t)}</Text>
                      </View>
                    </View>

                    {isExpanded && (
                      <View style={styles.txnExpanded}>
                        <Text style={styles.expandedLabel}>Registro original de IA:</Text>
                        <Text style={styles.expandedText}>
                          "{t.raw_input || 'No hay texto original disponible'}"
                        </Text>
                        <Text style={styles.expandedSubText}>
                          Guardado como: {t.descripcion}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
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

// NUEVO: Ignora las transferencias en la suma diaria
function getDateNetTotal(
  txns: Array<{ monto: number; tipo: "gasto" | "ingreso" | "transferencia" }>,
) {
  return txns.reduce((sum, txn) => {
    if (txn.tipo === "transferencia") return sum;
    return sum + (txn.tipo === "ingreso" ? txn.monto : -txn.monto);
  }, 0);
}

function formatSignedAmount(amount: number) {
  const sign = amount >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(amount).toLocaleString("es-AR")}`;
}

// NUEVO: Ícono especial para Transferencias
function getTxnIcon(categoria: string, tipo: "gasto" | "ingreso" | "transferencia", size = 18, color = "#fff") {
  if (tipo === "transferencia" || categoria === "Transferencias") {
    return <MaterialCommunityIcons name="swap-horizontal" size={size} color={color} />;
  }
  if (tipo === "ingreso" || categoria === "Ingresos") {
    return <MaterialCommunityIcons name="cash-plus" size={size} color={color} />;
  }

  switch (categoria) {
    case "Alimentación":
      return <MaterialCommunityIcons name="silverware-fork-knife" size={size} color={color} />;
    case "Transporte":
      return <MaterialCommunityIcons name="car" size={size} color={color} />;
    case "Salud":
      return <MaterialCommunityIcons name="medical-bag" size={size} color={color} />;
    case "Vivienda":
      return <MaterialCommunityIcons name="home-variant" size={size} color={color} />;
    case "Entretenimiento":
      return <MaterialCommunityIcons name="gamepad-variant" size={size} color={color} />;
    case "Salidas":
      return <MaterialCommunityIcons name="glass-cocktail" size={size} color={color} />;
    case "Servicios":
      return <MaterialCommunityIcons name="flash" size={size} color={color} />;
    case "Varios":
    default:
      return <MaterialCommunityIcons name="receipt" size={size} color={color} />;
  }
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
  filterWrap: { flexGrow: 0, marginBottom: 20 },
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
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
  categoryRow: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  categoryPillActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + "30",
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.text2,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: COLORS.text1,
  },
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
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  txnTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  txnInfo: { flex: 1, paddingRight: 10 },
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
  txnTransfer: { color: COLORS.text2 }, // Color neutro para las transferencias
  
  txnExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  expandedLabel: {
    fontSize: 11,
    color: COLORS.text3,
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase"
  },
  expandedText: {
    fontSize: 13,
    color: COLORS.text2,
    fontStyle: "italic",
    lineHeight: 18,
  },
  expandedSubText: {
    fontSize: 11,
    color: COLORS.accent,
    marginTop: 6,
    fontWeight: "500",
  }
});