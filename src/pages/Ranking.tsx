import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, TrendingUp, Target, Loader2, Award, Sword, CheckCircle2 } from "lucide-react";
import { useRankingCompleto } from "@/hooks/useRankingFirebase";
import { useRodadas } from "@/hooks/useJogosFirebase";
import { useAuth } from "@/contexts/AuthContextFirebase";
import { RankingHistory } from "@/components/RankingHistory";
import { RankingEvolutionChart } from "@/components/ranking/RankingEvolutionChart";
import { ComparisonModal } from "@/components/ranking/ComparisonModal";

export default function Ranking() {
  const { profile } = useAuth();
  const [rodadaFiltro, setRodadaFiltro] = useState<string>("todas");
  const [selectedUser, setSelectedUser] = useState<{ userId: string; nickname: string } | null>(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisonUsers, setComparisonUsers] = useState<{ current: any; target: any } | null>(null);
  
  const { data: rodadas } = useRodadas();
  const { data: ranking, isLoading } = useRankingCompleto(
    rodadaFiltro === "todas" ? undefined : rodadaFiltro
  );

  const userIndex = ranking?.findIndex((r) => r.nickname === profile?.nickname) ?? -1;
  const userEntry = userIndex >= 0 && ranking ? ranking[userIndex] : null;
  
  const totalAcertos = userEntry?.acertos_resultado || 0;
  const taxaAcerto = userEntry?.total_palpites
    ? Math.round((totalAcertos / userEntry.total_palpites) * 100)
    : null;

  const getMedalColor = (posicao: number) => {
    if (posicao === 1) return "bg-gradient-to-br from-yellow-400 to-yellow-600";
    if (posicao === 2) return "bg-gradient-to-br from-gray-300 to-gray-500";
    if (posicao === 3) return "bg-gradient-to-br from-orange-400 to-orange-600";
    return "bg-muted";
  };

  const handleCompareClick = (targetUser: any) => {
    if (profile?.nickname === targetUser.nickname) {
      return; // Não permite comparar consigo mesmo
    }

    const currentUserData = userEntry ? {
      user_id: profile?.id || "",
      nickname: profile?.nickname || "",
      total_pontos: userEntry.total_pontos,
      acertos_resultado: userEntry.acertos_resultado,
      acertos_placar: userEntry.acertos_placar,
      total_palpites: userEntry.total_palpites,
    } : null;

    const targetUserData = {
      user_id: targetUser.user_id,
      nickname: targetUser.nickname,
      total_pontos: targetUser.total_pontos,
      acertos_resultado: targetUser.acertos_resultado,
      acertos_placar: targetUser.acertos_placar,
      total_palpites: targetUser.total_palpites,
    };

    console.log("Comparação clicada:", { currentUserData, targetUserData });

    if (currentUserData && targetUserData) {
      setComparisonUsers({ current: currentUserData, target: targetUserData });
      setComparisonOpen(true);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Ranking Geral</h1>
            <p className="text-muted-foreground">Classificação atual do bolão</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtrar por:</span>
            <Select value={rodadaFiltro} onValueChange={setRodadaFiltro}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas as rodadas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as rodadas</SelectItem>
                {rodadas?.map((rodada) => (
                  <SelectItem key={rodada.id} value={rodada.id}>
                    Rodada {rodada.numero}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sua Posição</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userIndex >= 0 ? `${userIndex + 1}º Lugar` : "-"}</div>
              <p className="text-xs text-muted-foreground">
                {userIndex >= 0 ? "Você está no ranking" : "Participe para entrar no ranking"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pontos</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userEntry ? `${userEntry.total_pontos} pts` : "-"}</div>
              <p className="text-xs text-muted-foreground">
                {userEntry ? `${userEntry.total_palpites} palpites realizados` : "Ainda sem pontuação"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
              <Target className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taxaAcerto !== null ? `${taxaAcerto}%` : "-"}</div>
              <p className="text-xs text-muted-foreground">
                {userEntry
                  ? `🎯 ${userEntry.acertos_resultado} acertos • 🏆 ${userEntry.acertos_placar} cravadas`
                  : "Faça palpites para gerar estatísticas"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ranking Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Classificação Completa</CardTitle>
            <CardDescription>
              Acompanhe o desempenho de todos os participantes • Clique em um usuário para ver histórico
              {rodadaFiltro !== "todas" && ` - Rodada ${rodadas?.find(r => r.id === rodadaFiltro)?.numero}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Header da tabela - apenas desktop */}
              <div className="hidden md:grid md:grid-cols-[80px_1fr_100px_100px_100px_100px_130px] gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
                <div>Posição</div>
                <div>Participante</div>
                <div className="text-right">Pontos</div>
                <div className="text-right">Acertos</div>
                <div className="text-right">Resultados</div>
                <div className="text-right">Cravadas</div>
                <div className="text-center">Ações</div>
              </div>

              {/* Linhas do ranking */}
              {isLoading ? (
                <div className="flex justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : !ranking || ranking.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">Ainda não há participantes no ranking.</p>
              ) : (
                ranking.map((user, index) => (
                  <div
                    key={user.user_id}
                    className={`grid grid-cols-[44px_1fr_70px_44px] md:grid-cols-[80px_1fr_100px_100px_100px_100px_130px] gap-2 md:gap-4 items-center rounded-lg border p-3 md:p-4 transition-smooth ${
                      user.nickname === profile?.nickname
                        ? "border-primary bg-primary/5 shadow-hover"
                        : "border-border hover:bg-muted/50 hover:shadow-md"
                    }`}
                    onClick={() => setSelectedUser({ userId: user.user_id, nickname: user.nickname })}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedUser({ userId: user.user_id, nickname: user.nickname });
                      }
                    }}
                  >
                    {/* Posição */}
                    <div className="flex items-center justify-center">
                      <div
                        className={`flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full ${getMedalColor(
                          index + 1
                        )} text-white font-bold shadow-sm text-xs md:text-base`}
                      >
                        {index < 3 ? <Trophy className="h-4 w-4 md:h-5 md:w-5" /> : index + 1}
                      </div>
                    </div>

                    {/* Nome */}
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className={`font-semibold text-sm md:text-base truncate ${user.nickname === profile?.nickname ? "text-primary" : ""}`}>
                          @{user.nickname}
                        </div>
                        {/* Stats mobile */}
                        <div className="md:hidden text-xs text-muted-foreground">
                          🎯 {user.acertos_resultado} • 🏆 {user.acertos_placar}
                        </div>
                      </div>
                    </div>

                    {/* Pontos */}
                    <div className="flex justify-end">
                      <Badge
                        variant={index < 3 ? "default" : "secondary"}
                        className="font-bold text-sm md:text-base px-2 md:px-3 py-0.5 md:py-1"
                      >
                        {user.total_pontos}
                      </Badge>
                    </div>

                    {/* Botão Comparar - Mobile */}
                    <div className="md:hidden flex justify-center">
                      {user.nickname !== profile?.nickname ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompareClick(user);
                          }}
                          className="h-11 w-11 p-0 shrink-0"
                          title="Comparar"
                        >
                          <Sword className="h-5 w-5" />
                        </Button>
                      ) : (
                        <div className="h-11 w-11" /> // Espaço vazio para manter alinhamento
                      )}
                    </div>

                    {/* Acertos (Total: 3pts + 5pts) - apenas desktop */}
                    <div className="hidden md:flex justify-end">
                      <Badge variant="outline" className="gap-1">
                        <Target className="h-3 w-3" />
                        {user.acertos_resultado}
                      </Badge>
                    </div>

                    {/* Resultados (apenas 3pts) - apenas desktop */}
                    <div className="hidden md:flex justify-end">
                      <Badge variant="outline" className="gap-1">
                        <Target className="h-3 w-3" />
                        {Math.max(0, (user.acertos_resultado || 0) - (user.acertos_placar || 0))}
                      </Badge>
                    </div>

                    {/* Cravadas (apenas 5pts) - apenas desktop */}
                    <div className="hidden md:flex justify-end">
                      <Badge variant="outline" className="gap-1">
                        <Award className="h-3 w-3 text-yellow-500" />
                        {user.acertos_placar}
                      </Badge>
                    </div>

                    {/* Botão Comparar - Desktop */}
                    <div className="hidden md:flex justify-center">
                      {user.nickname !== profile?.nickname ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompareClick(user);
                          }}
                          className="gap-2"
                          title="Comparar"
                        >
                          <Sword className="h-4 w-4" />
                          Comparar
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Evolução do Ranking */}
        <RankingEvolutionChart />

        <Card className="shadow-card bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span><strong>Acertos:</strong> Contabiliza resultados corretos e cravadas (soma de 3pts + 5pts)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <span><strong>Resultados (3pts):</strong> Acertou apenas vencedor/empate</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                <span><strong>Cravadas (5pts):</strong> Acertou placar exato</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedUser && (
        <RankingHistory
          userId={selectedUser.userId}
          nickname={selectedUser.nickname}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      <ComparisonModal
        isOpen={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        currentUser={comparisonUsers?.current || null}
        targetUser={comparisonUsers?.target || null}
      />
    </Layout>
  );
}
