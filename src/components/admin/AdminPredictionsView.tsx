import { useState, useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, FileCheck, AlertCircle, Clock } from "lucide-react";
import { useRodadas, useJogosPorRodada } from "@/hooks/useJogosFirebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface UserProgress {
  id: string;
  nome: string;
  nickname: string;
  email: string;
  totalPalpites: number;
  palpites: Array<{
    jogo_id: string;
    time_casa: string;
    time_visitante: string;
    placar_casa: number;
    placar_visitante: number;
  }>;
}

export default function AdminPredictionsView() {
  const { data: rodadas, isLoading: loadingRodadas } = useRodadas();
  const [selectedRodadaId, setSelectedRodadaId] = useState<string>("");
  const { data: jogosRodada, isLoading: loadingJogos } = useJogosPorRodada(selectedRodadaId);
  const [usersProgress, setUsersProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(false);

  // Selecionar rodada atual por padrão (aguardando ou em_andamento)
  useEffect(() => {
    if (rodadas && rodadas.length > 0 && !selectedRodadaId) {
      const currentRound = rodadas.find(
        r => r.status === 'aguardando' || r.status === 'em_andamento'
      ) || rodadas[0];
      setSelectedRodadaId(currentRound.id);
    }
  }, [rodadas, selectedRodadaId]);

  // Buscar progresso dos usuários
  useEffect(() => {
    async function fetchUsersProgress() {
      if (!selectedRodadaId || !jogosRodada || jogosRodada.length === 0) {
        setUsersProgress([]);
        return;
      }

      try {
        setLoading(true);

        // 1. Buscar IDs de administradores
        const userRolesRef = collection(db, "user_roles");
        const adminRolesQuery = query(userRolesRef, where("role", "==", "admin"));
        const adminRolesSnapshot = await getDocs(adminRolesQuery);
        const adminIds = new Set(adminRolesSnapshot.docs.map(doc => doc.id));

        // 2. Buscar todos os usuários (excluindo admins)
        const profilesRef = collection(db, "profiles");
        const profilesSnapshot = await getDocs(profilesRef);
        const allUsers = profilesSnapshot.docs
          .filter(doc => !adminIds.has(doc.id)) // Filtrar admins
          .map(doc => ({
            id: doc.id,
            nome: doc.data().nome || "",
            nickname: doc.data().nickname || "",
            email: doc.data().email || "",
          }));

        // 3. Buscar todos os palpites da rodada
        const palpitesRef = collection(db, "palpites");
        const palpitesQuery = query(palpitesRef, where("rodada_id", "==", selectedRodadaId));
        const palpitesSnapshot = await getDocs(palpitesQuery);

        // Organizar palpites por usuário
        const palpitesPorUsuario = new Map<string, any[]>();
        palpitesSnapshot.docs.forEach(doc => {
          const palpite = doc.data();
          const userId = palpite.usuario_id;
          
          if (!palpitesPorUsuario.has(userId)) {
            palpitesPorUsuario.set(userId, []);
          }
          
          // Encontrar o jogo correspondente
          const jogo = jogosRodada.find(j => j.id === palpite.jogo_id);
          if (jogo) {
            palpitesPorUsuario.get(userId)!.push({
              jogo_id: palpite.jogo_id,
              time_casa: jogo.time_casa,
              time_visitante: jogo.time_visitante,
              placar_casa: palpite.placar_casa,
              placar_visitante: palpite.placar_visitante,
            });
          }
        });

        // 4. Montar array de progresso
        const progress: UserProgress[] = allUsers.map(user => {
          const userPalpites = palpitesPorUsuario.get(user.id) || [];
          return {
            id: user.id,
            nome: user.nome || user.nickname,
            nickname: user.nickname,
            email: user.email,
            totalPalpites: userPalpites.length,
            palpites: userPalpites,
          };
        });

        // Ordenar: pendentes primeiro, depois em andamento, depois concluídos
        progress.sort((a, b) => {
          const totalJogos = jogosRodada.length;
          const statusA = a.totalPalpites === 0 ? 0 : a.totalPalpites < totalJogos ? 1 : 2;
          const statusB = b.totalPalpites === 0 ? 0 : b.totalPalpites < totalJogos ? 1 : 2;
          
          if (statusA !== statusB) return statusA - statusB;
          return a.nome.localeCompare(b.nome);
        });

        setUsersProgress(progress);
      } catch (error) {
        console.error("Erro ao buscar progresso:", error);
        toast.error("Erro ao carregar progresso dos usuários");
      } finally {
        setLoading(false);
      }
    }

    fetchUsersProgress();
  }, [selectedRodadaId, jogosRodada]);

  const totalJogos = jogosRodada?.length || 0;

  // Estatísticas gerais
  const stats = useMemo(() => {
    if (usersProgress.length === 0) {
      return { pendentes: 0, emAndamento: 0, concluidos: 0 };
    }

    return usersProgress.reduce((acc, user) => {
      if (user.totalPalpites === 0) {
        acc.pendentes++;
      } else if (user.totalPalpites < totalJogos) {
        acc.emAndamento++;
      } else {
        acc.concluidos++;
      }
      return acc;
    }, { pendentes: 0, emAndamento: 0, concluidos: 0 });
  }, [usersProgress, totalJogos]);

  const getStatusBadge = (totalPalpites: number) => {
    if (totalPalpites === 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Pendente
        </Badge>
      );
    }
    if (totalPalpites < totalJogos) {
      return (
        <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950">
          <Clock className="h-3 w-3" />
          Em Andamento
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        <FileCheck className="h-3 w-3" />
        Concluído
      </Badge>
    );
  };

  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (loadingRodadas) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Filtro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Monitoramento de Palpites</h2>
          <p className="text-muted-foreground">Acompanhe o progresso de cada participante</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Rodada:</span>
          <Select value={selectedRodadaId} onValueChange={setSelectedRodadaId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Selecione a rodada" />
            </SelectTrigger>
            <SelectContent>
              {rodadas?.map((rodada) => (
                <SelectItem key={rodada.id} value={rodada.id}>
                  Rodada {rodada.numero} ({rodada.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.pendentes}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.emAndamento}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.concluidos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Progresso */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso Individual</CardTitle>
          <CardDescription>
            {selectedRodadaId && totalJogos > 0
              ? `${totalJogos} jogo${totalJogos !== 1 ? 's' : ''} na rodada`
              : "Selecione uma rodada"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading || loadingJogos ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !selectedRodadaId || totalJogos === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-3 opacity-50" />
              <p>Nenhum jogo encontrado para esta rodada.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participante</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersProgress.map((user) => {
                    const progressPercent = totalJogos > 0 ? (user.totalPalpites / totalJogos) * 100 : 0;
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(user.nome)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                              <div className="font-medium">{user.nome}</div>
                              <div className="text-xs text-muted-foreground">@{user.nickname}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {user.totalPalpites}/{totalJogos}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({Math.round(progressPercent)}%)
                              </span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {getStatusBadge(user.totalPalpites)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
