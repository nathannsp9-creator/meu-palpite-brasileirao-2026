import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useRodadas, useJogosPorRodada } from "@/hooks/useJogosFirebase";
import { usePalpitesDoJogo } from "@/hooks/usePalpitesFirebase";
import { useAuth } from "@/contexts/AuthContextFirebase";
import { URL_ESCUDOS } from "@/constants/urls";

type Step = "rodada" | "jogo" | "palpites";

interface PalpitesTransparenciaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PalpitesTransparencia({ open, onOpenChange }: PalpitesTransparenciaProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("rodada");
  const [rodadaSelecionadaId, setRodadaSelecionadaId] = useState<string | null>(null);
  const [jogoSelecionadoId, setJogoSelecionadoId] = useState<string | null>(null);

  const { data: todasRodadas, isLoading: loadingRodadas } = useRodadas();
  const { data: jogosDaRodada, isLoading: loadingJogos } = useJogosPorRodada(rodadaSelecionadaId || undefined);
  const { data: palpitesDoJogo, isLoading: loadingPalpites } = usePalpitesDoJogo(jogoSelecionadoId || undefined);

  const rodadaSelecionada = todasRodadas?.find(r => r.id === rodadaSelecionadaId);
  const jogoSelecionado = jogosDaRodada?.find(j => j.id === jogoSelecionadoId);

  const handleSelectRodada = (rodadaId: string) => {
    setRodadaSelecionadaId(rodadaId);
    setJogoSelecionadoId(null);
    setStep("jogo");
  };

  const handleSelectJogo = (jogoId: string) => {
    setJogoSelecionadoId(jogoId);
    setStep("palpites");
  };

  const handleBack = () => {
    if (step === "jogo") {
      setRodadaSelecionadaId(null);
      setJogoSelecionadoId(null);
      setStep("rodada");
    } else if (step === "palpites") {
      setJogoSelecionadoId(null);
      setStep("jogo");
    }
  };

  const handleClose = () => {
    setStep("rodada");
    setRodadaSelecionadaId(null);
    setJogoSelecionadoId(null);
    onOpenChange(false);
  };

  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Ver Palpites da Galera
          </DialogTitle>
          <DialogDescription>
            {step === "rodada" && "Selecione uma rodada para ver os palpites"}
            {step === "jogo" && "Escolha o jogo que deseja analisar"}
            {step === "palpites" && `Veja os palpites de todos para este jogo`}
          </DialogDescription>
        </DialogHeader>

        {/* PASSO 1: Seleção de Rodada */}
        {step === "rodada" && (
          <div className="space-y-4">
            {loadingRodadas ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : todasRodadas && todasRodadas.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {todasRodadas.map(rodada => (
                    <Card
                      key={rodada.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectRodada(rodada.id)}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Rodada {rodada.numero}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(rodada.data_inicio).toLocaleDateString("pt-BR")} a{" "}
                              {new Date(rodada.data_fechamento).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <Badge variant="outline">{rodada.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhuma rodada disponível</p>
            )}
          </div>
        )}

        {/* PASSO 2: Seleção de Jogo */}
        {step === "jogo" && (
          <div className="space-y-4">
            {loadingJogos ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : jogosDaRodada && jogosDaRodada.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {jogosDaRodada.map(jogo => (
                    <Card
                      key={jogo.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectJogo(jogo.id)}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center justify-center gap-4">
                          {/* Time Casa */}
                          <div className="flex flex-col items-center gap-2 text-center flex-1">
                            {jogo.logo_casa ? (
                              <img
                                src={`${URL_ESCUDOS}${jogo.logo_casa}`}
                                alt={jogo.time_casa}
                                className="h-8 w-8 object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <div className="text-2xl">🏠</div>
                            )}
                            <p className="text-sm font-medium">{jogo.time_casa}</p>
                          </div>

                          {/* Score ou VS */}
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">
                              {new Date(jogo.data_jogo).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {jogo.status === "finalizado" && jogo.placar_casa !== null ? (
                              <p className="text-lg font-bold">
                                {jogo.placar_casa} × {jogo.placar_visitante}
                              </p>
                            ) : (
                              <p className="text-lg font-bold text-muted-foreground">VS</p>
                            )}
                          </div>

                          {/* Time Visitante */}
                          <div className="flex flex-col items-center gap-2 text-center flex-1">
                            {jogo.logo_visitante ? (
                              <img
                                src={`${URL_ESCUDOS}${jogo.logo_visitante}`}
                                alt={jogo.time_visitante}
                                className="h-8 w-8 object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <div className="text-2xl">✈️</div>
                            )}
                            <p className="text-sm font-medium">{jogo.time_visitante}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum jogo disponível</p>
            )}
          </div>
        )}

        {/* PASSO 3: Lista de Palpites */}
        {step === "palpites" && (
          <div className="space-y-4">
            {jogoSelecionado && (
              <Card className="bg-muted">
                <CardContent className="py-4">
                  <div className="flex items-center justify-center gap-4">
                    {/* Time Casa */}
                    <div className="flex flex-col items-center gap-2 text-center flex-1">
                      {jogoSelecionado.logo_casa ? (
                        <img
                          src={`${URL_ESCUDOS}${jogoSelecionado.logo_casa}`}
                          alt={jogoSelecionado.time_casa}
                          className="h-10 w-10 object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-3xl">🏠</div>
                      )}
                      <p className="text-sm font-medium">{jogoSelecionado.time_casa}</p>
                    </div>

                    {/* Score ou VS */}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        {new Date(jogoSelecionado.data_jogo).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {jogoSelecionado.status === "finalizado" && jogoSelecionado.placar_casa !== null ? (
                        <p className="text-2xl font-bold">
                          {jogoSelecionado.placar_casa} × {jogoSelecionado.placar_visitante}
                        </p>
                      ) : (
                        <p className="text-2xl font-bold text-muted-foreground">VS</p>
                      )}
                    </div>

                    {/* Time Visitante */}
                    <div className="flex flex-col items-center gap-2 text-center flex-1">
                      {jogoSelecionado.logo_visitante ? (
                        <img
                          src={`${URL_ESCUDOS}${jogoSelecionado.logo_visitante}`}
                          alt={jogoSelecionado.time_visitante}
                          className="h-10 w-10 object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-3xl">✈️</div>
                      )}
                      <p className="text-sm font-medium">{jogoSelecionado.time_visitante}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {loadingPalpites ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : palpitesDoJogo && palpitesDoJogo.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {palpitesDoJogo.map(palpite => {
                    const isUsersPalpite = palpite.usuario_id === user?.uid;
                    return (
                      <Card
                        key={palpite.id}
                        className={`transition-colors ${isUsersPalpite ? "border-primary bg-primary/10" : ""}`}
                      >
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarFallback>{getInitials(palpite.nome)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm truncate">{palpite.nome}</p>
                                  {isUsersPalpite && (
                                    <Badge variant="default" className="text-xs flex-shrink-0">
                                      Seu palpite
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">@{palpite.nickname}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xl font-bold">
                                {palpite.palpite_casa} × {palpite.palpite_visitante}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum palpite para este jogo</p>
            )}
          </div>
        )}

        {/* Footer com botões de navegação */}
        <div className="flex justify-between gap-2 mt-6 pt-4 border-t">
          {step !== "rodada" && (
            <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
          <div className="flex-1" />
          <Button onClick={handleClose} variant="ghost">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
