import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";
import { CAT_COLORS, COLORS } from "../constants/theme";
import { useTransacciones } from "../hooks/useTransacciones";

export default function DashboardScreen() {
  const { transacciones } = useTransacciones();

  const gastos = transacciones.filter((t) => t.tipo === "gasto");
  const ingresos = transacciones.filter((t) => t.tipo === "ingreso");

  const totalGastos = gastos.reduce((sum, t) => sum + t.monto, 0);
  const totalIngresos = ingresos.reduce((sum, t) => sum + t.monto, 0);
  const balance = totalIngresos - totalGastos;

  // Agrupar gastos por categoría
  const porCategoria: { [key: string]: number } = {};
  gastos.forEach((t) => {
    porCategoria[t.categoria] = (porCategoria[t.categoria] || 0) + t.monto;
  });

  const topCategorias = Object.entries(porCategoria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const chartData = topCategorias.map(([cat, monto]) => ({
    value: monto,
    label: cat.slice(0, 3),
    frontColor: CAT_COLORS[cat as keyof typeof CAT_COLORS] || COLORS.accent,
  }));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: "#2ed573" }]}>
            <Text style={styles.summaryLabel}>Ingresos</Text>
            <Text style={styles.summaryAmount}>
              ${totalIngresos.toLocaleString("es-AR")}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: "#ff4757" }]}>
            <Text style={styles.summaryLabel}>Gastos</Text>
            <Text style={styles.summaryAmount}>
              ${totalGastos.toLocaleString("es-AR")}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.balanceCard,
            { borderLeftColor: balance >= 0 ? "#2ed573" : "#ff4757" },
          ]}
        >
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text
            style={[
              styles.balanceAmount,
              balance >= 0 ? styles.positive : styles.negative,
            ]}
          >
            {balance >= 0 ? "+" : "-"} $
            {Math.abs(balance).toLocaleString("es-AR")}
          </Text>
        </View>

        {/* Chart */}
        {chartData.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Gastos por Categoría</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={chartData}
                height={250}
                width={300}
                barWidth={40}
                spacing={20}
                xAxisLabelTextStyle={{ color: COLORS.text2, fontSize: 10 }}
                yAxisLabelTextStyle={{ color: COLORS.text2, fontSize: 10 }}
                showGradient
              />
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimas Transacciones</Text>
          {transacciones.slice(0, 5).map((t) => (
            <View key={t.id} style={styles.txnItem}>
              <View style={styles.txnLeft}>
                <View
                  style={[
                    styles.txnDot,
                    {
                      backgroundColor:
                        CAT_COLORS[t.categoria as keyof typeof CAT_COLORS] ||
                        COLORS.accent,
                    },
                  ]}
                />
                <View>
                  <Text style={styles.txnDesc}>{t.descripcion}</Text>
                  <Text style={styles.txnCat}>{t.categoria}</Text>
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
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: "700", color: COLORS.text1 },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderLeftWidth: 4,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryLabel: { fontSize: 12, color: COLORS.text2, marginBottom: 6 },
  summaryAmount: { fontSize: 18, fontWeight: "700", color: COLORS.text1 },
  balanceCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.card,
    borderLeftWidth: 4,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  balanceAmount: { fontSize: 24, fontWeight: "700", marginTop: 6 },
  positive: { color: "#2ed573" },
  negative: { color: "#ff4757" },
  chartSection: { paddingHorizontal: 20, marginBottom: 20 },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text1,
    marginBottom: 12,
  },
  chartContainer: { alignItems: "center" },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text1,
    marginBottom: 12,
  },
  txnItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  txnLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  txnDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  txnDesc: { fontSize: 14, fontWeight: "600", color: COLORS.text1 },
  txnCat: { fontSize: 11, color: COLORS.text2, marginTop: 2 },
  txnAmount: { fontSize: 14, fontWeight: "700" },
  txnGasto: { color: "#ff4757" },
  txnIngreso: { color: "#2ed573" },
});
