import { useQuery } from '@tanstack/react-query';
import { 
  collection, 
  getDocs,
  query,
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RankingEntry } from '@/types/firebase';

// Hook para buscar ranking geral (top N) com filtro opcional de rodada
export const useTopRanking = (limitCount: number = 10, rodadaId?: string) => {
  return useQuery({
    queryKey: ['ranking', limitCount, rodadaId],
    queryFn: async (): Promise<RankingEntry[]> => {
      // Buscar todos os palpites
      const palpitesRef = collection(db, 'palpites');
      const palpitesSnapshot = await getDocs(palpitesRef);

      // Agrupar por usuário e calcular pontos
      const userStats: Record<string, {
        user_id: string;
        total_pontos: number;
        total_palpites: number;
        acertos_resultado: number;
        acertos_placar: number;
      }> = {};

      palpitesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const userId = data.usuario_id;
        
        // Filtrar por rodada se especificado
        if (rodadaId && data.rodada_id !== rodadaId) {
          return;
        }
        
        if (!userStats[userId]) {
          userStats[userId] = {
            user_id: userId,
            total_pontos: 0,
            total_palpites: 0,
            acertos_resultado: 0,
            acertos_placar: 0,
          };
        }

        userStats[userId].total_palpites += 1;
        
        if (data.pontos_obtidos !== null && data.pontos_obtidos !== undefined) {
          userStats[userId].total_pontos += data.pontos_obtidos;
          
          // Placar exato (5 pts) também é um acerto de resultado
          if (data.pontos_obtidos === 5) {
            userStats[userId].acertos_placar += 1;
            userStats[userId].acertos_resultado += 1;
          } 
          // 3 pontos = apenas resultado correto (sem placar exato)
          else if (data.pontos_obtidos === 3) {
            userStats[userId].acertos_resultado += 1;
          }
        }
      });

      // Buscar nicknames dos usuários
      const profilesRef = collection(db, 'profiles');
      const profilesSnapshot = await getDocs(profilesRef);
      
      const nicknames: Record<string, string> = {};
      profilesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        nicknames[doc.id] = data.nickname || 'Sem nome';
      });

      // Montar array de ranking
      const rankingArray: RankingEntry[] = Object.values(userStats).map(stats => ({
        ...stats,
        nickname: nicknames[stats.user_id] || 'Sem nome',
      }));

      // Ordenar por total de pontos (decrescente), depois por cravadas, depois por acertos
      rankingArray.sort((a, b) => {
        if (b.total_pontos !== a.total_pontos) return b.total_pontos - a.total_pontos;
        if (b.acertos_placar !== a.acertos_placar) return b.acertos_placar - a.acertos_placar;
        return b.acertos_resultado - a.acertos_resultado;
      });

      // Aplicar limit
      return rankingArray.slice(0, limitCount);
    },
    staleTime: 1 * 60 * 1000, // 1 minuto (reduzido para atualizar mais rápido)
  });
};

// Hook para buscar ranking completo
export const useRankingCompleto = (rodadaId?: string) => {
  return useTopRanking(1000, rodadaId); // Buscar até 1000 usuários
};
