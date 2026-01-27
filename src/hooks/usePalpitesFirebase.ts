import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Palpite } from '@/types/firebase';
import { useAuth } from '@/contexts/AuthContextFirebase';

// Hook para buscar palpites do usuário por rodada
export const useMeusPalpites = (rodadaId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['meus-palpites', user?.uid, rodadaId],
    queryFn: async (): Promise<Palpite[]> => {
      if (!user || !rodadaId) return [];

      // Buscar diretamente por rodada_id e usuario_id (mais eficiente)
      const palpitesRef = collection(db, 'palpites');
      const palpitesQuery = query(
        palpitesRef,
        where('usuario_id', '==', user.uid),
        where('rodada_id', '==', rodadaId)
      );

      const snapshot = await getDocs(palpitesQuery);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          usuario_id: data.usuario_id,
          jogo_id: data.jogo_id,
          rodada_id: data.rodada_id || rodadaId,
          palpite_casa: data.palpite_casa,
          palpite_visitante: data.palpite_visitante,
          pontos_obtidos: data.pontos_obtidos,
          status: data.status || 'pendente',
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
        } as Palpite;
      });
    },
    enabled: !!user && !!rodadaId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Mutation para salvar palpite
export const useSalvarPalpite = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jogoId,
      rodadaId,
      palpiteCasa,
      palpiteVisitante,
    }: {
      jogoId: string;
      rodadaId: string;
      palpiteCasa: number;
      palpiteVisitante: number;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');
      if (!rodadaId) throw new Error('Rodada ID é obrigatório');

      // Verificar se já existe palpite
      const palpitesRef = collection(db, 'palpites');
      const q = query(
        palpitesRef,
        where('usuario_id', '==', user.uid),
        where('jogo_id', '==', jogoId)
      );

      const existingSnapshot = await getDocs(q);

      if (!existingSnapshot.empty) {
        // Atualizar palpite existente
        const palpiteDoc = existingSnapshot.docs[0];
        await updateDoc(doc(db, 'palpites', palpiteDoc.id), {
          palpite_casa: palpiteCasa,
          palpite_visitante: palpiteVisitante,
          rodada_id: rodadaId,
          status: 'pendente',
          updated_at: serverTimestamp(),
        });
        return { id: palpiteDoc.id };
      } else {
        // Criar novo palpite
        const docRef = await addDoc(collection(db, 'palpites'), {
          usuario_id: user.uid,
          jogo_id: jogoId,
          rodada_id: rodadaId,
          palpite_casa: palpiteCasa,
          palpite_visitante: palpiteVisitante,
          pontos_obtidos: null,
          status: 'pendente',
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        return { id: docRef.id };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meus-palpites'] });
    },
  });
};

// Mutation para salvar múltiplos palpites em batch
export const useSalvarPalpitesBatch = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rodadaId,
      palpites,
    }: {
      rodadaId: string;
      palpites: Array<{
        jogoId: string;
        palpiteCasa: number;
        palpiteVisitante: number;
      }>;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');
      if (!rodadaId) throw new Error('Rodada ID é obrigatório');
      if (!palpites || palpites.length === 0) {
        throw new Error('Nenhum palpite para salvar');
      }

      // Buscar todos os palpites existentes do usuário para esta rodada
      const palpitesRef = collection(db, 'palpites');
      const q = query(
        palpitesRef,
        where('usuario_id', '==', user.uid),
        where('rodada_id', '==', rodadaId)
      );
      const existingSnapshot = await getDocs(q);
      
      // Criar mapa de palpites existentes por jogo_id
      const palpitesExistentes = new Map<string, string>();
      existingSnapshot.docs.forEach(doc => {
        const data = doc.data();
        palpitesExistentes.set(data.jogo_id, doc.id);
      });

      // Preparar batch de operações
      let batch = writeBatch(db);
      let operacoes = 0;
      const BATCH_LIMIT = 500; // Limite do Firestore

      for (const palpite of palpites) {
        const palpiteIdExistente = palpitesExistentes.get(palpite.jogoId);
        
        if (palpiteIdExistente) {
          // Atualizar palpite existente
          const palpiteRef = doc(db, 'palpites', palpiteIdExistente);
          batch.update(palpiteRef, {
            palpite_casa: palpite.palpiteCasa,
            palpite_visitante: palpite.palpiteVisitante,
            rodada_id: rodadaId,
            status: 'pendente',
            updated_at: serverTimestamp(),
          });
        } else {
          // Criar novo palpite
          const palpiteRef = doc(collection(db, 'palpites'));
          batch.set(palpiteRef, {
            usuario_id: user.uid,
            jogo_id: palpite.jogoId,
            rodada_id: rodadaId,
            palpite_casa: palpite.palpiteCasa,
            palpite_visitante: palpite.palpiteVisitante,
            pontos_obtidos: null,
            status: 'pendente',
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
        }
        
        operacoes++;
        
        // Se atingir o limite, commitar e criar novo batch
        if (operacoes >= BATCH_LIMIT) {
          await batch.commit();
          batch = writeBatch(db); // Criar novo batch
          operacoes = 0;
        }
      }

      // Commitar batch final se houver operações pendentes
      if (operacoes > 0) {
        await batch.commit();
      }

      return { salvos: palpites.length };
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meus-palpites', user?.uid, variables.rodadaId] });
      queryClient.invalidateQueries({ queryKey: ['meus-palpites'] });
    },
  });
};

// Hook para buscar palpites de um jogo específico com dados do usuário
export const usePalpitesDoJogo = (jogoId?: string) => {
  return useQuery({
    queryKey: ['palpites-jogo', jogoId],
    queryFn: async (): Promise<(Palpite & { nome: string; nickname: string })[]> => {
      if (!jogoId) return [];

      try {
        const palpitesRef = collection(db, 'palpites');
        const q = query(
          palpitesRef,
          where('jogo_id', '==', jogoId)
        );

        const snapshot = await getDocs(q);
        const palpitesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            usuario_id: data.usuario_id,
            jogo_id: data.jogo_id,
            rodada_id: data.rodada_id,
            palpite_casa: data.palpite_casa,
            palpite_visitante: data.palpite_visitante,
            pontos_obtidos: data.pontos_obtidos,
            status: data.status || 'pendente',
            created_at: data.created_at?.toDate() || new Date(),
            updated_at: data.updated_at?.toDate() || new Date(),
            nome: '',
            nickname: '',
          };
        });

        // Buscar perfis dos usuários
        const profilesRef = collection(db, 'profiles');
        const userIds = [...new Set(palpitesData.map(p => p.usuario_id))];

        const profiles: Record<string, { nome: string; nickname: string }> = {};
        
        for (const userId of userIds) {
          const userQuery = query(profilesRef, where('id', '==', userId));
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const profileData = userSnapshot.docs[0].data();
            profiles[userId] = {
              nome: profileData.nome || 'Usuário Anônimo',
              nickname: profileData.nickname || 'anonymous',
            };
          } else {
            profiles[userId] = {
              nome: 'Usuário Anônimo',
              nickname: 'anonymous',
            };
          }
        }

        // Mesclar dados de palpites com perfis
        return palpitesData.map(palpite => ({
          ...palpite,
          nome: profiles[palpite.usuario_id]?.nome || 'Usuário Anônimo',
          nickname: profiles[palpite.usuario_id]?.nickname || 'anonymous',
        }));
      } catch (error) {
        console.error('Erro ao buscar palpites do jogo:', error);
        return [];
      }
    },
    enabled: !!jogoId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
