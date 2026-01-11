import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp 
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

      // Primeiro, buscar IDs dos jogos da rodada
      const jogosRef = collection(db, 'jogos');
      const jogosQuery = query(
        jogosRef,
        where('rodada_id', '==', rodadaId)
      );
      const jogosSnapshot = await getDocs(jogosQuery);
      const jogoIds = jogosSnapshot.docs.map(doc => doc.id);

      if (jogoIds.length === 0) return [];

      // Buscar palpites do usuário para esses jogos
      const palpitesRef = collection(db, 'palpites');
      const palpitesQuery = query(
        palpitesRef,
        where('usuario_id', '==', user.uid),
        where('jogo_id', 'in', jogoIds)
      );

      const snapshot = await getDocs(palpitesQuery);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          usuario_id: data.usuario_id,
          jogo_id: data.jogo_id,
          palpite_casa: data.palpite_casa,
          palpite_visitante: data.palpite_visitante,
          pontos_obtidos: data.pontos_obtidos,
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
      palpiteCasa,
      palpiteVisitante,
    }: {
      jogoId: string;
      palpiteCasa: number;
      palpiteVisitante: number;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

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
          updated_at: serverTimestamp(),
        });
        return { id: palpiteDoc.id };
      } else {
        // Criar novo palpite
        const docRef = await addDoc(collection(db, 'palpites'), {
          usuario_id: user.uid,
          jogo_id: jogoId,
          palpite_casa: palpiteCasa,
          palpite_visitante: palpiteVisitante,
          pontos_obtidos: null,
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
