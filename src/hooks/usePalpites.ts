import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Palpite } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export function useMeusPalpites(rodadaId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['meus-palpites', rodadaId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('palpites')
        .select('*, jogo:jogos(*, rodada:rodadas(*))')
        .eq('usuario_id', user.id);

      if (rodadaId) {
        query = query.eq('jogo.rodada_id', rodadaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Palpite[];
    },
    enabled: !!user
  });
}

export function usePalpitesByJogo(jogoId: string) {
  return useQuery({
    queryKey: ['palpites-jogo', jogoId],
    queryFn: async () => {
      const { data: palpites, error } = await supabase
        .from('palpites')
        .select('*')
        .eq('jogo_id', jogoId);

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(palpites.map(p => p.usuario_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return palpites.map(p => ({
        ...p,
        profile: profileMap.get(p.usuario_id)
      })) as Palpite[];
    }
  });
}

export function useUpsertPalpite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ jogo_id, palpite_casa, palpite_visitante }: { 
      jogo_id: string; 
      palpite_casa: number; 
      palpite_visitante: number 
    }) => {
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('palpites')
        .upsert({
          usuario_id: user.id,
          jogo_id,
          palpite_casa,
          palpite_visitante
        }, {
          onConflict: 'usuario_id,jogo_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meus-palpites'] });
      queryClient.invalidateQueries({ queryKey: ['palpites-jogo'] });
    }
  });
}

export function useSavePalpites() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (palpites: { jogo_id: string; palpite_casa: number; palpite_visitante: number }[]) => {
      if (!user) throw new Error('Não autenticado');

      const palpitesComUsuario = palpites.map(p => ({
        ...p,
        usuario_id: user.id
      }));

      const { data, error } = await supabase
        .from('palpites')
        .upsert(palpitesComUsuario, {
          onConflict: 'usuario_id,jogo_id'
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meus-palpites'] });
    }
  });
}
