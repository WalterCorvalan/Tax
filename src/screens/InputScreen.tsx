import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CAT_COLORS, COLORS } from "../constants/theme";
import { useTransacciones } from "../hooks/useTransacciones";
import { parseTransactionLocal } from "../lib/parseLocal";
import {
  ParsedTransactionWithFecha,
  parseTransactionWithAI,
} from "../lib/parseWithAI";

const EXAMPLES = [
  "gasté 3500 en pizza con mp",
  "cobré el sueldo 180000 banco",
  "uber 1500 tarjeta",
  "alquiler 75000",
  "spotify 2990 débito",
  "remedios 4200 efectivo",
];

export default function InputScreen() {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsedTxns, setParsedTxns] = useState<ParsedTransactionWithFecha[]>([]);
  const [saving, setSaving] = useState(false);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const { insert, transacciones } = useTransacciones();

  const showCard = () => {
    Animated.spring(cardAnim, {
      toValue: 1,
      useNativeDriver: false,
      tension: 80,
      friction: 8,
    }).start();
  };

  const hideCard = () => {
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => setParsedTxns([]));
  };

  const handleParse = async () => {
    if (!text.trim()) return;
    Keyboard.dismiss();
    setParsing(true);
    setParsedTxns([]);
    cardAnim.setValue(0);

    try {
      let result: ParsedTransactionWithFecha[];
      try {
        result = await parseTransactionWithAI(text.trim());
      } catch {
        const local = parseTransactionLocal(text.trim());
        result = [{ ...local, parser: "local" }];
      }

      setParsedTxns(result);
      showCard();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMsg = e.message || "Error desconocido";
      Alert.alert("Error", errorMsg);
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (parsedTxns.length === 0) return;
    setSaving(true);
    try {
      for (const parsed of parsedTxns) {
        await insert({
          fecha: parsed.fecha ?? new Date().toISOString().slice(0, 10),
          monto: parsed.monto,
          descripcion: parsed.descripcion,
          categoria: parsed.categoria,
          tipo: parsed.tipo,
          fuente: parsed.fuente,
          raw_input: text.trim(),
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      hideCard();
      setText("");
    } catch (e: any) {
      Alert.alert("Error al guardar", e.message);
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const todaysTxns = transacciones.filter((t) => t.fecha === today);
  const todaysIngresos = todaysTxns
    .filter((t) => t.tipo === "ingreso")
    .reduce((sum, t) => sum + t.monto, 0);
  const todaysGastos = todaysTxns
    .filter((t) => t.tipo === "gasto")
    .reduce((sum, t) => sum + t.monto, 0);
  const todaysBalance = todaysIngresos - todaysGastos;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Buenos días,</Text>
            <Text style={styles.name}>Walter</Text>
          </View>
          <View style={styles.monthBadge}>
            <Text style={styles.monthText}>
              {new Date().toLocaleDateString("es-AR", {
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>¿En qué gastaste{"\n"}hoy?</Text>
          <Text style={styles.heroSub}>
            Escribilo como si le hablaras a alguien
          </Text>
        </View>

        <View style={styles.quickStats}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatLabel}>Movimientos hoy</Text>
            <Text style={styles.quickStatValue}>{todaysTxns.length}</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatLabel}>Balance del día</Text>
            <Text
              style={[
                styles.quickStatValue,
                todaysBalance >= 0 ? styles.positive : styles.negative,
              ]}
            >
              {todaysBalance >= 0 ? "+" : "-"} $
              {Math.abs(todaysBalance).toLocaleString("es-AR")}
            </Text>
          </View>
        </View>

        {/* Input */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={'Ej: "gasté 5000 en una pizza con mercado pago"'}
            placeholderTextColor={COLORS.text3}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.sendBtn, parsing && styles.sendBtnDisabled]}
            onPress={handleParse}
            disabled={parsing || !text.trim()}
            activeOpacity={0.8}
          >
            {parsing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendIcon}>↑</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Examples */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.examplesRow}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {EXAMPLES.map((ex) => (
            <TouchableOpacity
              key={ex}
              style={styles.exPill}
              onPress={() => setText(ex)}
              activeOpacity={0.7}
            >
              <Text style={styles.exText}>{ex}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Result Card */}
        {parsedTxns.length > 0 && (
          <Animated.View
            style={[
              styles.resultCard,
              {
                transform: [
                  {
                    translateY: cardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    }),
                  },
                ],
                opacity: cardAnim,
              },
            ]}
          >
            <View style={styles.cardBody}>
              <Text style={styles.resultTitle}>
                {parsedTxns.length > 1
                  ? `${parsedTxns.length} transacciones detectadas`
                  : "Transacción detectada"}
              </Text>
              {parsedTxns.map((parsed, idx) => {
                const catColor =
                  CAT_COLORS[parsed.categoria as keyof typeof CAT_COLORS] || COLORS.accent;
                const isGasto = parsed.tipo === "gasto";

                return (
                  <View
                    key={`${parsed.descripcion}-${parsed.monto}-${idx}`}
                    style={styles.txnPreview}
                  >
                    <View style={[styles.txnPreviewBadge, { backgroundColor: catColor }]} />
                    <View style={styles.txnPreviewMain}>
                      <Text style={styles.cardDesc}>{parsed.descripcion}</Text>
                      <Text style={styles.previewMeta}>
                        {parsed.categoria} • {parsed.fuente}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.previewAmount,
                        isGasto ? styles.amountGasto : styles.amountIngreso,
                      ]}
                    >
                      {isGasto ? "−" : "+"} ${parsed.monto.toLocaleString("es-AR")}
                    </Text>
                  </View>
                );
              })}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={hideCard}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: COLORS.accent }]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.text2,
    fontWeight: "400",
  },
  name: {
    fontSize: 28,
    color: COLORS.text1,
    fontWeight: "700",
    marginTop: 4,
  },
  monthBadge: {
    backgroundColor: COLORS.accent + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  monthText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  hero: {
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  heroTitle: {
    fontSize: 32,
    color: COLORS.text1,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 40,
  },
  heroSub: {
    fontSize: 14,
    color: COLORS.text2,
  },
  quickStats: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickStatLabel: {
    fontSize: 11,
    color: COLORS.text2,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 16,
    color: COLORS.text1,
    fontWeight: "700",
  },
  positive: {
    color: "#2ed573",
  },
  negative: {
    color: "#ff4757",
  },
  inputWrap: {
    marginHorizontal: 20,
    marginBottom: 20,
    position: "relative",
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    paddingRight: 50,
    fontSize: 16,
    color: COLORS.text1,
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
  },
  examplesRow: {
    marginBottom: 20,
  },
  exPill: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exText: {
    fontSize: 12,
    color: COLORS.text2,
  },
  resultCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardCategory: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  cardSource: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.8,
    marginTop: 2,
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  amountGasto: {
    color: "#ff4757",
  },
  amountIngreso: {
    color: "#2ed573",
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resultTitle: {
    fontSize: 14,
    color: COLORS.text2,
    marginBottom: 10,
    fontWeight: "600",
  },
  txnPreview: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  txnPreviewBadge: {
    width: 8,
    height: 32,
    borderRadius: 4,
    marginRight: 10,
  },
  txnPreviewMain: {
    flex: 1,
    marginRight: 10,
  },
  cardDesc: {
    fontSize: 14,
    color: COLORS.text1,
    fontWeight: "500",
  },
  previewMeta: {
    fontSize: 12,
    color: COLORS.text2,
    marginTop: 3,
  },
  previewAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 14,
    color: COLORS.text1,
    fontWeight: "600",
  },
  saveBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  saveText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
});
