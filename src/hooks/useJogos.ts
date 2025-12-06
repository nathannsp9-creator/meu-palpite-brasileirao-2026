import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Jogo, Rodada } from '@/types/database';

export function useRodadas() {
  return useQuery({
    queryKey: ['rodadas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rodadas')
        .select('*')
        .order('numero', { ascending: true });

      if (error) throw error;
      return data as Rodada[];
    }
  });
}

export function useRodadaAtual() {
  return useQuery({
    queryKey: ['rodada-atual'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rodadas')
        .select('*')
        .in('status', ['em_andamento', 'futura'])
        .order('numero', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Rodada | null;
    }
  });
}

export function useJogosByRodada(rodadaId: string | undefined) {
  return useQuery({
    queryKey: ['jogos', rodadaId],
    queryFn: async () => {
      if (!rodadaId) return [];

      const { data, error } = await supabase
        .from('jogos')
        .select('*, rodada:rodadas(*)')
        .eq('rodada_id', rodadaId)
        .order('data_jogo', { ascending: true });

      if (error) throw error;
      return data as Jogo[];
    },
    enabled: !!rodadaId
  });
}

export function useProximosJogos(limit = 5) {
  return useQuery({
    queryKey: ['proximos-jogos', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jogos')
        .select('*, rodada:rodadas(*)')
        .eq('status', 'agendado')
        .gte('data_jogo', new Date().toISOString())
        .order('data_jogo', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Jogo[];
    }
  });
}

export function useCreateJogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jogo: Omit<Jogo, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('jogos')
        .insert(jogo)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jogos'] });
      queryClient.invalidateQueries({ queryKey: ['proximos-jogos'] });
    }
  });
}

export function useUpdateJogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...jogo }: Partial<Jogo> & { id: string }) => {
      const { data, error } = await supabase
        .from('jogos')
        .update(jogo)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jogos'] });
      queryClient.invalidateQueries({ queryKey: ['proximos-jogos'] });
    }
  });
}

export function useCreateRodada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rodada: Omit<Rodada, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('rodadas')
        .insert(rodada)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rodadas'] });
      queryClient.invalidateQueries({ queryKey: ['rodada-atual'] });
    }
  });
}
