import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Save, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRodadaAtual, useProximosJogos } from "@/hooks/useJogos";
import { useMeusPalpites } from "@/hooks/usePalpites";
import { useAuth } from "@/contexts/AuthContext";

type Resultado = "casa" | "empate" | "visitante" | null;

interface Palpite {
  jogoId: number;
  resultado: Resultado;
  placarCasa: string;
  placarVisitante: string;
}

export default function Palpites() {
  const { profile } = useAuth();
  const [palpites, setPalpites] = useState<Record<number, Palpite>>({});

  const { data: rodadaAtual, isLoading: loadingRodada } = useRodadaAtual();
  const { data: proximosJogos, isLoading: loadingJogos } = useProximosJogos();
  const { data: meusPalpites } = useMeusPalpites(rodadaAtual?.id);

  const jogos = proximosJogos || [];
  const rodada = rodadaAtual || null;

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

  const jogosDisponiveis = jogos && jogos.length > 0;

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
            {rodada ? `Fecha em: ${new Date(rodada.data_fechamento || rodada.dataFechamento || "").toLocaleString()}` : "Aguardando rodada"}
          </Badge>
        </div>

        {/* Progress Card */}
        <Card className="shadow-card bg-gradient-brasil">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-primary-foreground">
                <span className="font-medium">Progresso dos Palpites</span>
                <span className="font-bold">{getPalpitosCompletos()} / {jogos.length || 0}</span>
              </div>
              <div className="h-3 rounded-full bg-primary-foreground/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-foreground transition-smooth"
                  style={{ width: jogos.length ? `${(getPalpitosCompletos() / jogos.length) * 100}%` : "0%" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert Info */}
        {(!jogosDisponiveis) ? (
          <Card className="border-secondary bg-secondary/10">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertCircle className="h-5 w-5 text-secondary-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-secondary-foreground">
                Logo mais você terá os jogos da rodada para palpitar
              </p>
            </CardContent>
          </Card>
        ) : (
          getPalpitosCompletos() < jogos.length && (
            <Card className="border-secondary bg-secondary/10">
              <CardContent className="flex items-start gap-3 pt-6">
                <AlertCircle className="h-5 w-5 text-secondary-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-secondary-foreground">
                  Para cada jogo, selecione o resultado (vitória do mandante, empate ou vitória do visitante)
                  e informe o placar que você acredita.
                </p>
              </CardContent>
            </Card>
          )
        )}

        {/* Lista de Jogos */}
        <div className="space-y-4">
          {loadingJogos || loadingRodada ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : jogosDisponiveis ? (
            jogos.map((jogo: any) => {
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
                      <div className="text-2xl mb-1">{jogo.escudo_casa || jogo.logo_casa || ""}</div>
                      <div className="font-semibold">{jogo.time_casa || jogo.casa}</div>
                      <div className="text-xs text-muted-foreground">Mandante</div>
                    </div>
                    <div className="text-2xl font-bold text-muted-foreground">VS</div>
                    <div className="text-left">
                      <div className="text-2xl mb-1">{jogo.escudo_visitante || jogo.logo_visitante || ""}</div>
                      <div className="font-semibold">{jogo.time_visitante || jogo.visitante}</div>
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
                        disabled={!jogosDisponiveis}
                      >
                        Vitória { (jogo.time_casa || jogo.casa || "").split(" ")[0] }
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
                        disabled={!jogosDisponiveis}
                      >
                        Vitória { (jogo.time_visitante || jogo.visitante || "").split(" ")[0] }
                      </Button>
                    </div>
                  </div>

                  {/* Placar */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Placar:</label>
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-medium">{(jogo.time_casa || jogo.casa || "").split(" ")[0]}</span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="\d*"
                          maxLength={2}
                          placeholder="0"
                          className="w-16 text-center text-lg font-bold"
                          value={palpite?.placarCasa || ""}
                          onChange={(e) => handlePlacarChange(jogo.id, "placarCasa", e.target.value)}
                          disabled={!jogosDisponiveis}
                        />
                      </div>
                      <span className="text-2xl font-bold text-muted-foreground mt-6">X</span>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-medium">{(jogo.time_visitante || jogo.visitante || "").split(" ")[0]}</span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="\d*"
                          maxLength={2}
                          placeholder="0"
                          className="w-16 text-center text-lg font-bold"
                          value={palpite?.placarVisitante || ""}
                          onChange={(e) => handlePlacarChange(jogo.id, "placarVisitante", e.target.value)}
                          disabled={!jogosDisponiveis}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum jogo disponível no momento</p>
          )}
        </div>

        {/* Botão Salvar */}
        <Card className="shadow-card sticky bottom-24 md:bottom-8">
          <CardContent className="pt-6">
            <Button
              onClick={handleSalvar}
              size="lg"
              className="w-full"
              disabled={!jogosDisponiveis || getPalpitosCompletos() === 0}
            >
              <Save className="mr-2 h-5 w-5" />
              Salvar Todos os Palpites ({getPalpitosCompletos()}/{jogos.length || 0})
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
