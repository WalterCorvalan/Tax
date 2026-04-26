import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
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
    text: cat,
    color: CAT_COLORS[cat as keyof typeof CAT_COLORS] || COLORS.accent,
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
            <View style={styles.chartCard}>
              <View style={styles.chartContainer}>
              <PieChart
                data={chartData}
                donut
                radius={84}
                innerRadius={56}
                showText={false}
                strokeWidth={2}
                strokeColor={COLORS.bg}
                centerLabelComponent={() => (
                  <View style={styles.chartCenter}>
                    <Text style={styles.chartCenterLabel}>Total</Text>
                    <Text style={styles.chartCenterValue}>
                      ${totalGastos.toLocaleString("es-AR")}
                    </Text>
                  </View>
                )}
              />
              </View>
              <View style={styles.legendWrap}>
                {topCategorias.map(([cat, monto]) => (
                  <View key={cat} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        {
                          backgroundColor:
                            CAT_COLORS[cat as keyof typeof CAT_COLORS] ||
                            COLORS.accent,
                        },
                      ]}
                    />
                    <Text style={styles.legendText}>{cat}</Text>
                    <Text style={styles.legendAmount}>
                      ${monto.toLocaleString("es-AR")}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
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
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  chartContainer: { alignItems: "center", justifyContent: "center" },
  chartCenter: {
    alignItems: "center",
    justifyContent: "center",
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: COLORS.card,
  },
  chartCenterLabel: {
    fontSize: 11,
    color: COLORS.text2,
    marginBottom: 2,
  },
  chartCenterValue: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text1,
  },
  legendWrap: {
    marginTop: 16,
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.text1,
    flex: 1,
    fontWeight: "500",
  },
  legendAmount: {
    fontSize: 12,
    color: COLORS.text2,
    marginLeft: 8,
  },
});
