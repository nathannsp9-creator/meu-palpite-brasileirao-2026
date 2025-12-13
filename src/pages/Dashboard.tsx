import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Calendar, Info, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRodadaAtual, useProximosJogos } from "@/hooks/useJogos";
import { useTopRanking } from "@/hooks/useRanking";
import { useMeusPalpites } from "@/hooks/usePalpites";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { profile } = useAuth();
  const { data: rodadaAtual, isLoading: loadingRodada } = useRodadaAtual();
  const { data: proximosJogos, isLoading: loadingJogos } = useProximosJogos(3);
  const { data: topRanking, isLoading: loadingRanking } = useTopRanking(5);
  const { data: meusPalpites } = useMeusPalpites(rodadaAtual?.id);

  const hasRodada = !!rodadaAtual;
  const hasJogos = !!proximosJogos && proximosJogos.length > 0;
  const hasRanking = !!topRanking && topRanking.length > 1;


  const palpitesFeitos = meusPalpites?.length || 0;
  const totalJogos = proximosJogos?.length || 0;

  // Find user position in ranking
  const userPosition = topRanking?.findIndex(r => r.nickname === profile?.nickname);
  const userRankingData = userPosition !== undefined && userPosition >= 0 
    ? topRanking?.[userPosition] 
    : null;

  const formatGameDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "dd/MM HH:mm", { locale: ptBR });
  };
  
  const firstName = profile?.nome?.split(" ")[0];
  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="rounded-lg bg-gradient-brasil p-8 text-center shadow-card">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-primary-foreground" />
          <h1 className="mb-2 text-3xl font-bold text-primary-foreground">
            Bem-vindo{firstName ? `, ${firstName}` : ""}!
          </h1>
          <p className="text-primary-foreground/90">
            Faça seus palpites e dispute o topo do ranking com seus amigos
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card hover:shadow-hover transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sua Posição</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {!hasRanking ? (
                <>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">
                    Ranking ainda não disponível
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{userPosition! + 1}º Lugar</div>
                  <p className="text-xs text-muted-foreground">
                    {userRankingData?.total_pontos} pontos acumulados
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-hover transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próxima Rodada</CardTitle>
              <Calendar className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              {loadingRodada ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : rodadaAtual ? (
                <>
                  <div className="text-2xl font-bold">Rodada {rodadaAtual.numero}</div>
                  <p className="text-xs text-muted-foreground">
                    Status: {rodadaAtual.status.replace("_", " ")}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">
                    Rodadas ainda não liberadas
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-hover transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Palpites</CardTitle>
              <Target className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              {!hasRodada ? (
                <>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">
                    Palpites ainda não liberados
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {palpitesFeitos} / {totalJogos}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    palpites feitos nesta rodada
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Fazer Palpites Card */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Fazer Palpites
              </CardTitle>
              <CardDescription>
                {rodadaAtual 
                  ? `Rodada ${rodadaAtual.numero}` 
                  : "Aguardando próxima rodada"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{palpitesFeitos} de {totalJogos || "?"} jogos</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-brasil transition-all" 
                    style={{ width: totalJogos ? `${(palpitesFeitos / totalJogos) * 100}%` : "0%" }}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={!hasRodada || !hasJogos}
              >
                Fazer Palpites
              </Button>
              {(!hasRodada || !hasJogos) && (
                <p className="text-xs text-muted-foreground text-center">
                  Logo mais você terá os jogos da rodada para palpitar
                </p>
              )}
            </CardContent>
          </Card>

          {/* Ranking Card */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Top 5 Ranking
              </CardTitle>
              <CardDescription>Classificação geral do bolão</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRanking ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : topRanking && topRanking.length > 0 ? (
                <div className="space-y-3">
                  {topRanking.map((user, index) => (
                    <div
                      key={user.user_id}
                      className={`flex items-center justify-between rounded-lg border border-border p-3 transition-smooth hover:bg-muted/50 ${
                        user.nickname === profile?.nickname ? "bg-primary/5 border-primary/20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}º`}
                        </Badge>
                        <span className={user.nickname === profile?.nickname ? "font-bold" : ""}>
                          @{user.nickname}
                        </span>
                      </div>
                      <span className="font-bold text-primary">{user.total_pontos} pts</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum participante ainda
                </p>
              )}
              <Button
                variant="outline"
                className="w-full mt-4"
                disabled={!hasRanking}
              >
                Ver Ranking Completo
              </Button>
            </CardContent>
          </Card>

          {/* Próximos Jogos Card */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-secondary" />
                Próximos Jogos
              </CardTitle>
              <CardDescription>
                {rodadaAtual ? `Rodada ${rodadaAtual.numero}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingJogos ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : proximosJogos && proximosJogos.length > 0 ? (
                <div className="space-y-3">
                  {proximosJogos.map((jogo) => (
                    <div
                      key={jogo.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{jogo.time_casa}</div>
                        <div className="text-sm text-muted-foreground">vs {jogo.time_visitante}</div>
                      </div>
                      <Badge variant="outline">{formatGameDate(jogo.data_jogo)}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum jogo agendado
                </p>
              )}
            </CardContent>
          </Card>

          {/* Regras Card */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-accent" />
                Regras de Pontuação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-win">
                  <span className="text-sm font-medium text-primary-foreground">
                    Acertou resultado + placar
                  </span>
                  <Badge className="bg-primary-foreground text-primary">5 pontos</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
                  <span className="text-sm font-medium">Acertou apenas resultado</span>
                  <Badge variant="secondary">3 pontos</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-loss">
                  <span className="text-sm font-medium text-destructive-foreground">
                    Errou resultado
                  </span>
                  <Badge className="bg-destructive-foreground text-destructive">0 pontos</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Os palpites fecham 1 minuto antes do início de cada jogo.
                Faça seus palpites com antecedência!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
