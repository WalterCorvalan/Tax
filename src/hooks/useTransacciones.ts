import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type Transaccion = {
  id: string;
  fecha: string;
  monto: number;
  descripcion: string;
  categoria: string;
  tipo: 'gasto' | 'ingreso' | 'transferencia'; // <-- ACÁ ESTÁ LA MAGIA
  fuente: string;
  raw_input?: string;
  created_at?: string;
};

const isMissingRawInputColumn = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  const maybeError = error as { code?: string; message?: string };
  return (
    maybeError.code === 'PGRST204' &&
    maybeError.message?.includes("'raw_input' column") === true
  );
};

export function useTransacciones() {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .order('fecha', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTransacciones(data || []);
    } catch (e) {
      console.error('Error fetching transacciones:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    fetch();
  }, []);

  const insert = async (txn: Omit<Transaccion, 'id' | 'created_at'>) => {
    if (!supabase) {
      throw new Error(
        'Supabase no configurado. Define EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_KEY.',
      );
    }

    try {
      let { data, error } = await supabase
        .from('transacciones')
        .insert([txn])
        .select();

      if (error && isMissingRawInputColumn(error)) {
        const { raw_input, ...txnWithoutRawInput } = txn;
        const retryResult = await supabase
          .from('transacciones')
          .insert([txnWithoutRawInput])
          .select();
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) throw error;
      if (data && data[0]) {
        setTransacciones((prev) => [...prev, data[0]]);
      }
    } catch (e) {
      console.error('Error inserting transaccion:', e);
      throw e;
    }
  };

  const remove = async (id: string) => {
    if (!supabase) {
      throw new Error(
        'Supabase no configurado. Define EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_KEY.',
      );
    }

    try {
      const { error } = await supabase
        .from('transacciones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTransacciones((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.error('Error removing transaccion:', e);
      throw e;
    }
  };

  return { transacciones, loading, insert, remove, refetch: fetch };
}
