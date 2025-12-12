import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/lib/supabase";
import { RankingUser } from '@/types/database';

export function useRanking(rodadaId?: string) {
  return useQuery({
    queryKey: ['ranking', rodadaId],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Get all predictions with their games
      let palpitesQuery = supabase
        .from('palpites')
        .select('*, jogo:jogos(*, rodada:rodadas(*))');

      const { data: palpites, error: palpitesError } = await palpitesQuery;

      if (palpitesError) throw palpitesError;

      // Calculate ranking for each user
      const rankingMap = new Map<string, RankingUser>();

      for (const profile of profiles) {
        rankingMap.set(profile.id, {
          user_id: profile.id,
          nickname: profile.nickname,
          nome: profile.nome,
          avatar_url: profile.avatar_url,
          total_pontos: 0,
          total_acertos_resultado: 0,
          total_acertos_placar: 0,
          total_jogos: 0
        });
      }

      for (const palpite of palpites || []) {
        const jogo = palpite.jogo as any;
        
        // Filter by rodada if specified
        if (rodadaId && jogo?.rodada_id !== rodadaId) continue;
        
        // Only count finished games
        if (jogo?.status !== 'finalizado' || jogo?.placar_casa === null || jogo?.placar_visitante === null) continue;

        const userRanking = rankingMap.get(palpite.usuario_id);
        if (!userRanking) continue;

        userRanking.total_jogos++;

        if (palpite.pontos_obtidos !== null) {
          userRanking.total_pontos += palpite.pontos_obtidos;

          if (palpite.pontos_obtidos >= 3) {
            userRanking.total_acertos_resultado++;
          }

          if (palpite.pontos_obtidos === 5) {
            userRanking.total_acertos_placar++;
          }
        }
      }

      // Convert to array and sort
      const ranking = Array.from(rankingMap.values())
        .filter(r => r.total_jogos > 0 || !rodadaId)
        .sort((a, b) => {
          if (b.total_pontos !== a.total_pontos) return b.total_pontos - a.total_pontos;
          if (b.total_acertos_placar !== a.total_acertos_placar) return b.total_acertos_placar - a.total_acertos_placar;
          return b.total_acertos_resultado - a.total_acertos_resultado;
        });

      return ranking;
    }
  });
}

export function useTopRanking(limit = 5) {
  const { data: ranking, ...rest } = useRanking();

  return {
    data: ranking?.slice(0, limit),
    ...rest
  };
}
