import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target, Loader2 } from "lucide-react";
import { useRankingCompleto } from "@/hooks/useRankingFirebase";
import { useAuth } from "@/contexts/AuthContextFirebase";

export default function Ranking() {
  const { profile } = useAuth();
  const { data: ranking, isLoading } = useRankingCompleto();

  const userIndex = ranking?.findIndex((r) => r.nickname === profile?.nickname) ?? -1;
  const userEntry = userIndex >= 0 && ranking ? ranking[userIndex] : null;
  const totalAcertos = (userEntry?.acertos_resultado || 0) + (userEntry?.acertos_placar || 0);
  const taxaAcerto = userEntry?.total_palpites
    ? Math.round((totalAcertos / userEntry.total_palpites) * 100)
    : null;

  const getMedalColor = (posicao: number) => {
    if (posicao === 1) return "bg-gradient-to-br from-yellow-400 to-yellow-600";
    if (posicao === 2) return "bg-gradient-to-br from-gray-300 to-gray-500";
    if (posicao === 3) return "bg-gradient-to-br from-orange-400 to-orange-600";
    return "bg-muted";
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Ranking Geral</h1>
          <p className="text-muted-foreground">Classificação atual do bolão</p>
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
                  ? `${userEntry.acertos_resultado} resultados • ${userEntry.acertos_placar} placares`
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
              Acompanhe o desempenho de todos os participantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Header da tabela - apenas desktop */}
              <div className="hidden md:grid md:grid-cols-[80px_1fr_100px_120px_120px] gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
                <div>Posição</div>
                <div>Participante</div>
                <div className="text-right">Pontos</div>
                <div className="text-right">Resultados</div>
                <div className="text-right">Placares</div>
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
                    className={`grid grid-cols-[60px_1fr_80px] md:grid-cols-[80px_1fr_100px_120px_120px] gap-4 items-center rounded-lg border p-4 transition-smooth ${
                      user.nickname === profile?.nickname
                        ? "border-primary bg-primary/5 shadow-hover"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    {/* Posição */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${getMedalColor(
                          index + 1
                        )} text-white font-bold shadow-sm`}
                      >
                        {index < 3 ? <Trophy className="h-5 w-5" /> : index + 1}
                      </div>
                    </div>

                    {/* Nome */}
                    <div className="flex items-center gap-3">
                      <div>
                        <div className={`font-semibold ${user.nickname === profile?.nickname ? "text-primary" : ""}`}>
                          @{user.nickname}
                        </div>
                        {/* Stats mobile */}
                        <div className="md:hidden text-xs text-muted-foreground">
                          {user.acertos_resultado} resultados • {user.acertos_placar} placares
                        </div>
                      </div>
                    </div>

                    {/* Pontos */}
                    <div className="text-right">
                      <Badge
                        variant={index < 3 ? "default" : "secondary"}
                        className="font-bold text-base px-3 py-1"
                      >
                        {user.total_pontos}
                      </Badge>
                    </div>

                    {/* Resultados - apenas desktop */}
                    <div className="hidden md:flex justify-end">
                      <Badge variant="outline" className="gap-1">
                        <Target className="h-3 w-3" />
                        {user.acertos_resultado}
                      </Badge>
                    </div>

                    {/* Placares - apenas desktop */}
                    <div className="hidden md:flex justify-end">
                      <Badge variant="outline" className="gap-1">
                        <Trophy className="h-3 w-3" />
                        {user.acertos_placar}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Legenda */}
        <Card className="shadow-card bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span><strong>Resultados:</strong> Acertos de vitória/empate</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-secondary" />
                <span><strong>Placares:</strong> Acertos de placar exato</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
