// Diccionarios de palabras clave
const CATEGORIAS: { [key: string]: string[] } = {
  'Alimentación': ['pizza', 'comida', 'delivery', 'restaurante', 'hambur', 'sandwich', 'cafe', 'almuerzo', 'desayuno', 'cena', 'chopp', 'cerveza', 'vino', 'vianda', 'supermercado'],
  'Transporte': ['uber', 'taxi', 'nafta', 'combustible', 'colectivo', 'subte', 'tren', 'estacionamiento', 'patente', 'mecanico', 'gomeria'],
  'Salud': ['doctor', 'medico', 'farmacia', 'medicamento', 'remedios', 'hospital', 'clinica', 'dentista', 'psicologo'],
  'Vivienda': ['alquiler', 'expensa', 'luz', 'agua', 'gas', 'internet', 'telefonico', 'mudanza', 'pintura'],
  'Entretenimiento': ['netflix', 'spotify', 'cine', 'pelicula', 'videojuego', 'juego', 'streaming', 'libro', 'musica'],
  'Salidas': ['bar', 'boliche', 'discoteca', 'club', 'fiesta', 'cerveceria', 'pub', 'noche'],
  'Servicios': ['peluqueria', 'corte', 'masaje', 'estetica', 'gym', 'educacion', 'clases'],
};

const FUENTES: { [key: string]: string[] } = {
  'Billetera Virtual': ['mp', 'mercado pago', 'billetera', 'virtual', 'ualá', 'brubank'],
  'Tarjeta de Crédito': ['tarjeta', 'credito', 'visa', 'mastercard', 'amex'],
  'Tarjeta de Débito': ['debito', 'débito'],
  'Banco': ['banco', 'transferencia', 'CBU', 'cbu'],
  'Efectivo': ['efectivo', 'en mano', 'cash'],
};

const INGRESOS_KEYWORDS = ['cobré', 'cobrė', 'sueldo', 'pago', 'recibí', 'gane', 'me pagaron', 'ingreso', 'venta'];

export type ParsedTransaction = {
  monto: number;
  descripcion: string;
  categoria: string;
  tipo: 'gasto' | 'ingreso';
  fuente: string;
};

export function parseTransactionLocal(rawText: string): ParsedTransaction {
  const text = rawText.toLowerCase().trim();
  
  // Extraer monto (número más grande en el texto)
  const numberMatches = text.match(/\d+(\.\d+)?/g) || [];
  if (!numberMatches.length) {
    throw new Error('No encontré un monto válido. Ej: "gasté 5000"');
  }
  const monto = Math.max(...numberMatches.map(n => parseInt(n, 10)));
  
  // Detectar tipo (gasto o ingreso)
  const esIngreso = INGRESOS_KEYWORDS.some(word => text.includes(word));
  const tipo = esIngreso ? 'ingreso' : 'gasto';
  
  // Detectar categoría
  let categoria = 'Varios';
  for (const [cat, keywords] of Object.entries(CATEGORIAS)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      categoria = cat;
      break;
    }
  }
  
  // Si es ingreso, forzar categoría
  if (esIngreso) {
    categoria = 'Ingresos';
  }
  
  // Detectar fuente
  let fuente = 'Otro';
  for (const [src, keywords] of Object.entries(FUENTES)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      fuente = src;
      break;
    }
  }
  
  // Generar descripción (primeras palabras significativas)
  const palabras = text.split(/\s+/).filter(p => p.length > 3 && !/^\d+/.test(p));
  const descripcion = palabras.slice(0, 3).join(' ').substring(0, 50) || categoria;
  
  return {
    monto,
    descripcion: descripcion.charAt(0).toUpperCase() + descripcion.slice(1),
    categoria,
    tipo: tipo as 'gasto' | 'ingreso',
    fuente,
  };
}
