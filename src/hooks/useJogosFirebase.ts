import { useQuery } from '@tanstack/react-query';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Rodada, Jogo } from '@/types/firebase';

// Hook para buscar rodada atual
export const useRodadaAtual = () => {
  return useQuery({
    queryKey: ['rodada-atual'],
    queryFn: async (): Promise<Rodada | null> => {
      const rodasRef = collection(db, 'rodadas');
      const q = query(
        rodasRef,
        where('status', 'in', ['em_andamento', 'aguardando']),
        orderBy('numero', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        numero: data.numero,
        status: data.status,
        data_inicio: data.data_inicio?.toDate() || new Date(),
        data_fechamento: data.data_fechamento?.toDate() || new Date(),
        created_at: data.created_at?.toDate() || new Date(),
        updated_at: data.updated_at?.toDate() || new Date(),
      } as Rodada;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook para buscar próximos jogos
export const useProximosJogos = (limitCount: number = 10) => {
  return useQuery({
    queryKey: ['proximos-jogos', limitCount],
    queryFn: async (): Promise<Jogo[]> => {
      const jogosRef = collection(db, 'jogos');
      const q = query(
        jogosRef,
        where('status', '==', 'agendado'),
        orderBy('data_jogo', 'asc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          rodada_id: data.rodada_id,
          time_casa: data.time_casa,
          time_visitante: data.time_visitante,
          data_jogo: data.data_jogo?.toDate() || new Date(),
          placar_casa: data.placar_casa,
          placar_visitante: data.placar_visitante,
          status: data.status,
          logo_casa: data.logo_casa,
          logo_visitante: data.logo_visitante,
          api_fixture_id: data.api_fixture_id,
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
        } as Jogo;
      });
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para buscar jogos de uma rodada específica
export const useJogosPorRodada = (rodadaId?: string) => {
  return useQuery({
    queryKey: ['jogos-rodada', rodadaId],
    queryFn: async (): Promise<Jogo[]> => {
      if (!rodadaId) return [];

      const jogosRef = collection(db, 'jogos');
      const q = query(
        jogosRef,
        where('rodada_id', '==', rodadaId),
        orderBy('data_jogo', 'asc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          rodada_id: data.rodada_id,
          time_casa: data.time_casa,
          time_visitante: data.time_visitante,
          data_jogo: data.data_jogo?.toDate() || new Date(),
          placar_casa: data.placar_casa,
          placar_visitante: data.placar_visitante,
          status: data.status,
          logo_casa: data.logo_casa,
          logo_visitante: data.logo_visitante,
          api_fixture_id: data.api_fixture_id,
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
        } as Jogo;
      });
    },
    enabled: !!rodadaId,
    staleTime: 5 * 60 * 1000,
  });
};
