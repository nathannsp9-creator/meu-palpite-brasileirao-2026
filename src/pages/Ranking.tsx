import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target } from "lucide-react";

export default function Ranking() {
  // Mock data
  const ranking = [
    { posicao: 1, nome: "João Silva", pontos: 58, acertosResultado: 12, acertosPlacar: 4, avatar: "👨" },
    { posicao: 2, nome: "Maria Santos", pontos: 51, acertosResultado: 11, acertosPlacar: 3, avatar: "👩" },
    { posicao: 3, nome: "Você", pontos: 42, acertosResultado: 9, acertosPlacar: 3, avatar: "🎯", destaque: true },
    { posicao: 4, nome: "Carlos Souza", pontos: 39, acertosResultado: 8, acertosPlacar: 3, avatar: "👨‍💼" },
    { posicao: 5, nome: "Ana Costa", pontos: 35, acertosResultado: 8, acertosPlacar: 1, avatar: "👩‍💼" },
    { posicao: 6, nome: "Pedro Lima", pontos: 33, acertosResultado: 7, acertosPlacar: 2, avatar: "🧑" },
    { posicao: 7, nome: "Julia Oliveira", pontos: 31, acertosResultado: 7, acertosPlacar: 1, avatar: "👧" },
    { posicao: 8, nome: "Roberto Alves", pontos: 28, acertosResultado: 6, acertosPlacar: 2, avatar: "👴" },
    { posicao: 9, nome: "Fernanda Reis", pontos: 26, acertosResultado: 6, acertosPlacar: 1, avatar: "👩‍🦰" },
    { posicao: 10, nome: "Lucas Martins", pontos: 24, acertosResultado: 5, acertosPlacar: 2, avatar: "🧑‍🎓" },
  ];

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
          <p className="text-muted-foreground">Classificação após 14 rodadas</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sua Posição</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3º Lugar</div>
              <p className="text-xs text-muted-foreground">
                16 pontos do líder
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pontos</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42 pontos</div>
              <p className="text-xs text-muted-foreground">
                Média de 3 pontos/rodada
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
              <Target className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">64%</div>
              <p className="text-xs text-muted-foreground">
                9 resultados + 3 placares
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
              {ranking.map((user) => (
                <div
                  key={user.posicao}
                  className={`grid grid-cols-[60px_1fr_80px] md:grid-cols-[80px_1fr_100px_120px_120px] gap-4 items-center rounded-lg border p-4 transition-smooth ${
                    user.destaque
                      ? "border-primary bg-primary/5 shadow-hover"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  {/* Posição */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${getMedalColor(
                        user.posicao
                      )} text-white font-bold shadow-sm`}
                    >
                      {user.posicao <= 3 ? (
                        <Trophy className="h-5 w-5" />
                      ) : (
                        user.posicao
                      )}
                    </div>
                  </div>

                  {/* Nome */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{user.avatar}</span>
                    <div>
                      <div className={`font-semibold ${user.destaque ? "text-primary" : ""}`}>
                        {user.nome}
                      </div>
                      {/* Stats mobile */}
                      <div className="md:hidden text-xs text-muted-foreground">
                        {user.acertosResultado} resultados • {user.acertosPlacar} placares
                      </div>
                    </div>
                  </div>

                  {/* Pontos */}
                  <div className="text-right">
                    <Badge
                      variant={user.posicao <= 3 ? "default" : "secondary"}
                      className="font-bold text-base px-3 py-1"
                    >
                      {user.pontos}
                    </Badge>
                  </div>

                  {/* Resultados - apenas desktop */}
                  <div className="hidden md:flex justify-end">
                    <Badge variant="outline" className="gap-1">
                      <Target className="h-3 w-3" />
                      {user.acertosResultado}
                    </Badge>
                  </div>

                  {/* Placares - apenas desktop */}
                  <div className="hidden md:flex justify-end">
                    <Badge variant="outline" className="gap-1">
                      <Trophy className="h-3 w-3" />
                      {user.acertosPlacar}
                    </Badge>
                  </div>
                </div>
              ))}
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
