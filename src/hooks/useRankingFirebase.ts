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

// Hook para buscar ranking geral (top N)
export const useTopRanking = (limitCount: number = 10) => {
  return useQuery({
    queryKey: ['ranking', limitCount],
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
        
        if (data.pontos_obtidos) {
          userStats[userId].total_pontos += data.pontos_obtidos;
          
          if (data.pontos_obtidos === 5) {
            userStats[userId].acertos_placar += 1;
          } else if (data.pontos_obtidos === 3) {
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

      // Ordenar por total de pontos (decrescente)
      rankingArray.sort((a, b) => b.total_pontos - a.total_pontos);

      // Aplicar limit
      return rankingArray.slice(0, limitCount);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook para buscar ranking completo
export const useRankingCompleto = () => {
  return useTopRanking(1000); // Buscar até 1000 usuários
};
