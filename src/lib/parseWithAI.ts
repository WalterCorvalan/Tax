import { ParsedTransaction } from "./parseLocal";

export type ParsedTransactionWithFecha = ParsedTransaction & {
  fecha?: string;
  parser?: "gemini" | "local";
};
type ParseApiResponse = {
  transactions: ParsedTransactionWithFecha[];
  parser?: "gemini";
};

const parseApiUrl = process.env.EXPO_PUBLIC_PARSE_API_URL;

export async function parseTransactionWithAI(
  rawText: string,
): Promise<ParsedTransactionWithFecha[]> {
  if (!parseApiUrl) {
    throw new Error(
      "EXPO_PUBLIC_PARSE_API_URL no configurada. Usando parser local.",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${parseApiUrl.replace(/\/$/, "")}/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: rawText }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorPayload = await response
        .json()
        .catch(() => ({ error: "Error de parse API" }));
      throw new Error(errorPayload.error || "Error de parse API");
    }

    const data = (await response.json()) as ParseApiResponse;
    return data.transactions;
  } finally {
    clearTimeout(timeout);
  }
}
