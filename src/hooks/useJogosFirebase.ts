import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  Timestamp,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc
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

// Hook para listar rodadas
export const useRodadas = () => {
  return useQuery({
    queryKey: ['rodadas'],
    queryFn: async (): Promise<Rodada[]> => {
      const rodasRef = collection(db, 'rodadas');
      const q = query(rodasRef, orderBy('numero', 'asc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          numero: data.numero,
          status: data.status,
          data_inicio: data.data_inicio?.toDate() || null,
          data_fechamento: data.data_fechamento?.toDate() || null,
          created_at: data.created_at?.toDate() || null,
          updated_at: data.updated_at?.toDate() || null,
        } as Rodada;
      });
    },
    staleTime: 5 * 60 * 1000,
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

// Mutation para criar jogo
export const useCriarJogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      rodada_id: string;
      time_casa: string;
      time_visitante: string;
      data_jogo: Date;
      logo_casa?: string | null;
      logo_visitante?: string | null;
      status?: string;
    }) => {
      const docRef = await addDoc(collection(db, 'jogos'), {
        ...payload,
        status: payload.status || 'agendado',
        data_jogo: Timestamp.fromDate(payload.data_jogo),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return { id: docRef.id, data: payload };
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proximos-jogos'] });
      queryClient.invalidateQueries({ queryKey: ['jogos-rodada'] });
      queryClient.invalidateQueries({ queryKey: ['jogos-rodada', variables.rodada_id] });
    },
  });
};

// Mutation para atualizar jogo (placar/status/datas)
export const useAtualizarJogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      data?: Partial<{
        time_casa: string;
        time_visitante: string;
        data_jogo: Date;
        placar_casa: number | null;
        placar_visitante: number | null;
        status: string;
        logo_casa?: string | null;
        logo_visitante?: string | null;
      }>;
    }) => {
      const { id, data } = payload;
      const updateData: Record<string, any> = { ...data, updated_at: serverTimestamp() };
      if (data?.data_jogo instanceof Date) {
        updateData.data_jogo = Timestamp.fromDate(data.data_jogo);
      }

      await updateDoc(doc(db, 'jogos', id), updateData);
      return { id };
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proximos-jogos'] });
      queryClient.invalidateQueries({ queryKey: ['jogos-rodada'] });
      if (variables.data?.rodada_id) {
        queryClient.invalidateQueries({ queryKey: ['jogos-rodada', variables.data.rodada_id] });
      }
    },
  });
};

// Mutation para deletar jogo
export const useDeletarJogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await deleteDoc(doc(db, 'jogos', id));
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proximos-jogos'] });
      queryClient.invalidateQueries({ queryKey: ['jogos-rodada'] });
    },
  });
};

// Mutation para criar rodada
export const useCriarRodada = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      numero: number;
      status: string;
      data_inicio?: Date | null;
      data_fechamento?: Date | null;
    }) => {
      const docRef = await addDoc(collection(db, 'rodadas'), {
        ...payload,
        data_inicio: payload.data_inicio ? Timestamp.fromDate(payload.data_inicio) : null,
        data_fechamento: payload.data_fechamento ? Timestamp.fromDate(payload.data_fechamento) : null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return { id: docRef.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rodadas'] });
      queryClient.invalidateQueries({ queryKey: ['rodada-atual'] });
    },
  });
};

// Mutation para atualizar rodada
export const useAtualizarRodada = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      data: Partial<{
        numero: number;
        status: string;
        data_inicio?: Date | null;
        data_fechamento?: Date | null;
      }>;
    }) => {
      const { id, data } = payload;
      const updateData: Record<string, any> = { ...data, updated_at: serverTimestamp() };
      if (data.data_inicio instanceof Date) {
        updateData.data_inicio = Timestamp.fromDate(data.data_inicio);
      }
      if (data.data_fechamento instanceof Date) {
        updateData.data_fechamento = Timestamp.fromDate(data.data_fechamento);
      }
      await updateDoc(doc(db, 'rodadas', id), updateData);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rodadas'] });
      queryClient.invalidateQueries({ queryKey: ['rodada-atual'] });
    },
  });
};
