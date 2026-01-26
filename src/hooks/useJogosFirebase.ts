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
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Rodada, Jogo } from '@/types/firebase';

// Hook para buscar rodada atual
export const useRodadaAtual = () => {
  return useQuery({
    queryKey: ['rodada-atual'],
    queryFn: async (): Promise<Rodada | null> => {
      try {
        console.log('[useRodadaAtual] Iniciando busca por rodada atual...');
        
        const rodasRef = collection(db, 'rodadas');
        
        // Primeiro, tentar buscar por status 'em_andamento' (minúsculo)
        let q = query(
          rodasRef,
          where('status', '==', 'em_andamento'),
          orderBy('numero', 'desc'),
          limit(1)
        );

        let snapshot = await getDocs(q);
        
        // Se não encontrar, tentar buscar por 'aguardando'
        if (snapshot.empty) {
          console.log('[useRodadaAtual] Nenhuma rodada com status "em_andamento", tentando "aguardando"...');
          q = query(
            rodasRef,
            where('status', '==', 'aguardando'),
            orderBy('numero', 'desc'),
            limit(1)
          );
          snapshot = await getDocs(q);
        }
        
        if (snapshot.empty) {
          console.log('[useRodadaAtual] Nenhuma rodada encontrada com status "em_andamento" ou "aguardando"');
          console.log('[useRodadaAtual] Verificando todas as rodadas disponíveis...');
          
          // Buscar todas as rodadas para debug
          const todasRodadas = query(rodasRef, orderBy('numero', 'desc'), limit(5));
          const todasSnapshot = await getDocs(todasRodadas);
          
          if (!todasSnapshot.empty) {
            console.log('[useRodadaAtual] Rodadas encontradas (últimas 5):');
            todasSnapshot.docs.forEach(doc => {
              const data = doc.data();
              console.log(`  - ID: ${doc.id}, Número: ${data.numero}, Status: ${data.status}`);
            });
          } else {
            console.log('[useRodadaAtual] Nenhuma rodada encontrada no banco de dados');
          }
          
          return null;
        }

        const doc = snapshot.docs[0];
        const data = doc.data();

        const rodada = {
          id: doc.id,
          numero: data.numero,
          status: data.status,
          data_inicio: data.data_inicio?.toDate() || new Date(),
          data_fechamento: data.data_fechamento?.toDate() || new Date(),
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
        } as Rodada;

        // Auto-atualizar status se data de fechamento passou
        const agora = new Date();
        if (rodada.data_fechamento && agora > rodada.data_fechamento && rodada.status === 'aguardando') {
          console.log('[useRodadaAtual] Rodada expirada, atualizando status para "em_andamento"...');
          try {
            await updateDoc(doc.ref, {
              status: 'em_andamento',
              updated_at: serverTimestamp(),
            });
            rodada.status = 'em_andamento';
            console.log('[useRodadaAtual] Status atualizado para "em_andamento" com sucesso');
          } catch (error) {
            console.error('[useRodadaAtual] Erro ao atualizar status da rodada:', error);
            // Não lançar erro, apenas logar
          }
        }

        console.log('[useRodadaAtual] Rodada encontrada:', {
          id: rodada.id,
          numero: rodada.numero,
          status: rodada.status,
          data_fechamento: rodada.data_fechamento.toISOString(),
        });

        return rodada;
      } catch (error: any) {
        console.error('[useRodadaAtual] Erro ao buscar rodada atual:', error);
        console.error('[useRodadaAtual] Detalhes do erro:', {
          code: error?.code,
          message: error?.message,
          stack: error?.stack,
        });
        
        // Tratamento específico para erros de índice do Firestore
        if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
          console.error('[useRodadaAtual] Erro de índice do Firestore detectado');
          throw new Error(
            'Índice composto necessário no Firestore. ' +
            'Crie um índice para: status (Ascending) e numero (Descending) na coleção "rodadas". ' +
            'O link para criar o índice geralmente aparece no erro do console.'
          );
        }
        
        // Tratamento para outros erros
        if (error?.code === 'permission-denied') {
          console.error('[useRodadaAtual] Erro de permissão ao acessar rodadas');
          throw new Error('Sem permissão para acessar rodadas. Verifique as regras do Firestore.');
        }
        
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Tentar novamente em caso de erro
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
      try {
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
            rodada_numero: data.rodada_numero,
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
      } catch (error: any) {
        // Tratamento específico para erros de índice do Firestore
        if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
          console.error('Erro de índice do Firestore:', error);
          throw new Error(
            'Índice composto necessário no Firestore. ' +
            'Crie um índice para: status (Ascending) e data_jogo (Ascending) na coleção "jogos". ' +
            'O link para criar o índice geralmente aparece no erro do console.'
          );
        }
        console.error('Erro ao buscar próximos jogos:', error);
        throw error;
      }
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

      try {
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
            rodada_numero: data.rodada_numero,
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
      } catch (error: any) {
        // Tratamento específico para erros de índice do Firestore
        if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
          console.error('Erro de índice do Firestore:', error);
          throw new Error(
            'Índice composto necessário no Firestore. ' +
            'Crie um índice para: rodada_id (Ascending) e data_jogo (Ascending) na coleção "jogos". ' +
            'O link para criar o índice geralmente aparece no erro do console.'
          );
        }
        // Re-lançar outros erros
        console.error('Erro ao buscar jogos por rodada:', error);
        throw error;
      }
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
      rodada_numero?: number;
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
    onSuccess: async (_result, variables) => {
      // Invalidar todas as queries relacionadas
      await queryClient.invalidateQueries({ queryKey: ['proximos-jogos'] });
      await queryClient.invalidateQueries({ queryKey: ['jogos-rodada'] });
      await queryClient.invalidateQueries({ queryKey: ['jogos-rodada', variables.rodada_id] });
      
      // Refetch explícito para garantir atualização imediata
      await queryClient.refetchQueries({ queryKey: ['jogos-rodada', variables.rodada_id] });
      await queryClient.refetchQueries({ queryKey: ['proximos-jogos'] });
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

// Função helper para calcular pontos de um palpite
// Função helper BLINDADA para calcular pontos
export function calcularPontos(
  palpiteCasaIn: any,
  palpiteVisitanteIn: any,
  placarCasaIn: any,
  placarVisitanteIn: any
): number {
  // 1. CONVERSÃO FORÇADA: Garante que tudo vira número antes de comparar
  // (Resolve o erro onde "2" texto não batia com 2 número)
  const pC = Number(palpiteCasaIn); // Palpite Casa
  const pV = Number(palpiteVisitanteIn); // Palpite Visitante
  const rC = Number(placarCasaIn); // Placar Real Casa
  const rV = Number(placarVisitanteIn); // Placar Real Visitante

  // Se algum valor for inválido (NaN), retorna 0 para não quebrar
  if (isNaN(pC) || isNaN(pV) || isNaN(rC) || isNaN(rV)) return 0;

  // 2. PRIORIDADE MÁXIMA: PLACAR EXATO (Cravada) -> 5 PONTOS
  // Verifica se os números são idênticos ANTES de ver quem ganhou
  if (pC === rC && pV === rV) {
    return 5;
  }

  // 3. PRIORIDADE SECUNDÁRIA: ACERTOU RESULTADO (Vencedor/Empate) -> 3 PONTOS
  // Quem ganhou no Real?
  const resultadoReal = rC > rV ? 'casa' : rC < rV ? 'visitante' : 'empate';
  // Quem ganhou no Palpite?
  const resultadoPalpite = pC > pV ? 'casa' : pC < pV ? 'visitante' : 'empate';

  if (resultadoReal === resultadoPalpite) {
    return 3;
  }

  // 4. ERROU TUDO -> 0 PONTOS
  return 0;
}

// Mutation para finalizar jogo e calcular pontos dos palpites
export const useFinalizarJogoECalcularPontos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      jogoId: string;
      rodadaId: string;
      placarCasa: number;
      placarVisitante: number;
    }) => {
      const { jogoId, rodadaId, placarCasa, placarVisitante } = payload;

      // Passo A: Atualizar jogo com placar e status finalizado
      const jogoRef = doc(db, 'jogos', jogoId);
      await updateDoc(jogoRef, {
        placar_casa: placarCasa,
        placar_visitante: placarVisitante,
        status: 'finalizado',
        updated_at: serverTimestamp(),
      });

      // Passo B: Buscar todos os palpites do jogo
      const palpitesRef = collection(db, 'palpites');
      const palpitesQuery = query(
        palpitesRef,
        where('jogo_id', '==', jogoId)
      );
      const palpitesSnapshot = await getDocs(palpitesQuery);

      if (palpitesSnapshot.empty) {
        return { jogoId, palpitesAtualizados: 0 };
      }

      // Passo C e D: Calcular pontos e atualizar palpites em batch
      const BATCH_LIMIT = 500; // Limite do Firestore
      const palpites = palpitesSnapshot.docs;
      let totalAtualizados = 0;

      // Processar em batches se necessário
      for (let i = 0; i < palpites.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        const batchPalpites = palpites.slice(i, i + BATCH_LIMIT);

        batchPalpites.forEach((palpiteDoc) => {
          const data = palpiteDoc.data();
          const pontos = calcularPontos(
            data.palpite_casa,
            data.palpite_visitante,
            placarCasa,
            placarVisitante
          );

          const palpiteRef = doc(db, 'palpites', palpiteDoc.id);
          batch.update(palpiteRef, {
            pontos_obtidos: pontos,
            updated_at: serverTimestamp(),
          });
        });

        await batch.commit();
        totalAtualizados += batchPalpites.length;
      }

      return { jogoId, rodadaId, palpitesAtualizados: totalAtualizados };
    },
    onSuccess: async (_result, variables) => {
      // Invalidar cache de jogos, palpites e ranking
      await queryClient.invalidateQueries({ queryKey: ['jogos-rodada', variables.rodadaId] });
      await queryClient.invalidateQueries({ queryKey: ['jogos-rodada'] });
      await queryClient.invalidateQueries({ queryKey: ['proximos-jogos'] });
      await queryClient.invalidateQueries({ queryKey: ['meus-palpites'] });
      await queryClient.invalidateQueries({ queryKey: ['ranking'] });
    },
  });
};
