// Diccionarios de palabras clave
const CATEGORIAS: { [key: string]: string[] } = {
  'Alimentación': ['pizza', 'comida', 'delivery', 'restaurante', 'hambur', 'sandwich', 'cafe', 'almuerzo', 'desayuno', 'cena', 'chopp', 'cerveza', 'vino', 'vianda', 'supermercado', 'helado', 'alfajor'],
  'Transporte': ['uber', 'taxi', 'nafta', 'combustible', 'colectivo', 'subte', 'tren', 'estacionamiento', 'patente', 'mecanico', 'gomeria'],
  'Salud': ['doctor', 'medico', 'farmacia', 'medicamento', 'remedios', 'hospital', 'clinica', 'dentista', 'psicologo'],
  'Vivienda': ['alquiler', 'expensa', 'luz', 'agua', 'gas', 'internet', 'telefonico', 'mudanza', 'pintura'],
  'Entretenimiento': ['netflix', 'spotify', 'cine', 'pelicula', 'videojuego', 'juego', 'streaming', 'libro', 'musica'],
  'Salidas': ['bar', 'boliche', 'discoteca', 'club', 'fiesta', 'cerveceria', 'pub', 'noche'],
  'Servicios': ['peluqueria', 'corte', 'masaje', 'estetica', 'gym', 'educacion', 'clases'],
};

const FUENTES_ESPECIFICAS: Array<{ fuente: string; keywords: string[] }> = [
  { fuente: 'Mercado Pago', keywords: ['mercado pago', 'mp', 'mercadopago'] },
  { fuente: 'Naranja X', keywords: ['naranja x', 'naranja', 'nx'] },
  { fuente: 'Banco Nación', keywords: ['banco nacion', 'nacion', 'bna'] },
  { fuente: 'Brubank', keywords: ['brubank', 'bru bank'] },
  { fuente: 'Efectivo', keywords: ['efectivo', 'en mano', 'cash'] },
];

const INGRESOS_KEYWORDS = ['cobre', 'cobré', 'sueldo', 'recibi', 'recibí', 'gane', 'me pagaron', 'ingreso', 'venta'];

// Extrae el monto asociado a palabras de ingreso
function extraerMontoIngreso(text: string): number {
  // Buscar patrones como "me pagaron 5000" o "cobre 180000"
  for (const keyword of INGRESOS_KEYWORDS) {
    const normalized = normalizeText(keyword);
    const pattern = new RegExp(`${escapeRegExp(normalized)}\\s+(\\d+)`);
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  
  // Si no encontramos patrón específico, tomar el número más grande
  const numberMatches = text.match(/\d+(\.\d+)?/g) || [];
  if (numberMatches.length) {
    return Math.max(...numberMatches.map(n => parseInt(n, 10)));
  }
  return 0;
}

// Extrae el monto asociado a gastos (número más cercano a palabras de gasto)
function extraerMontoGasto(text: string): number {
  const gastoKeywords = ['gaste', 'gasté', 'compre', 'compré', 'pague', 'pagué', 'costo', 'costó', 'llene', 'abone'];
  
  // Buscar patrones como "gasté 5000" o "compré 1000"
  for (const keyword of gastoKeywords) {
    const normalized = normalizeText(keyword);
    const pattern = new RegExp(`${escapeRegExp(normalized)}\\s+[a-z\\s]*?(\\d+)`);
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  
  // Buscar "por 5000" (como en "compre X por 5000")
  const porMatch = text.match(/por\s+(\d+)/);
  if (porMatch && porMatch[1]) {
    return parseInt(porMatch[1], 10);
  }
  
  // Si hay múltiples números y se detectó que hay ingresos también,
  // tomar el número más pequeño (es probable que sea el gasto)
  const numberMatches = text.match(/\d+(\.\d+)?/g) || [];
  if (numberMatches.length > 1) {
    return Math.min(...numberMatches.map(n => parseInt(n, 10)));
  }
  
  // Si hay solo un número, tomarlo
  if (numberMatches.length === 1) {
    return parseInt(numberMatches[0], 10);
  }
  
  return 0;
}

export type ParsedTransaction = {
  monto: number;
  descripcion: string;
  categoria: string;
  tipo: 'gasto' | 'ingreso' | 'transferencia'; // <-- ACTUALIZADO
  fuente: string;
};

export function parseTransactionLocal(rawText: string): ParsedTransaction {
  const text = normalizeText(rawText);
  
  // Detectar intención
  // Detectar intención con más tolerancia
  const esTransferencia = ['pase', 'transferi', 'movi', 'transferencia', 'transferecia', 'transfer'].some((word) => text.includes(word));
  const esIngreso = INGRESOS_KEYWORDS.some((word) => matchesKeyword(text, normalizeText(word)));
  
  let monto: number;
  let tipo: 'gasto' | 'ingreso' | 'transferencia';
  
  if (esTransferencia) {
    tipo = 'transferencia';
    monto = extraerMontoGasto(text); // Usamos la lógica de gasto para encontrar el número
  } else if (esIngreso) {
    tipo = 'ingreso';
    monto = extraerMontoIngreso(text);
  } else {
    tipo = 'gasto';
    monto = extraerMontoGasto(text);
  }
  
  // Detectar categoría
  let categoria = 'Varios';
  for (const [cat, keywords] of Object.entries(CATEGORIAS)) {
    if (keywords.some((keyword) => matchesKeyword(text, normalizeText(keyword)))) {
      categoria = cat;
      break;
    }
  }
  
  // Forzar categorías fijas
  if (esTransferencia) {
    categoria = 'Transferencias';
  } else if (esIngreso) {
    categoria = 'Ingresos';
  }
  
  // Detectar fuente (prioridad a cuentas/tarjetas específicas)
  let fuente = 'Otro';
  for (const src of FUENTES_ESPECIFICAS) {
    if (src.keywords.some((keyword) => matchesKeyword(text, normalizeText(keyword)))) {
      fuente = src.fuente;
      break;
    }
  }

  // Fallback por intención de negocio:
  // si no se menciona medio de pago explícito, asumimos efectivo.
  if (fuente === 'Otro') {
    fuente = 'Efectivo';
  }
  
  // Generar descripción (primeras palabras significativas)
  const bannedDescriptionWords = [
    'mercado',
    'pago',
    'mp',
    'naranja',
    'brubank',
    'banco',
    'nacion',
    'efectivo',
    'con',
    'por',
  ];
  const palabras = text
    .split(/\s+/)
    .filter((p) => p.length > 2 && !/^\d+/.test(p))
    .filter((p) => !bannedDescriptionWords.includes(p));
  const descripcion = palabras.slice(0, 3).join(' ').substring(0, 50) || categoria;
  
  return {
    monto,
    descripcion: descripcion.charAt(0).toUpperCase() + descripcion.slice(1),
    categoria,
    tipo: tipo as 'gasto' | 'ingreso',
    fuente,
  };
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function matchesKeyword(text: string, keyword: string) {
  if (!keyword) return false;

  // Palabras muy cortas (ej: "mp", "nx") deben matchear token completo.
  if (keyword.length <= 3) {
    const escaped = escapeRegExp(keyword);
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`);
    return regex.test(text);
  }

  return text.includes(keyword);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
