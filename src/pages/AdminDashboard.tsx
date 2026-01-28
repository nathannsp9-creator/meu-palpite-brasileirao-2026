import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, FileCheck, Activity, Loader2, Settings, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContextFirebase";
import { useRodadas } from "@/hooks/useJogosFirebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface UserPending {
  id: string;
  nickname: string;
  nome: string;
  email: string;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: rodadas, isLoading: loadingRodadas } = useRodadas();
  
  const [totalParticipantes, setTotalParticipantes] = useState<number>(0);
  const [palpitesRodadaAtual, setPalpitesRodadaAtual] = useState<number>(0);
  const [usersPendentes, setUsersPendentes] = useState<UserPending[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Buscar rodada atual (aguardando, em_andamento ou mais próxima)
  const rodadaAtual = (() => {
    if (!rodadas || rodadas.length === 0) return null;
    
    // Filtrar rodadas ativas (aguardando ou em_andamento)
    const rodadasAtivas = rodadas.filter(
      r => r.status === 'aguardando' || r.status === 'em_andamento'
    );
    
    if (rodadasAtivas.length === 0) return null;
    if (rodadasAtivas.length === 1) return rodadasAtivas[0];
    
    // Se houver múltiplas, pegar a mais próxima da data atual
    const now = new Date();
    return rodadasAtivas.reduce((closest, current) => {
      const closestDiff = Math.abs(new Date(closest.data_inicio).getTime() - now.getTime());
      const currentDiff = Math.abs(new Date(current.data_inicio).getTime() - now.getTime());
      return currentDiff < closestDiff ? current : closest;
    });
  })();

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoadingMetrics(true);

        // 1. Buscar IDs de administradores
        const userRolesRef = collection(db, "user_roles");
        const adminRolesQuery = query(userRolesRef, where("role", "==", "admin"));
        const adminRolesSnapshot = await getDocs(adminRolesQuery);
        const adminIds = new Set(adminRolesSnapshot.docs.map(doc => doc.id));

        // 2. Buscar total de participantes (excluindo admins)
        const profilesRef = collection(db, "profiles");
        const profilesSnapshot = await getDocs(profilesRef);
        const allUsers = profilesSnapshot.docs
          .filter(doc => !adminIds.has(doc.id)) // Filtrar admins
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as UserPending[];
        setTotalParticipantes(allUsers.length);

        if (rodadaAtual) {
          // 3. Buscar palpites da rodada atual
          const palpitesRef = collection(db, "palpites");
          const palpitesQuery = query(palpitesRef, where("rodada_id", "==", rodadaAtual.id));
          const palpitesSnapshot = await getDocs(palpitesQuery);
          
          // Contar palpites únicos por usuário
          const usuariosComPalpites = new Set(
            palpitesSnapshot.docs.map(doc => doc.data().usuario_id)
          );
          setPalpitesRodadaAtual(usuariosComPalpites.size);

          // 4. Identificar usuários sem palpites na rodada atual (apenas não-admins)
          const usersSemPalpites = allUsers.filter(
            user => !usuariosComPalpites.has(user.id)
          );
          setUsersPendentes(usersSemPalpites);
        } else {
          setPalpitesRodadaAtual(0);
          setUsersPendentes([]);
        }
      } catch (error) {
        console.error("Erro ao buscar métricas:", error);
        toast.error("Erro ao carregar dados do painel");
      } finally {
        setLoadingMetrics(false);
      }
    }

    if (!loadingRodadas && rodadas) {
      fetchMetrics();
    }
  }, [rodadas, loadingRodadas, rodadaAtual?.id]);

  if (loadingRodadas || loadingMetrics) {
    return (
      <Layout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-3xl font-bold">Painel de Controle</h1>
          <p className="text-muted-foreground">
            Olá, {profile?.nome || "Admin"}! Bem-vindo ao painel administrativo.
          </p>
        </div>

        {/* Cards de Métricas */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total de Participantes */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Participantes</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalParticipantes}</div>
              <p className="text-xs text-muted-foreground">
                Usuários cadastrados no sistema
              </p>
            </CardContent>
          </Card>

          {/* Palpites na Rodada Atual */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Palpites na Rodada Atual</CardTitle>
              <FileCheck className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rodadaAtual ? `${palpitesRodadaAtual}/${totalParticipantes}` : "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                {rodadaAtual 
                  ? `Rodada ${rodadaAtual.numero} (${
                      rodadaAtual.status === 'em_andamento' ? 'Em Andamento' :
                      rodadaAtual.status === 'aguardando' ? 'Aguardando' :
                      'Finalizada'
                    })`
                  : "Nenhuma rodada ativa"
                }
              </p>
            </CardContent>
          </Card>

          {/* Status do Sistema */}
          <Card className="shadow-card border-green-500/20 bg-green-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">Operacional</div>
              <p className="text-xs text-muted-foreground">
                Todos os serviços funcionando normalmente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Monitoramento - Pendências */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Pendências da Rodada
                </CardTitle>
                <CardDescription>
                  {rodadaAtual 
                    ? `Usuários que ainda não enviaram palpites para a Rodada ${rodadaAtual.numero} (${
                        rodadaAtual.status === 'em_andamento' ? 'Em Andamento' :
                        rodadaAtual.status === 'aguardando' ? 'Aguardando' :
                        'Finalizada'
                      })`
                    : "Nenhuma rodada ativa no momento"
                  }
                </CardDescription>
              </div>
              {usersPendentes.length > 0 && (
                <Badge variant="destructive" className="text-base">
                  {usersPendentes.length} pendente{usersPendentes.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!rodadaAtual ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mb-3 opacity-50" />
                <p>Não há rodada ativa no momento.</p>
                <p className="text-sm">Crie uma rodada com status "aguardando" ou "em_andamento" para monitorar palpites.</p>
              </div>
            ) : usersPendentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-green-600">
                <FileCheck className="h-12 w-12 mb-3" />
                <p className="font-semibold">Todos os participantes enviaram seus palpites! 🎉</p>
                <p className="text-sm text-muted-foreground">A rodada está completa.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nickname</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersPendentes.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">@{user.nickname}</TableCell>
                        <TableCell>{user.nome}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="border-orange-500 text-orange-500">
                            Pendente
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card className="shadow-card bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesso rápido às funcionalidades administrativas</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button 
              size="lg" 
              className="gap-2"
              onClick={() => navigate("/admin")}
            >
              <Settings className="h-5 w-5" />
              Gerenciar Rodadas e Jogos
            </Button>
            
            {rodadaAtual && (
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2"
                onClick={() => navigate("/palpites")}
              >
                <FileCheck className="h-5 w-5" />
                Visualizar Palpites da Rodada {rodadaAtual.numero}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
