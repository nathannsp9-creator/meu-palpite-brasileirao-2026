import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Save, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRodadaAtual, useProximosJogos } from "@/hooks/useJogosFirebase";
import { useMeusPalpites, useSalvarPalpitesBatch } from "@/hooks/usePalpitesFirebase";
import { useAuth } from "@/contexts/AuthContextFirebase";
import { URL_ESCUDOS } from "@/constants/urls";

interface PalpiteLocal {
  jogoId: string;
  placarCasa: string;
  placarVisitante: string;
}

// Função helper para inferir o resultado automaticamente
const inferirResultado = (placarCasa?: string, placarVisitante?: string): "casa" | "empate" | "visitante" | null => {
  if (!placarCasa || !placarVisitante) return null;
  
  const casa = parseInt(placarCasa);
  const visitante = parseInt(placarVisitante);
  
  if (isNaN(casa) || isNaN(visitante)) return null;
  
  if (casa > visitante) return "casa";
  if (casa < visitante) return "visitante";
  return "empate";
};

// Função helper para validar se o palpite está completo
const isPalpiteCompleto = (palpite?: PalpiteLocal): boolean => {
  if (!palpite) return false;
  
  return !!(
    palpite.placarCasa && 
    palpite.placarVisitante && 
    inferirResultado(palpite.placarCasa, palpite.placarVisitante)
  );
};

export default function Palpites() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [palpites, setPalpites] = useState<Record<string, PalpiteLocal>>({});

  const { data: rodadaAtual, isLoading: loadingRodada } = useRodadaAtual();
  const { data: proximosJogos, isLoading: loadingJogos } = useProximosJogos();
  const { data: meusPalpites } = useMeusPalpites(rodadaAtual?.id);
  const salvarPalpitesBatch = useSalvarPalpitesBatch();

  const jogos = proximosJogos || [];
  const rodada = rodadaAtual || null;
  const isExpired = rodada?.data_fechamento ? new Date() > new Date(rodada.data_fechamento) : false;

  // Carregar palpites salvos anteriormente
  useEffect(() => {
    if (meusPalpites && meusPalpites.length > 0) {
      const palpitesMap: Record<string, PalpiteLocal> = {};
      
      meusPalpites.forEach((palpite) => {
        palpitesMap[palpite.jogo_id] = {
          jogoId: palpite.jogo_id,
          placarCasa: palpite.palpite_casa?.toString() || "",
          placarVisitante: palpite.palpite_visitante?.toString() || "",
        };
      });
      
      setPalpites(palpitesMap);
    }
  }, [meusPalpites]);

  const handlePlacarChange = (jogoId: string, campo: "placarCasa" | "placarVisitante", valor: string) => {
    // Aceita apenas números e vazio
    if (valor && !/^\d+$/.test(valor)) return;
    
    // Limita a 2 dígitos
    if (valor.length > 2) return;
    
    setPalpites((prev) => ({
      ...prev,
      [jogoId]: {
        jogoId,
        placarCasa: campo === "placarCasa" ? valor : prev[jogoId]?.placarCasa || "",
        placarVisitante: campo === "placarVisitante" ? valor : prev[jogoId]?.placarVisitante || "",
      },
    }));
  };

  const handleSalvar = async () => {
    if (isExpired) {
      toast.error("Palpites encerrados para esta rodada");
      return;
    }

    if (!rodada) {
      toast.error("Rodada não encontrada");
      return;
    }

    // Filtrar apenas palpites completos
    const palpitosCompletos = Object.values(palpites).filter(isPalpiteCompleto);

    if (palpitosCompletos.length === 0) {
      toast.error("Você precisa fazer pelo menos um palpite completo!");
      return;
    }

    // Preparar dados para envio
    const palpitesParaSalvar = palpitosCompletos.map((p) => ({
      jogoId: p.jogoId,
      palpiteCasa: parseInt(p.placarCasa),
      palpiteVisitante: parseInt(p.placarVisitante),
    }));

    try {
      await salvarPalpitesBatch.mutateAsync({
        rodadaId: rodada.id,
        palpites: palpitesParaSalvar,
      });
      
      toast.success(`✅ ${palpitosCompletos.length} palpite(s) salvo(s) com sucesso!`, {
        duration: 4000,
      });
      
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error: any) {
      console.error("Erro ao salvar palpites:", error);
      toast.error(error?.message || "Erro ao salvar palpites");
    }
  };

  const getPalpitosCompletos = () => {
    return Object.values(palpites).filter(isPalpiteCompleto).length;
  };

  const jogosDisponiveis = jogos && jogos.length > 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Fazer Palpites</h1>
            <p className="text-muted-foreground">Rodada {rodada?.numero ?? "-"} - Brasileirão Série A</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {rodada
                ? `Fecha em: ${new Date(rodada.data_fechamento || rodada.dataFechamento || "").toLocaleString()}`
                : "Aguardando rodada"}
            </Badge>
            {isExpired && (
              <Badge variant="destructive">Palpites encerrados</Badge>
            )}
          </div>
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

        {isExpired && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="flex items-start gap-3 pt-6 text-destructive-foreground">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Palpites Encerrados</p>
                <p className="text-sm">O prazo para enviar palpites desta rodada acabou.</p>
              </div>
            </CardContent>
          </Card>
        )}

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
          getPalpitosCompletos() < jogos.length && !isExpired && (
            <Card className="border-secondary bg-secondary/10">
              <CardContent className="flex items-start gap-3 pt-6">
                <AlertCircle className="h-5 w-5 text-secondary-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-secondary-foreground">
                  <strong>Dica:</strong> Digite apenas os placares que você acredita. 
                  O sistema detectará automaticamente se é vitória, empate ou derrota!
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
              const isCompleto = isPalpiteCompleto(palpite);
              const resultadoInferido = inferirResultado(palpite?.placarCasa, palpite?.placarVisitante);

              return (
                <Card key={jogo.id} className={`shadow-card transition-smooth ${isCompleto ? "border-primary bg-primary/5" : ""}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(jogo.data_jogo).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </CardDescription>
                      {isCompleto && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completo
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Times */}
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                      {/* Time Casa */}
                      <div className="text-right space-y-2">
                        {jogo.logo_casa ? (
                          <img
                            src={`${URL_ESCUDOS}${jogo.logo_casa}`}
                            alt={`Escudo ${jogo.time_casa}`}
                            className="mx-auto mb-1 h-12 w-12 object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-2xl mb-1">🏠</div>
                        )}
                        <div className="font-semibold text-sm">{jogo.time_casa}</div>
                        <div className="text-xs text-muted-foreground">Mandante</div>
                      </div>

                      <div className="text-2xl font-bold text-muted-foreground">VS</div>

                      {/* Time Visitante */}
                      <div className="text-left space-y-2">
                        {jogo.logo_visitante ? (
                          <img
                            src={`${URL_ESCUDOS}${jogo.logo_visitante}`}
                            alt={`Escudo ${jogo.time_visitante}`}
                            className="mx-auto mb-1 h-12 w-12 object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-2xl mb-1">✈️</div>
                        )}
                        <div className="font-semibold text-sm">{jogo.time_visitante}</div>
                        <div className="text-xs text-muted-foreground">Visitante</div>
                      </div>
                    </div>

                    {/* Placar - ÚNICO CONTROLE NECESSÁRIO */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium block text-center">
                        Digite o placar que você acredita:
                      </label>
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {(jogo.time_casa || "Casa").split(" ")[0]}
                          </span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            maxLength={2}
                            placeholder="0"
                            className="w-20 h-16 text-center text-2xl font-bold"
                            value={palpite?.placarCasa || ""}
                            onChange={(e) => handlePlacarChange(jogo.id, "placarCasa", e.target.value)}
                            disabled={!jogosDisponiveis || isExpired}
                          />
                        </div>
                        
                        <span className="text-3xl font-bold text-muted-foreground mt-6">×</span>
                        
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {(jogo.time_visitante || "Visitante").split(" ")[0]}
                          </span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            maxLength={2}
                            placeholder="0"
                            className="w-20 h-16 text-center text-2xl font-bold"
                            value={palpite?.placarVisitante || ""}
                            onChange={(e) => handlePlacarChange(jogo.id, "placarVisitante", e.target.value)}
                            disabled={!jogosDisponiveis || isExpired}
                          />
                        </div>
                      </div>

                      {/* Feedback Visual do Resultado Inferido */}
                      {resultadoInferido && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <Badge 
                            variant={resultadoInferido === "empate" ? "secondary" : "default"}
                            className="text-xs"
                          >
                            {resultadoInferido === "casa" && `✓ Vitória ${jogo.time_casa.split(" ")[0]}`}
                            {resultadoInferido === "visitante" && `✓ Vitória ${jogo.time_visitante.split(" ")[0]}`}
                            {resultadoInferido === "empate" && "✓ Empate"}
                          </Badge>
                        </div>
                      )}
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
              disabled={isExpired || !jogosDisponiveis || getPalpitosCompletos() === 0 || salvarPalpitesBatch.isPending}
            >
              {salvarPalpitesBatch.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Salvar Todos os Palpites ({getPalpitosCompletos()}/{jogos.length || 0})
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
