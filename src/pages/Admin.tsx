import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Plus, Save, Trash2, Edit3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TIMES } from "@/constants/times";
import { URL_ESCUDOS } from "@/constants/urls";
import {
  useRodadas,
  useCriarRodada,
  useAtualizarRodada,
  useJogosPorRodada,
  useCriarJogo,
  useAtualizarJogo,
  useDeletarJogo,
} from "@/hooks/useJogosFirebase";
import { Jogo } from "@/types/firebase";

const toDateTimeLocal = (date?: Date | null) => {
  if (!date) return "";
  const iso = new Date(date).toISOString();
  return iso.slice(0, 16);
};

const parseDateTimeLocal = (value: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

type NovoJogoForm = {
  mandante: string;
  visitante: string;
};

type JogoEditState = {
  mandante: string;
  visitante: string;
  status: string;
};

type ResultadoEditState = {
  placarCasa: string;
  placarVisitante: string;
};

export default function Admin() {
  const queryClient = useQueryClient();
  const { data: rodadas, isLoading: loadingRodadas } = useRodadas();
  const [selectedRodadaId, setSelectedRodadaId] = useState<string | "new" | null>(null);
  const [rodadaResultadosId, setRodadaResultadosId] = useState<string | null>(null);

  const [rodadaForm, setRodadaForm] = useState({
    numero: "",
    status: "aguardando",
    data_inicio: "",
    data_fechamento: "",
  });

  const [novoJogo, setNovoJogo] = useState<NovoJogoForm>({
    mandante: "",
    visitante: "",
  });

  const [jogoEdits, setJogoEdits] = useState<Record<string, JogoEditState>>({});
  const [resultadoEdits, setResultadoEdits] = useState<Record<string, ResultadoEditState>>({});

  const { data: jogosRodada, isLoading: loadingJogosRodada } = useJogosPorRodada(
    selectedRodadaId && selectedRodadaId !== "new" ? selectedRodadaId : undefined
  );
  const { data: jogosResultados, isLoading: loadingResultados } = useJogosPorRodada(
    rodadaResultadosId || undefined
  );

  const createRodada = useCriarRodada();
  const updateRodada = useAtualizarRodada();
  const createJogo = useCriarJogo();
  const updateJogo = useAtualizarJogo();
  const deleteJogo = useDeletarJogo();

  const selectedRodada = useMemo(
    () => rodadas?.find((r) => r.id === selectedRodadaId) || null,
    [rodadas, selectedRodadaId]
  );

  useEffect(() => {
    if (!selectedRodadaId && rodadas && rodadas.length > 0) {
      setSelectedRodadaId(rodadas[0].id);
      setRodadaResultadosId(rodadas[0].id);
    }
  }, [rodadas, selectedRodadaId]);

  useEffect(() => {
    if (selectedRodada && selectedRodadaId !== "new") {
      setRodadaForm({
        numero: String(selectedRodada.numero || ""),
        status: selectedRodada.status || "aguardando",
        data_inicio: toDateTimeLocal(selectedRodada.data_inicio),
        data_fechamento: toDateTimeLocal(selectedRodada.data_fechamento),
      });
    } else if (selectedRodadaId === "new") {
      setRodadaForm({ numero: "", status: "aguardando", data_inicio: "", data_fechamento: "" });
    }
  }, [selectedRodada, selectedRodadaId]);

  const handleNovaRodada = () => {
    setSelectedRodadaId("new");
    setRodadaForm({ numero: "", status: "aguardando", data_inicio: "", data_fechamento: "" });
    setNovoJogo({ mandante: "", visitante: "" });
    setJogoEdits({});
  };

  const handleSalvarRodada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rodadaForm.numero) {
      toast.error("Informe o número da rodada");
      return;
    }

    const numero = Number(rodadaForm.numero);
    if (Number.isNaN(numero) || numero < 1 || numero > 38) {
      toast.error("Número de rodada inválido");
      return;
    }

    const dataInicio = parseDateTimeLocal(rodadaForm.data_inicio);
    const dataFechamento = parseDateTimeLocal(rodadaForm.data_fechamento);

    try {
      if (!selectedRodada || selectedRodadaId === "new") {
        const res = await createRodada.mutateAsync({
          numero,
          status: rodadaForm.status,
          data_inicio: dataInicio,
          data_fechamento: dataFechamento,
        });
        toast.success(`Rodada ${numero} criada`);
        setSelectedRodadaId(res.id);
        setRodadaResultadosId(res.id);
      } else {
        await updateRodada.mutateAsync({
          id: selectedRodada.id,
          data: {
            numero,
            status: rodadaForm.status,
            data_inicio: dataInicio ?? undefined,
            data_fechamento: dataFechamento ?? undefined,
          },
        });
        toast.success("Rodada atualizada");
      }
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível salvar a rodada");
    }
  };

  const handleAdicionarJogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRodada || selectedRodadaId === "new") {
      toast.error("Selecione ou crie uma rodada primeiro");
      return;
    }
    if (!novoJogo.mandante || !novoJogo.visitante) {
      toast.error("Selecione os times do jogo");
      return;
    }
    if (novoJogo.mandante === novoJogo.visitante) {
      toast.error("Os times devem ser diferentes");
      return;
    }

    const dataJogo = selectedRodada?.data_inicio || new Date();

    try {
      await createJogo.mutateAsync({
        rodada_id: selectedRodada.id,
        time_casa: TIMES.find((t) => t.slug === novoJogo.mandante)?.name || "Mandante",
        time_visitante: TIMES.find((t) => t.slug === novoJogo.visitante)?.name || "Visitante",
        logo_casa: novoJogo.mandante,
        logo_visitante: novoJogo.visitante,
        data_jogo: dataJogo,
        status: "agendado",
      });
      toast.success("Jogo cadastrado");
      setNovoJogo({ mandante: "", visitante: "" });
      queryClient.invalidateQueries({ queryKey: ["jogos-rodada", selectedRodada.id] });
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível cadastrar o jogo");
    }
  };

  const handleAtualizarJogo = (jogo: Jogo) => {
    const edit = jogoEdits[jogo.id];
    const payload: any = {
      time_casa: edit?.mandante || jogo.time_casa,
      time_visitante: edit?.visitante || jogo.time_visitante,
      status: edit?.status || jogo.status || "agendado",
    };

    updateJogo.mutate(
      { id: jogo.id, data: payload },
      {
        onSuccess: () => toast.success("Jogo atualizado"),
        onError: (err: any) => toast.error(err?.message || "Erro ao atualizar jogo"),
      }
    );
  };

  const handleExcluirJogo = (id: string) => {
    deleteJogo.mutate(
      { id },
      {
        onSuccess: () => toast.success("Jogo removido"),
        onError: (err: any) => toast.error(err?.message || "Erro ao remover jogo"),
      }
    );
  };

  const handleSalvarResultado = (jogo: Jogo) => {
    const edit = resultadoEdits[jogo.id];
    const placarCasa = edit?.placarCasa ?? (jogo.placar_casa ?? "");
    const placarVisitante = edit?.placarVisitante ?? (jogo.placar_visitante ?? "");

    if (placarCasa === "" || placarVisitante === "") {
      toast.error("Informe os dois placares");
      return;
    }

    const placarCasaNum = Number(placarCasa);
    const placarVisitanteNum = Number(placarVisitante);
    if (Number.isNaN(placarCasaNum) || Number.isNaN(placarVisitanteNum)) {
      toast.error("Placar inválido");
      return;
    }

    updateJogo.mutate(
      {
        id: jogo.id,
        data: {
          placar_casa: placarCasaNum,
          placar_visitante: placarVisitanteNum,
          status: "finalizado",
        },
      },
      {
        onSuccess: () => toast.success("Placar salvo"),
        onError: (err: any) => toast.error(err?.message || "Erro ao salvar placar"),
      }
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-brasil">
            <Settings className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground">Rodadas, jogos e resultados</p>
          </div>
        </div>

        <Tabs defaultValue="rodadas" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-2">
            <TabsTrigger value="rodadas">Rodadas & Jogos</TabsTrigger>
            <TabsTrigger value="resultados">Inserir Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="rodadas" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Gerenciar Rodadas
                </CardTitle>
                <CardDescription>Edite a rodada e seus jogos em uma única tela</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full" onClick={handleNovaRodada}>
                      <Plus className="mr-2 h-4 w-4" /> Nova Rodada
                    </Button>
                    <div className="flex flex-col gap-2">
                      {loadingRodadas && <div className="text-sm text-muted-foreground">Carregando...</div>}
                      {!loadingRodadas && (!rodadas || rodadas.length === 0) && (
                        <div className="text-sm text-muted-foreground">Nenhuma rodada cadastrada</div>
                      )}
                      {rodadas?.map((rodada) => (
                        <Button
                          key={rodada.id}
                          variant={selectedRodadaId === rodada.id ? "default" : "ghost"}
                          className="w-full justify-between"
                          onClick={() => setSelectedRodadaId(rodada.id)}
                        >
                          <span>Rodada {rodada.numero}</span>
                          <Badge variant="secondary" className="ml-2 text-xs capitalize">
                            {rodada.status || "aguardando"}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card className="border-dashed">
                      <CardHeader>
                        <CardTitle>Dados da Rodada</CardTitle>
                        <CardDescription>Defina status e janelas de palpite</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSalvarRodada}>
                          <div className="space-y-2">
                            <Label>Número</Label>
                            <Input
                              type="number"
                              min="1"
                              max="38"
                              value={rodadaForm.numero}
                              onChange={(e) => setRodadaForm({ ...rodadaForm, numero: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={rodadaForm.status}
                              onChange={(e) => setRodadaForm({ ...rodadaForm, status: e.target.value })}
                            >
                              <option value="aguardando">Aguardando</option>
                              <option value="em_andamento">Em andamento</option>
                              <option value="finalizada">Finalizada</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Data início (abre palpite)</Label>
                            <Input
                              type="datetime-local"
                              value={rodadaForm.data_inicio}
                              onChange={(e) => setRodadaForm({ ...rodadaForm, data_inicio: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Data fechamento (encerra palpite)</Label>
                            <Input
                              type="datetime-local"
                              value={rodadaForm.data_fechamento}
                              onChange={(e) => setRodadaForm({ ...rodadaForm, data_fechamento: e.target.value })}
                            />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <Button type="submit" disabled={createRodada.isLoading || updateRodada.isLoading}>
                              <Save className="mr-2 h-4 w-4" />
                              {createRodada.isLoading || updateRodada.isLoading ? "Salvando..." : "Salvar rodada"}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>

                    <Card className="shadow-card">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Jogos da Rodada</CardTitle>
                            <CardDescription>Cadastre, edite ou remova jogos vinculados</CardDescription>
                          </div>
                          {selectedRodada && selectedRodadaId !== "new" && (
                            <Badge variant="outline">Rodada {selectedRodada.numero}</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end" onSubmit={handleAdicionarJogo}>
                          <div className="space-y-2">
                            <Label>Mandante</Label>
                            <Select
                              value={novoJogo.mandante}
                              onValueChange={(value) => setNovoJogo({ ...novoJogo, mandante: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {TIMES.filter((t) => t.slug !== novoJogo.visitante).map((team) => (
                                  <SelectItem key={team.slug} value={team.slug}>
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={`${URL_ESCUDOS}${team.slug}`}
                                        alt={team.name}
                                        className="h-5 w-5 rounded-full object-contain"
                                        loading="lazy"
                                      />
                                      <span>{team.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Visitante</Label>
                            <Select
                              value={novoJogo.visitante}
                              onValueChange={(value) => setNovoJogo({ ...novoJogo, visitante: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {TIMES.filter((t) => t.slug !== novoJogo.mandante).map((team) => (
                                  <SelectItem key={team.slug} value={team.slug}>
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={`${URL_ESCUDOS}${team.slug}`}
                                        alt={team.name}
                                        className="h-5 w-5 rounded-full object-contain"
                                        loading="lazy"
                                      />
                                      <span>{team.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button type="submit" disabled={createJogo.isLoading}>
                            <Plus className="mr-2 h-4 w-4" />
                            {createJogo.isLoading ? "Salvando..." : "Adicionar jogo"}
                          </Button>
                        </form>

                        {loadingJogosRodada ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Carregando jogos...
                          </div>
                        ) : !jogosRodada || jogosRodada.length === 0 ? (
                          <div className="text-sm text-muted-foreground">Nenhum jogo cadastrado nesta rodada.</div>
                        ) : (
                          <div className="space-y-3">
                            {jogosRodada.map((jogo) => {
                              const edit = jogoEdits[jogo.id] || {
                                mandante: jogo.logo_casa || "",
                                visitante: jogo.logo_visitante || "",
                                status: jogo.status || "agendado",
                              };

                              return (
                                <div key={jogo.id} className="rounded-lg border p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {jogo.logo_casa && (
                                        <img
                                          src={`${URL_ESCUDOS}${jogo.logo_casa}`}
                                          alt={jogo.time_casa}
                                          className="h-8 w-8 object-contain"
                                        />
                                      )}
                                      <div className="font-semibold">{jogo.time_casa}</div>
                                      <span className="text-muted-foreground">x</span>
                                      <div className="font-semibold">{jogo.time_visitante}</div>
                                      {jogo.logo_visitante && (
                                        <img
                                          src={`${URL_ESCUDOS}${jogo.logo_visitante}`}
                                          alt={jogo.time_visitante}
                                          className="h-8 w-8 object-contain"
                                        />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="capitalize">{jogo.status || "agendado"}</Badge>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive"
                                        onClick={() => handleExcluirJogo(jogo.id)}
                                        disabled={deleteJogo.isLoading}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="grid gap-3 md:grid-cols-3">
                                    <Select
                                      value={edit.mandante}
                                      onValueChange={(value) =>
                                        setJogoEdits((prev) => ({
                                          ...prev,
                                          [jogo.id]: { ...edit, mandante: value },
                                        }))
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Mandante" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {TIMES.map((team) => (
                                          <SelectItem key={team.slug} value={team.slug}>
                                            <div className="flex items-center gap-2">
                                              <img
                                                src={`${URL_ESCUDOS}${team.slug}`}
                                                alt={team.name}
                                                className="h-5 w-5 rounded-full object-contain"
                                              />
                                              <span>{team.name}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>

                                    <Select
                                      value={edit.visitante}
                                      onValueChange={(value) =>
                                        setJogoEdits((prev) => ({
                                          ...prev,
                                          [jogo.id]: { ...edit, visitante: value },
                                        }))
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Visitante" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {TIMES.map((team) => (
                                          <SelectItem key={team.slug} value={team.slug}>
                                            <div className="flex items-center gap-2">
                                              <img
                                                src={`${URL_ESCUDOS}${team.slug}`}
                                                alt={team.name}
                                                className="h-5 w-5 rounded-full object-contain"
                                              />
                                              <span>{team.name}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>

                                    <select
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                      value={edit.status}
                                      onChange={(e) =>
                                        setJogoEdits((prev) => ({
                                          ...prev,
                                          [jogo.id]: { ...edit, status: e.target.value },
                                        }))
                                      }
                                    >
                                      <option value="agendado">Agendado</option>
                                      <option value="ao_vivo">Ao vivo</option>
                                      <option value="finalizado">Finalizado</option>
                                      <option value="cancelado">Cancelado</option>
                                    </select>
                                  </div>

                                  <div className="flex justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAtualizarJogo(jogo)}
                                      disabled={updateJogo.isLoading}
                                    >
                                      {updateJogo.isLoading ? "Salvando..." : "Salvar alterações"}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resultados" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Inserir resultados por rodada
                </CardTitle>
                <CardDescription>Escolha a rodada e salve os placares em massa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[260px_1fr] md:items-end">
                  <div className="space-y-2">
                    <Label>Rodada</Label>
                    <Select
                      value={rodadaResultadosId || ""}
                      onValueChange={(value) => setRodadaResultadosId(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {rodadas?.map((rodada) => (
                          <SelectItem key={rodada.id} value={rodada.id}>
                            Rodada {rodada.numero}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Selecione a rodada para carregar os jogos e lançar os resultados.
                  </div>
                </div>

                {loadingResultados ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando jogos...
                  </div>
                ) : !jogosResultados || jogosResultados.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhum jogo encontrado para a rodada selecionada.</div>
                ) : (
                  <div className="space-y-3">
                    {jogosResultados.map((jogo) => {
                      const edit = resultadoEdits[jogo.id] || {
                        placarCasa: jogo.placar_casa?.toString() || "",
                        placarVisitante: jogo.placar_visitante?.toString() || "",
                      };

                      return (
                        <div
                          key={jogo.id}
                          className="rounded-lg border p-4 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_140px] items-center"
                        >
                          <div className="flex items-center gap-2">
                            {jogo.logo_casa && (
                              <img
                                src={`${URL_ESCUDOS}${jogo.logo_casa}`}
                                alt={jogo.time_casa}
                                className="h-7 w-7 object-contain"
                              />
                            )}
                            <div className="font-semibold">{jogo.time_casa}</div>
                          </div>

                          <div className="text-center text-muted-foreground font-medium">x</div>

                          <div className="flex items-center gap-2">
                            {jogo.logo_visitante && (
                              <img
                                src={`${URL_ESCUDOS}${jogo.logo_visitante}`}
                                alt={jogo.time_visitante}
                                className="h-7 w-7 object-contain"
                              />
                            )}
                            <div className="font-semibold">{jogo.time_visitante}</div>
                          </div>

                          <div className="flex items-center gap-2 justify-end">
                            <Input
                              type="number"
                              min="0"
                              className="w-20"
                              value={edit.placarCasa}
                              onChange={(e) =>
                                setResultadoEdits((prev) => ({
                                  ...prev,
                                  [jogo.id]: { ...edit, placarCasa: e.target.value },
                                }))
                              }
                            />
                            <span className="text-muted-foreground">x</span>
                            <Input
                              type="number"
                              min="0"
                              className="w-20"
                              value={edit.placarVisitante}
                              onChange={(e) =>
                                setResultadoEdits((prev) => ({
                                  ...prev,
                                  [jogo.id]: { ...edit, placarVisitante: e.target.value },
                                }))
                              }
                            />
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSalvarResultado(jogo)}
                            disabled={updateJogo.isLoading}
                          >
                            {updateJogo.isLoading ? "Salvando..." : "Salvar placar"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
