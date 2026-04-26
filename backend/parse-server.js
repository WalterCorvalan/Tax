const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");

dotenv.config();

const app = express();
const port = Number(process.env.PARSE_API_PORT || 8787);
const geminiApiKey = process.env.GEMINI_API_KEY;

const transactionSchema = z.object({
  monto: z.number().positive(),
  descripcion: z.string().min(2).max(80),
  categoria: z.string().min(2).max(30),
  // NUEVO: Agregamos "transferencia" al enum
  tipo: z.enum(["gasto", "ingreso", "transferencia"]),
  // NUEVO: Ampliamos el max a 60 para que entren cosas como "Mercado Pago -> Naranja X"
  fuente: z.string().min(2).max(60), 
});
const responseSchema = z.object({
  transactions: z.array(transactionSchema).min(1),
});

app.use(cors());
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/parse", async (req, res) => {
  try {
    if (!geminiApiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY no configurada en el backend.",
      });
    }

    const rawText = String(req.body?.text || "").trim();
    if (!rawText) {
      return res.status(400).json({ error: "El campo 'text' es obligatorio." });
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const clauses = splitIntoTransactionClauses(rawText);
    const parsedTransactions = [];

    for (const clause of clauses) {
      const one = await parseSingleClauseWithGemini(ai, clause);
      const withRules = applyBusinessGuards(one, clause);
      parsedTransactions.push(withRules);
    }

    const validated = responseSchema.parse({ transactions: parsedTransactions });
    const fecha = new Date().toISOString().slice(0, 10);

    return res.json({
      transactions: validated.transactions.map((txn) => ({
        ...txn,
        // No sanitizamos la descripción si es una transferencia, para no borrar los nombres de los bancos
        descripcion: txn.tipo === "transferencia" ? txn.descripcion : sanitizeDescription(txn.descripcion, txn.fuente),
        fecha,
        parser: "gemini",
      })),
      parser: "gemini",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return res.status(422).json({
      error: "No se pudo parsear con IA.",
      detail: message,
    });
  }
});

app.listen(port, () => {
  console.log(`Parse API escuchando en http://localhost:${port}`);
});

function sanitizeDescription(descripcion, fuente) {
  const sourceWords = [
    "mercado pago", "mp", "naranja x", "naranja", 
    "banco nacion", "nacion", "brubank", "efectivo",
    String(fuente || "").toLowerCase(),
  ];
  let cleaned = String(descripcion || "").trim();
  sourceWords.forEach((word) => {
    if (!word) return;
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleaned = cleaned.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "").trim();
  });
  cleaned = cleaned.replace(/\s{2,}/g, " ");
  if (!cleaned) return "Transacción";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

async function parseSingleClauseWithGemini(ai, clauseText) {
  const prompt = [
    "Sos un clasificador contable de transacciones personales en Argentina.",
    "Convertí texto libre en UNICAMENTE un JSON valido sin markdown.",
    "Si no se especifica medio de pago o cuenta, usar fuente='Efectivo'.",
    "Detectar correctamente estas fuentes si aparecen: Mercado Pago, Naranja X, Banco Nacion, Brubank, Efectivo.",
    "Categorias esperadas: Alimentación, Transporte, Salud, Vivienda, Entretenimiento, Salidas, Servicios, Ingresos, Transferencias, Varios.",
    "Descripcion corta y clara (2-4 palabras), sin incluir la cuenta/tarjeta/fuente a menos que sea una transferencia.",
    "Importante: 'me pagaron', 'me devolvieron', 'recibi' => ingreso.",
    // NUEVA REGLA PARA LA IA
    "REGLA CRÍTICA: Si el texto indica mover plata entre cuentas propias (ej: 'pase de mp a brubank', 'transferi 5000 a naranja'), clasificar EXCLUSIVAMENTE como tipo='transferencia' y categoria='Transferencias'. En el campo 'fuente' escribí el origen y el destino (ej: 'Mercado Pago -> Brubank').",
    `Texto: "${clauseText}"`,
    "Respuesta JSON obligatoria con claves: monto, descripcion, categoria, tipo, fuente.",
  ].join("\n");

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  const parsedJson = JSON.parse(result.text);
  return transactionSchema.parse(parsedJson);
}

function splitIntoTransactionClauses(rawText) {
  const cleaned = String(rawText || "").replace(/\s+/g, " ").trim();
  const chunks = cleaned.split(/\s+y\s+/i);
  const withAmount = chunks.filter((chunk) => /\d/.test(chunk));
  return withAmount.length > 0 ? withAmount : [cleaned];
}

function applyBusinessGuards(txn, clauseText) {
  const text = normalize(clauseText);
  
  // NUEVO: Prioridad máxima a transferencias
  // NUEVO: Diccionario más amplio y a prueba de errores de tipeo
  const transferenciaHints = [
    "pase", "transferi", "movi",
    "transferencia", "transferecia", "transfer"
  ];
  const isTransferencia = transferenciaHints.some((hint) => text.includes(hint)) || txn.tipo === "transferencia";

  if (isTransferencia) {
    return { ...txn, tipo: "transferencia", categoria: "Transferencias" };
  }

  const ingresoHints = [ "me pagaron", "me devolvieron", "devolucion", "devolvieron", "recibi", "cobre", "cobro", "reintegro" ];
  const gastoHints = ["compre", "gaste", "pague", "abone"];

  const hasIngresoHint = ingresoHints.some((hint) => text.includes(hint));
  const hasGastoHint = gastoHints.some((hint) => text.includes(hint));

  if (hasIngresoHint) {
    const fixed = { ...txn, tipo: "ingreso", categoria: "Ingresos" };
    if (normalize(fixed.descripcion).includes("compre")) {
      if (text.includes("devolv")) fixed.descripcion = "Devolución recibida";
      else if (text.includes("pagaron")) fixed.descripcion = "Ingreso recibido";
      else fixed.descripcion = "Cobro recibido";
    }
    return fixed;
  }

  if (hasGastoHint && !hasIngresoHint) {
    return { ...txn, tipo: "gasto" };
  }

  return txn;
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}