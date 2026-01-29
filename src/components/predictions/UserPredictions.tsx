import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PalpitesTransparencia } from "@/components/PalpitesTransparencia";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Save, AlertCircle, Loader2, CheckCircle2, Trophy, Target, History, Eye, Dices, Gift } from "lucide-react";
import { toast } from "sonner";
import { useRodadaAtual, useRodadas, useJogosPorRodada, calcularPontos } from "@/hooks/useJogosFirebase";
import { useMeusPalpites, useSalvarPalpitesBatch } from "@/hooks/usePalpitesFirebase";
import { useAuth } from "@/contexts/AuthContextFirebase";
import { URL_ESCUDOS } from "@/constants/urls";

interface PalpiteLocal {
  jogoId: string;
  placarCasa: string;
  placarVisitante: string;
}

// Função para gerar placares aleatórios realistas com ponderação
const generateRandomScoresWeighted = (): { home: number; away: number } => {
  // Array com placares comuns repetidos para dar peso a resultados mais realistas
  const scorePool = [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 4];
  const randomHome = scorePool[Math.floor(Math.random() * scorePool.length)];
  const randomAway = scorePool[Math.floor(Math.random() * scorePool.length)];
  return { home: randomHome, away: randomAway };
};

// Função para gerar palpites aleatórios para todos os jogos
const generateRandomGuessesForAllGames = (
  games: any[]
): { [gameId: string]: { home: number; away: number } } => {
  const guesses: { [gameId: string]: { home: number; away: number } } = {};
  games.forEach((game) => {
    guesses[game.id] = generateRandomScoresWeighted();
  });
  return guesses;
};

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

export default function UserPredictions() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [palpites, setPalpites] = useState<Record<string, PalpiteLocal>>({});
  const [rodadaSelecionadaId, setRodadaSelecionadaId] = useState<string | null>(null);
  const [transparenciaOpen, setTransparenciaOpen] = useState(false);
  const [isSurpresinhaOpen, setIsSurpresinhaOpen] = useState(false);
  const [randomGuesses, setRandomGuesses] = useState<{ [gameId: string]: { home: number; away: number } } | null>(null);

  const { data: rodadaAtual, isLoading: loadingRodada } = useRodadaAtual();
  const { data: todasRodadas, isLoading: loadingTodasRodadas } = useRodadas();
  const { data: jogosDaRodada, isLoading: loadingJogosDaRodada } = useJogosPorRodada(rodadaSelecionadaId || undefined);
  const { data: meusPalpites } = useMeusPalpites(rodadaSelecionadaId || undefined);
  const salvarPalpitesBatch = useSalvarPalpitesBatch();

  // Ao carregar pela primeira vez, seleciona automaticamente a rodada atual
  useEffect(() => {
    if (rodadaAtual && !rodadaSelecionadaId) {
      setRodadaSelecionadaId(rodadaAtual.id);
    }
  }, [rodadaAtual, rodadaSelecionadaId]);

  const rodadaSelecionada = todasRodadas?.find(r => r.id === rodadaSelecionadaId) || null;
  const jogos = jogosDaRodada || [];
  const rodada = rodadaSelecionada || null;
  const isVisualizandoRodadaAtual = !!(rodadaAtual && rodadaSelecionadaId && rodadaSelecionadaId === rodadaAtual.id);
  const isExpired = rodada?.data_fechamento ? new Date() > new Date(rodada.data_fechamento) : false;
  const isRodadaFinalizada = rodada?.status === 'finalizada';
  const isRodadaAguardando = rodada?.status === 'aguardando';
  const isRodadaEmAndamento = rodada?.status === 'em_andamento';
  const podeReceberPalpites = !!(rodada && isVisualizandoRodadaAtual && isRodadaAguardando && !isExpired);

  const isJogoDisponivelParaPalpite = (jogo: any): boolean => {
    if (!rodada) return false;
    
    // Só permite edição se estiver visualizando a rodada atual
    if (!isVisualizandoRodadaAtual) return false;
    
    // 1. Jogo deve pertencer à rodada atual (ISOLAMENTO)
    if (jogo.rodada_id !== rodada.id) return false;
    
    // 2. Rodada deve estar com status "aguardando" (palpites abertos)
    if (!isRodadaAguardando) return false;
    
    // 3. Data de fechamento não pode ter passado
    if (isExpired) return false;
    
    // 4. Jogo não pode estar finalizado
    if (jogo.status === 'finalizado') return false;
    
    return true;
  };

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

  const handleAbrirSurpresinha = () => {
    if (!jogos || jogos.length === 0) {
      toast.error("Nenhum jogo disponível para gerar palpites!");
      return;
    }
    const newGuesses = generateRandomGuessesForAllGames(jogos);
    setRandomGuesses(newGuesses);
    setIsSurpresinhaOpen(true);
  };

  const handleRerollSurpresinha = () => {
    if (!jogos || jogos.length === 0) return;
    const newGuesses = generateRandomGuessesForAllGames(jogos);
    setRandomGuesses(newGuesses);
  };

  const handleAceitarSurpresinha = async () => {
    if (!randomGuesses || !rodada) {
      toast.error("Erro ao processar palpites!");
      return;
    }

    // Converter randomGuesses para o formato de PalpiteLocal
    const newPalpites = { ...palpites };
    Object.entries(randomGuesses).forEach(([gameId, scores]) => {
      newPalpites[gameId] = {
        jogoId: gameId,
        placarCasa: scores.home.toString(),
        placarVisitante: scores.away.toString(),
      };
    });

    // Atualizar estado de palpites
    setPalpites(newPalpites);
    setIsSurpresinhaOpen(false);

    // Tentar salvar automaticamente
    const palpitesParaSalvar = Object.values(newPalpites)
      .filter(isPalpiteCompleto)
      .map((p) => ({
        jogoId: p.jogoId,
        palpiteCasa: parseInt(p.placarCasa),
        palpiteVisitante: parseInt(p.placarVisitante),
      }));

    if (palpitesParaSalvar.length === 0) {
      toast.error("Nenhum palpite válido gerado!");
      return;
    }

    try {
      await salvarPalpitesBatch.mutateAsync({
        rodadaId: rodada.id,
        palpites: palpitesParaSalvar,
      });

      toast.success(
        `🎁 ${palpitesParaSalvar.length} palpite(s) da Surpresinha salvo(s) com sucesso!`,
        { duration: 4000 }
      );

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error: any) {
      console.error("Erro ao salvar palpites da Surpresinha:", error);
      toast.error(error?.message || "Erro ao salvar palpites");
    }
  };

  const getPalpitosCompletos = () => {
    return Object.values(palpites).filter(isPalpiteCompleto).length;
  };

  const calcularEstatisticasRodada = () => {
    let totalPontos = 0;
    let jogosPontuados = 0;
    let cravadas = 0;
    let resultados = 0;

    jogos.forEach((jogo: any) => {
      if (jogo.status === "finalizado" && jogo.placar_casa !== null && jogo.placar_visitante !== null) {
        const palpite = palpites[jogo.id];
        if (palpite?.placarCasa && palpite?.placarVisitante) {
          const pontos = calcularPontos(
            parseInt(palpite.placarCasa),
            parseInt(palpite.placarVisitante),
            jogo.placar_casa,
            jogo.placar_visitante
          );
          
          totalPontos += pontos;
          jogosPontuados++;
          
          if (pontos === 5) cravadas++;
          if (pontos === 3) resultados++;
        }
      }
    });

    const aproveitamento = jogosPontuados > 0 
      ? Math.round((totalPontos / (jogosPontuados * 5)) * 100) 
      : 0;

    return { totalPontos, jogosPontuados, aproveitamento, cravadas, resultados };
  };

  const stats = calcularEstatisticasRodada();
  const jogosDisponiveis = jogos && jogos.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Fazer Palpites</h1>
          <p className="text-muted-foreground">Rodada {rodada?.numero ?? "-"} - Brasileirão Série A</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Botão Ver Palpites da Galera */}
          <Button
            variant="outline"
            onClick={() => setTransparenciaOpen(true)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Eye className="h-4 w-4" />
            Ver Palpites
          </Button>

          {/* Seletor de Rodada */}
          <Select value={rodadaSelecionadaId || ""} onValueChange={setRodadaSelecionadaId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <History className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Selecione a rodada" />
            </SelectTrigger>
            <SelectContent>
              {todasRodadas?.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  Rodada {r.numero} {r.id === rodadaAtual?.id && "(Atual)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={isRodadaEmAndamento ? "default" : isRodadaFinalizada ? "secondary" : "outline"}
              className="flex items-center gap-2"
            >
              {isRodadaFinalizada && "🏁 Finalizada"}
              {isRodadaEmAndamento && "✅ Em Andamento"}
              {isRodadaAguardando && "⏳ Aguardando"}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {rodada?.data_fechamento
                ? new Date(rodada.data_fechamento).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "---"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Resumo de Pontuação da Rodada */}
      {stats.jogosPontuados > 0 && (
        <Card className="shadow-card bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Desempenho nesta Rodada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.totalPontos}</div>
                <div className="text-xs text-muted-foreground">Pontos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">{stats.aproveitamento}%</div>
                <div className="text-xs text-muted-foreground">Aproveitamento</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.cravadas}</div>
                <div className="text-xs text-muted-foreground">Cravadas (5pts)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{stats.resultados}</div>
                <div className="text-xs text-muted-foreground">Resultados (3pts)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Botão Surpresinha */}
      {isVisualizandoRodadaAtual && podeReceberPalpites && (
        <Button
          onClick={handleAbrirSurpresinha}
          className="w-full h-auto py-3 md:py-4 rounded-lg text-base font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg whitespace-normal"
          disabled={!jogosDisponiveis}
        >
          <Gift className="h-5 w-5 mr-2" />
          🎁 Surpresinha! (Gerar Palpites Aleatórios)
        </Button>
      )}

      {/* Alerta de Modo Histórico */}
      {!isVisualizandoRodadaAtual && (
        <Card className="border-blue-500/50 bg-blue-500/10">
          <CardContent className="flex items-start gap-3 pt-6">
            <History className="h-5 w-5 mt-0.5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">📜 Modo Histórico</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Você está visualizando uma rodada passada. Os campos estão em modo leitura.
                {isRodadaFinalizada && " Veja abaixo seus palpites e os pontos obtidos!"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta Rodada Aguardando (apenas se visualizando rodada atual) */}
      {isVisualizandoRodadaAtual && isRodadaAguardando && !isExpired && (
        <Card className="border-primary/50 bg-primary/10">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <p className="text-sm font-medium">⏳ Rodada Aberta para Palpites</p>
              <p className="text-sm text-muted-foreground">Faça seus palpites antes do prazo de fechamento!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isVisualizandoRodadaAtual && isExpired && isRodadaEmAndamento && (
        <Card className="border-destructive/50 bg-destructive/10">
          {/* CORREÇÃO AQUI: Mudei de text-destructive-foreground para text-destructive */}
          <CardContent className="flex items-start gap-3 pt-6 text-destructive">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Palpites Encerrados</p>
              {/* Opcional: O texto descritivo pode ser text-muted-foreground ou manter text-destructive */}
              <p className="text-sm opacity-90">O prazo para enviar palpites desta rodada acabou.</p>
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
          isVisualizandoRodadaAtual && getPalpitosCompletos() < jogos.length && !isExpired && (
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
        {loadingJogosDaRodada || loadingTodasRodadas || loadingRodada ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : jogosDisponiveis ? (
          jogos.map((jogo: any) => {
            const palpite = palpites[jogo.id];
            const isCompleto = isPalpiteCompleto(palpite);
            const resultadoInferido = inferirResultado(palpite?.placarCasa, palpite?.placarVisitante);
            
            const isJogoFinalizado = jogo.status === "finalizado" && jogo.placar_casa !== null && jogo.placar_visitante !== null;
            const jogoDisponivelParaPalpite = isJogoDisponivelParaPalpite(jogo);
            const pertenceRodadaAtual = rodada ? jogo.rodada_id === rodada.id : false;
            
            let pontos = 0;
            let pontosColor = "";
            let pontosLabel = "";
            
            if (isJogoFinalizado && palpite?.placarCasa && palpite?.placarVisitante) {
              pontos = calcularPontos(
                parseInt(palpite.placarCasa),
                parseInt(palpite.placarVisitante),
                jogo.placar_casa,
                jogo.placar_visitante
              );
              
              if (pontos === 5) {
                pontosColor = "bg-green-500 text-white";
                pontosLabel = "🏆 +5 Pontos (Cravada!)";
              } else if (pontos === 3) {
                pontosColor = "bg-yellow-500 text-white";
                pontosLabel = "🎯 +3 Pontos (Resultado)";
              } else {
                pontosColor = "bg-red-500 text-white";
                pontosLabel = "❌ 0 Pontos";
              }
            }

            return (
              <Card key={jogo.id} className={`shadow-card transition-smooth ${isCompleto ? "border-primary bg-primary/5" : ""} ${isJogoFinalizado ? "border-2" : ""} ${!pertenceRodadaAtual ? "opacity-50" : ""}`}>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
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
                    <div className="flex items-center gap-2">
                      {!pertenceRodadaAtual && (
                        <Badge variant="outline" className="text-xs">
                          Rodada {jogo.rodada_numero || '?'}
                        </Badge>
                      )}
                      {isJogoFinalizado && palpite?.placarCasa && palpite?.placarVisitante && (
                        <Badge className={`${pontosColor} font-bold px-3 py-1`}>
                          {pontosLabel}
                        </Badge>
                      )}
                      {isCompleto && !isJogoFinalizado && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completo
                        </Badge>
                      )}
                    </div>
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

                    <div className="text-2xl font-bold text-muted-foreground">
                      {isJogoFinalizado ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm text-muted-foreground">Placar Final</span>
                          <span className="text-3xl">{jogo.placar_casa} × {jogo.placar_visitante}</span>
                        </div>
                      ) : (
                        "VS"
                      )}
                    </div>

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
                      {isJogoFinalizado ? "Seu palpite:" : "Digite o placar que você acredita:"}
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
                          disabled={!jogoDisponivelParaPalpite || !isVisualizandoRodadaAtual}
                          readOnly={!isVisualizandoRodadaAtual}
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
                          disabled={!jogoDisponivelParaPalpite || !isVisualizandoRodadaAtual}
                          readOnly={!isVisualizandoRodadaAtual}
                        />
                      </div>
                    </div>

                    {/* Feedback Visual do Resultado Inferido */}
                    {resultadoInferido && !isJogoFinalizado && (
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

                    {/* Comparação entre palpite e resultado real (Modo Histórico) */}
                    {isJogoFinalizado && !isVisualizandoRodadaAtual && palpite?.placarCasa && palpite?.placarVisitante && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-medium text-center text-muted-foreground mb-2">Resultado Real:</p>
                        <div className="flex items-center justify-center gap-3">
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${
                              parseInt(palpite.placarCasa) === jogo.placar_casa 
                                ? "text-green-600" 
                                : "text-red-600"
                            }`}>
                              {jogo.placar_casa}
                            </div>
                            <div className="text-xs text-muted-foreground">Real</div>
                          </div>
                          <span className="text-xl font-bold text-muted-foreground">×</span>
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${
                              parseInt(palpite.placarVisitante) === jogo.placar_visitante 
                                ? "text-green-600" 
                                : "text-red-600"
                            }`}>
                              {jogo.placar_visitante}
                            </div>
                            <div className="text-xs text-muted-foreground">Real</div>
                          </div>
                        </div>
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

      {/* Botão Salvar - Apenas em modo edição */}
      {isVisualizandoRodadaAtual && (
        <Card className="shadow-card sticky bottom-24 md:bottom-8">
          <CardContent className="pt-6">
            <Button
              onClick={handleSalvar}
              size="lg"
              className="w-full"
              disabled={!podeReceberPalpites || !jogosDisponiveis || getPalpitosCompletos() === 0 || salvarPalpitesBatch.isPending}
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
    )}
    
    {/* Modal Surpresinha */}
    <Dialog open={isSurpresinhaOpen} onOpenChange={setIsSurpresinhaOpen}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Gift className="h-6 w-6 text-purple-600" />
            Surpresinha - Palpites Aleatórios
          </DialogTitle>
        </DialogHeader>

        {randomGuesses ? (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
            {/* Lista de Jogos */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {jogos.map((jogo: any) => {
                const guess = randomGuesses[jogo.id];
                return (
                  <div
                    key={jogo.id}
                    className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-3">
                      {/* Times */}
                      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                        <div className="text-center">
                          {jogo.logo_casa ? (
                            <img
                              src={`${URL_ESCUDOS}${jogo.logo_casa}`}
                              alt={jogo.time_casa}
                              className="h-8 w-8 object-contain mx-auto mb-1"
                              loading="lazy"
                            />
                          ) : (
                            <div className="text-lg">🏠</div>
                          )}
                          <div className="text-xs font-medium truncate">
                            {jogo.time_casa}
                          </div>
                        </div>

                        <div className="text-sm font-bold text-muted-foreground">VS</div>

                        <div className="text-center">
                          {jogo.logo_visitante ? (
                            <img
                              src={`${URL_ESCUDOS}${jogo.logo_visitante}`}
                              alt={jogo.time_visitante}
                              className="h-8 w-8 object-contain mx-auto mb-1"
                              loading="lazy"
                            />
                          ) : (
                            <div className="text-lg">✈️</div>
                          )}
                          <div className="text-xs font-medium truncate">
                            {jogo.time_visitante}
                          </div>
                        </div>
                      </div>

                      {/* Placar Gerado */}
                      {guess && (
                        <div className="flex items-center justify-center gap-3 bg-primary/10 p-2 rounded">
                          <span className="text-xl font-bold">{guess.home}</span>
                          <span className="text-muted-foreground font-semibold">×</span>
                          <span className="text-xl font-bold">{guess.away}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-row gap-3 w-full md:flex-col md:justify-start">
              {/* Botão Reroll */}
              <Button
                onClick={handleRerollSurpresinha}
                variant="outline"
                className="flex-1 md:h-32 flex flex-col items-center justify-center gap-2 hover:bg-accent py-3 md:py-auto"
              >
                <Dices className="h-5 md:h-8 w-5 md:w-8" />
                <span className="text-xs md:text-sm font-semibold">Rolar</span>
                <span className="hidden md:inline text-xs text-muted-foreground">Gerar novos</span>
              </Button>

              {/* Botão Aceitar */}
              <Button
                onClick={handleAceitarSurpresinha}
                className="flex-1 md:h-32 flex flex-col items-center justify-center gap-2 bg-green-600 hover:bg-green-700 py-3 md:py-auto"
                disabled={salvarPalpitesBatch.isPending}
              >
                {salvarPalpitesBatch.isPending ? (
                  <>
                    <Loader2 className="h-5 md:h-6 w-5 md:w-6 animate-spin" />
                    <span className="text-xs md:text-sm">Salvando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 md:h-8 w-5 md:w-8" />
                    <span className="text-xs md:text-sm font-semibold">Aceitar!</span>
                    <span className="hidden md:inline text-xs">Salvar Palpites</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Modal de Transparência */}
    <PalpitesTransparencia open={transparenciaOpen} onOpenChange={setTransparenciaOpen} />
  </div>
  );
}
