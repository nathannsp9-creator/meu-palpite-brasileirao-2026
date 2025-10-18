import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Resultado = "casa" | "empate" | "visitante" | null;

interface Palpite {
  jogoId: number;
  resultado: Resultado;
  placarCasa: string;
  placarVisitante: string;
}

export default function Palpites() {
  const [palpites, setPalpites] = useState<Record<number, Palpite>>({});

  // Mock data
  const rodada = {
    numero: 15,
    dataFechamento: "20/05/2024 19:00",
  };

  const jogos = [
    { id: 1, casa: "Flamengo", visitante: "Palmeiras", data: "20/05 16:00", escudo_casa: "🔴⚫", escudo_visitante: "🟢⚪" },
    { id: 2, casa: "São Paulo", visitante: "Corinthians", data: "20/05 18:30", escudo_casa: "🔴⚫⚪", escudo_visitante: "⚫⚪" },
    { id: 3, casa: "Grêmio", visitante: "Internacional", data: "20/05 20:00", escudo_casa: "🔵⚫⚪", escudo_visitante: "🔴⚪" },
    { id: 4, casa: "Atlético-MG", visitante: "Cruzeiro", data: "21/05 16:00", escudo_casa: "⚫⚪", escudo_visitante: "🔵⚪" },
    { id: 5, casa: "Botafogo", visitante: "Fluminense", data: "21/05 18:30", escudo_casa: "⚫⚪", escudo_visitante: "🟢🔴⚪" },
    { id: 6, casa: "Santos", visitante: "Vasco", data: "21/05 20:00", escudo_casa: "⚪⚫", escudo_visitante: "⚫⚪" },
    { id: 7, casa: "Bahia", visitante: "Vitória", data: "22/05 16:00", escudo_casa: "🔵⚪🔴", escudo_visitante: "🔴⚫" },
    { id: 8, casa: "Fortaleza", visitante: "Ceará", data: "22/05 18:30", escudo_casa: "🔴🔵⚪", escudo_visitante: "⚫⚪" },
    { id: 9, casa: "Athletico-PR", visitante: "Coritiba", data: "22/05 20:00", escudo_casa: "🔴⚫", escudo_visitante: "🟢⚪" },
    { id: 10, casa: "Bragantino", visitante: "Goiás", data: "23/05 16:00", escudo_casa: "⚪🔴⚫", escudo_visitante: "🟢⚪" },
  ];

  const handleResultadoChange = (jogoId: number, resultado: Resultado) => {
    setPalpites((prev) => ({
      ...prev,
      [jogoId]: {
        ...prev[jogoId],
        jogoId,
        resultado,
        placarCasa: prev[jogoId]?.placarCasa || "",
        placarVisitante: prev[jogoId]?.placarVisitante || "",
      },
    }));
  };

  const handlePlacarChange = (jogoId: number, campo: "placarCasa" | "placarVisitante", valor: string) => {
    // Aceita apenas números
    if (valor && !/^\d+$/.test(valor)) return;
    
    setPalpites((prev) => ({
      ...prev,
      [jogoId]: {
        ...prev[jogoId],
        jogoId,
        resultado: prev[jogoId]?.resultado || null,
        [campo]: valor,
      },
    }));
  };

  const handleSalvar = () => {
    const palpitosCompletos = Object.values(palpites).filter(
      (p) => p.resultado && p.placarCasa && p.placarVisitante
    );

    if (palpitosCompletos.length === 0) {
      toast.error("Você precisa fazer pelo menos um palpite completo!");
      return;
    }

    toast.success(`${palpitosCompletos.length} palpite(s) salvos com sucesso!`);
  };

  const getPalpitosCompletos = () => {
    return Object.values(palpites).filter(
      (p) => p.resultado && p.placarCasa && p.placarVisitante
    ).length;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Fazer Palpites</h1>
            <p className="text-muted-foreground">Rodada {rodada.numero} - Brasileirão Série A</p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Fecha em: {rodada.dataFechamento}
          </Badge>
        </div>

        {/* Progress Card */}
        <Card className="shadow-card bg-gradient-brasil">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-primary-foreground">
                <span className="font-medium">Progresso dos Palpites</span>
                <span className="font-bold">{getPalpitosCompletos()} / {jogos.length}</span>
              </div>
              <div className="h-3 rounded-full bg-primary-foreground/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-foreground transition-smooth"
                  style={{ width: `${(getPalpitosCompletos() / jogos.length) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert Info */}
        {getPalpitosCompletos() < jogos.length && (
          <Card className="border-secondary bg-secondary/10">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertCircle className="h-5 w-5 text-secondary-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-secondary-foreground">
                Para cada jogo, selecione o resultado (vitória do mandante, empate ou vitória do visitante)
                e informe o placar que você acredita.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Lista de Jogos */}
        <div className="space-y-4">
          {jogos.map((jogo) => {
            const palpite = palpites[jogo.id];
            const isCompleto = palpite?.resultado && palpite?.placarCasa && palpite?.placarVisitante;

            return (
              <Card key={jogo.id} className={`shadow-card transition-smooth ${isCompleto ? "border-primary" : ""}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardDescription className="flex items-center gap-2">
                      <span>{jogo.data}</span>
                      {isCompleto && <Badge variant="default">Completo</Badge>}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Times */}
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                    <div className="text-right">
                      <div className="text-2xl mb-1">{jogo.escudo_casa}</div>
                      <div className="font-semibold">{jogo.casa}</div>
                      <div className="text-xs text-muted-foreground">Mandante</div>
                    </div>
                    <div className="text-2xl font-bold text-muted-foreground">VS</div>
                    <div className="text-left">
                      <div className="text-2xl mb-1">{jogo.escudo_visitante}</div>
                      <div className="font-semibold">{jogo.visitante}</div>
                      <div className="text-xs text-muted-foreground">Visitante</div>
                    </div>
                  </div>

                  {/* Seleção de Resultado */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Resultado:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={palpite?.resultado === "casa" ? "default" : "outline"}
                        onClick={() => handleResultadoChange(jogo.id, "casa")}
                        className="w-full"
                      >
                        Vitória {jogo.casa.split(" ")[0]}
                      </Button>
                      <Button
                        variant={palpite?.resultado === "empate" ? "default" : "outline"}
                        onClick={() => handleResultadoChange(jogo.id, "empate")}
                        className="w-full"
                      >
                        Empate
                      </Button>
                      <Button
                        variant={palpite?.resultado === "visitante" ? "default" : "outline"}
                        onClick={() => handleResultadoChange(jogo.id, "visitante")}
                        className="w-full"
                      >
                        Vitória {jogo.visitante.split(" ")[0]}
                      </Button>
                    </div>
                  </div>

                  {/* Placar */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Placar:</label>
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-medium">{jogo.casa.split(" ")[0]}</span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="\d*"
                          maxLength={2}
                          placeholder="0"
                          className="w-16 text-center text-lg font-bold"
                          value={palpite?.placarCasa || ""}
                          onChange={(e) => handlePlacarChange(jogo.id, "placarCasa", e.target.value)}
                        />
                      </div>
                      <span className="text-2xl font-bold text-muted-foreground mt-6">X</span>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-medium">{jogo.visitante.split(" ")[0]}</span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="\d*"
                          maxLength={2}
                          placeholder="0"
                          className="w-16 text-center text-lg font-bold"
                          value={palpite?.placarVisitante || ""}
                          onChange={(e) => handlePlacarChange(jogo.id, "placarVisitante", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Botão Salvar */}
        <Card className="shadow-card sticky bottom-24 md:bottom-8">
          <CardContent className="pt-6">
            <Button
              onClick={handleSalvar}
              size="lg"
              className="w-full"
              disabled={getPalpitosCompletos() === 0}
            >
              <Save className="mr-2 h-5 w-5" />
              Salvar Todos os Palpites ({getPalpitosCompletos()}/{jogos.length})
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
