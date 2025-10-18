import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Calendar, Info } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  // Mock data
  const userRanking = { posicao: 3, pontos: 42, nome: "Você" };
  const proximaRodada = {
    numero: 15,
    dataFechamento: "2024-05-20T19:00:00",
    jogos: 10,
  };

  const topRanking = [
    { posicao: 1, nome: "João Silva", pontos: 58 },
    { posicao: 2, nome: "Maria Santos", pontos: 51 },
    { posicao: 3, nome: "Você", pontos: 42 },
    { posicao: 4, nome: "Carlos Souza", pontos: 39 },
    { posicao: 5, nome: "Ana Costa", pontos: 35 },
  ];

  const proximosJogos = [
    { id: 1, casa: "Flamengo", visitante: "Palmeiras", data: "20/05 16:00" },
    { id: 2, casa: "São Paulo", visitante: "Corinthians", data: "20/05 18:30" },
    { id: 3, casa: "Grêmio", visitante: "Internacional", data: "20/05 20:00" },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="rounded-lg bg-gradient-brasil p-8 text-center shadow-card">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-primary-foreground" />
          <h1 className="mb-2 text-3xl font-bold text-primary-foreground">
            Bem-vindo ao Bolão!
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
              <div className="text-2xl font-bold">{userRanking.posicao}º Lugar</div>
              <p className="text-xs text-muted-foreground">
                {userRanking.pontos} pontos acumulados
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-hover transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próxima Rodada</CardTitle>
              <Calendar className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rodada {proximaRodada.numero}</div>
              <p className="text-xs text-muted-foreground">
                {proximaRodada.jogos} jogos disponíveis
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-hover transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Palpites</CardTitle>
              <Target className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3 / 10</div>
              <p className="text-xs text-muted-foreground">
                palpites feitos nesta rodada
              </p>
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
                Rodada {proximaRodada.numero} - Fecha em 20/05 às 19:00
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">3 de 10 jogos</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[30%] rounded-full bg-gradient-brasil" />
                </div>
              </div>
              <Link to="/palpites">
                <Button className="w-full" size="lg">
                  Continuar Palpites
                </Button>
              </Link>
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
              <div className="space-y-3">
                {topRanking.map((user) => (
                  <div
                    key={user.posicao}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-smooth hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={user.posicao === 1 ? "default" : "secondary"}>
                        {user.posicao}º
                      </Badge>
                      <span className={user.nome === "Você" ? "font-bold" : ""}>
                        {user.nome}
                      </span>
                    </div>
                    <span className="font-bold text-primary">{user.pontos} pts</span>
                  </div>
                ))}
              </div>
              <Link to="/ranking">
                <Button variant="outline" className="w-full mt-4">
                  Ver Ranking Completo
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Próximos Jogos Card */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-secondary" />
                Próximos Jogos
              </CardTitle>
              <CardDescription>Rodada {proximaRodada.numero}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {proximosJogos.map((jogo) => (
                  <div
                    key={jogo.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{jogo.casa}</div>
                      <div className="text-sm text-muted-foreground">vs {jogo.visitante}</div>
                    </div>
                    <Badge variant="outline">{jogo.data}</Badge>
                  </div>
                ))}
              </div>
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
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
                  <span className="text-sm font-medium">Acertou apenas placar</span>
                  <Badge variant="secondary">2 pontos</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-loss">
                  <span className="text-sm font-medium text-destructive-foreground">
                    Errou tudo
                  </span>
                  <Badge className="bg-destructive-foreground text-destructive">0 pontos</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Os palpites fecham 1 minuto antes do início de cada rodada.
                Faça seus palpites com antecedência!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
