import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Plus, Save, Trash2, Edit3, Loader2, Calendar, Clock, Trophy } from "lucide-react";
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
  useFinalizarJogoECalcularPontos,
} from "@/hooks/useJogosFirebase";
import { Jogo, Rodada } from "@/types/firebase";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const formatDateForInput = (date: Date | any) => {
  if (!date) return '';
  const d = new Date(date);
  const offset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
};

const parseDateTimeLocal = (value: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "em_andamento":
      return "default";
    case "finalizada":
      return "secondary";
    case "aguardando":
    default:
      return "outline";
  }
};

const getGameStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "ao_vivo":
      return "destructive";
    case "finalizado":
      return "secondary";
    case "cancelado":
      return "outline";
    case "agendado":
    default:
      return "default";
  }
};

export default function Admin() {
  const queryClient = useQueryClient();
  const { data: rodadas, isLoading: loadingRodadas, error: errorRodadas } = useRodadas();
  const [selectedRodadaId, setSelectedRodadaId] = useState<string | null>(null);
  
  // Estados dos modais
  const [modalNovaRodada, setModalNovaRodada] = useState(false);
  const [modalEditarRodada, setModalEditarRodada] = useState<Rodada | null>(null);
  const [modalAdicionarJogo, setModalAdicionarJogo] = useState(false);
  const [modalEditarJogo, setModalEditarJogo] = useState<Jogo | null>(null);
  const [modalEditarPlacar, setModalEditarPlacar] = useState<Jogo | null>(null);

  // Formulário de nova rodada
  const [rodadaForm, setRodadaForm] = useState({
    numero: "",
    status: "aguardando",
    data_inicio: "",
    data_fechamento: "",
  });

  // Formulário de editar rodada
  const [editarRodadaForm, setEditarRodadaForm] = useState({
    numero: "",
    status: "aguardando",
    data_inicio: "",
    data_fechamento: "",
  });

  // Formulário de novo jogo
  const [novoJogoForm, setNovoJogoForm] = useState({
    time_casa: "",
    time_visitante: "",
    data_jogo: "",
  });

  // Formulário de editar jogo
  const [editarJogoForm, setEditarJogoForm] = useState({
    time_casa: "",
    time_visitante: "",
    data_jogo: "",
    status: "agendado",
  });

  // Formulário de editar placar
  const [editarPlacarForm, setEditarPlacarForm] = useState({
    placar_casa: "",
    placar_visitante: "",
  });

  const { data: jogosRodada, isLoading: loadingJogosRodada, error: errorJogos } = useJogosPorRodada(
    selectedRodadaId || undefined
  );

  const createRodada = useCriarRodada();
  const updateRodada = useAtualizarRodada();
  const createJogo = useCriarJogo();
  const updateJogo = useAtualizarJogo();
  const deleteJogo = useDeletarJogo();
  const finalizarJogoECalcular = useFinalizarJogoECalcularPontos();

  const selectedRodada = useMemo(
    () => rodadas?.find((r) => r.id === selectedRodadaId) || null,
    [rodadas, selectedRodadaId]
  );

  // Selecionar primeira rodada automaticamente
  useEffect(() => {
    if (!selectedRodadaId && rodadas && rodadas.length > 0) {
      setSelectedRodadaId(rodadas[0].id);
    }
  }, [rodadas, selectedRodadaId]);

  useEffect(() => {
    const autoAtualizarStatusRodadas = async () => {
      if (!rodadas || rodadas.length === 0) return;

      const agora = new Date();
      const rodadasParaAtualizar = rodadas.filter((rodada) => {
        if (rodada.status !== 'aguardando') return false;
        if (!rodada.data_fechamento) return false;
        return agora >= new Date(rodada.data_fechamento);
      });

      if (rodadasParaAtualizar.length === 0) return;

      try {
        for (const rodada of rodadasParaAtualizar) {
          const rodadaRef = doc(db, 'rodadas', rodada.id);
          await updateDoc(rodadaRef, {
            status: 'em_andamento',
            updated_at: serverTimestamp(),
          });
        }

        await queryClient.invalidateQueries({ queryKey: ['rodadas'] });
        await queryClient.invalidateQueries({ queryKey: ['rodada-atual'] });
      } catch (error) {
        console.error('Erro ao atualizar status automático das rodadas:', error);
      }
    };

    autoAtualizarStatusRodadas();
  }, [rodadas, queryClient]);

  // Resetar formulário quando modal de nova rodada abre
  useEffect(() => {
    if (modalNovaRodada) {
      setRodadaForm({
        numero: "",
        status: "aguardando",
        data_inicio: "",
        data_fechamento: "",
      });
    }
  }, [modalNovaRodada]);

  // Preencher formulário quando modal de editar rodada abre
  useEffect(() => {
    if (modalEditarRodada) {
      setEditarRodadaForm({
        numero: modalEditarRodada.numero.toString(),
        status: modalEditarRodada.status,
        data_inicio: formatDateForInput(modalEditarRodada.data_inicio),
        data_fechamento: formatDateForInput(modalEditarRodada.data_fechamento),
      });
    }
  }, [modalEditarRodada]);

  // Resetar formulário quando modal de adicionar jogo abre
  useEffect(() => {
    if (modalAdicionarJogo) {
      const dataInicio = selectedRodada?.data_inicio instanceof Date 
        ? selectedRodada.data_inicio 
        : null;
      setNovoJogoForm({
        time_casa: "",
        time_visitante: "",
        data_jogo: dataInicio ? formatDateForInput(dataInicio) : "",
      });
    }
  }, [modalAdicionarJogo, selectedRodada]);

  // Preencher formulário quando modal de editar jogo abre
  useEffect(() => {
    if (modalEditarJogo) {
      setEditarJogoForm({
        time_casa: modalEditarJogo.logo_casa || "",
        time_visitante: modalEditarJogo.logo_visitante || "",
        data_jogo: formatDateForInput(modalEditarJogo.data_jogo),
        status: modalEditarJogo.status || "agendado",
      });
    }
  }, [modalEditarJogo]);

  // Preencher formulário quando modal de editar placar abre
  useEffect(() => {
    if (modalEditarPlacar) {
      setEditarPlacarForm({
        placar_casa: modalEditarPlacar.placar_casa?.toString() || "",
        placar_visitante: modalEditarPlacar.placar_visitante?.toString() || "",
      });
    }
  }, [modalEditarPlacar]);

  const handleCriarRodada = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rodadaForm.numero) {
      toast.error("Informe o número da rodada");
      return;
    }

    const numero = Number(rodadaForm.numero);
    if (Number.isNaN(numero) || numero < 1 || numero > 38) {
      toast.error("Número de rodada inválido (deve ser entre 1 e 38)");
      return;
    }

    const dataInicio = parseDateTimeLocal(rodadaForm.data_inicio);
    const dataFechamento = parseDateTimeLocal(rodadaForm.data_fechamento);

    try {
      const res = await createRodada.mutateAsync({
        numero,
        status: rodadaForm.status as "aguardando" | "em_andamento" | "finalizada",
        data_inicio: dataInicio,
        data_fechamento: dataFechamento,
      });
      
      toast.success(`✅ Rodada ${numero} criada com sucesso!`);
      setModalNovaRodada(false);
      
      // Invalidar cache e selecionar nova rodada
      await queryClient.invalidateQueries({ queryKey: ["rodadas"] });
      setSelectedRodadaId(res.id);
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível criar a rodada");
    }
  };

  const handleEditarRodada = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!modalEditarRodada) return;

    const numero = Number(editarRodadaForm.numero);
    if (Number.isNaN(numero) || numero < 1 || numero > 38) {
      toast.error("Número de rodada inválido (deve ser entre 1 e 38)");
      return;
    }

    const dataInicio = parseDateTimeLocal(editarRodadaForm.data_inicio);
    const dataFechamento = parseDateTimeLocal(editarRodadaForm.data_fechamento);

    if (editarRodadaForm.status === 'finalizada') {
      try {
        const jogosRef = collection(db, 'jogos');
        const q = query(jogosRef, where('rodada_id', '==', modalEditarRodada.id));
        const jogosSnapshot = await getDocs(q);

        if (jogosSnapshot.empty) {
          toast.error("❌ Erro: A rodada não possui jogos cadastrados. Adicione jogos antes de finalizar.");
          return;
        }

        const jogosSemPlacar = jogosSnapshot.docs.filter((doc) => {
          const data = doc.data();
          return data.placar_casa === null || data.placar_casa === undefined ||
                 data.placar_visitante === null || data.placar_visitante === undefined;
        });

        if (jogosSemPlacar.length > 0) {
          toast.error(
            `❌ Erro: ${jogosSemPlacar.length} jogo(s) sem placar definido. Preencha todos os placares antes de finalizar a rodada.`,
            { duration: 5000 }
          );
          return;
        }
      } catch (error) {
        console.error('Erro ao validar placares:', error);
        toast.error("Erro ao validar placares dos jogos");
        return;
      }
    }

    try {
      await updateRodada.mutateAsync({
        id: modalEditarRodada.id,
        data: {
          numero,
          status: editarRodadaForm.status as "aguardando" | "em_andamento" | "finalizada",
          data_inicio: dataInicio,
          data_fechamento: dataFechamento,
        },
      });
      
      toast.success(`✅ Rodada ${numero} atualizada com sucesso!`);
      setModalEditarRodada(null);
      
      await queryClient.invalidateQueries({ queryKey: ["rodadas"] });
      await queryClient.invalidateQueries({ queryKey: ["rodada-atual"] });
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível atualizar a rodada");
    }
  };

  const handleAdicionarJogo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRodada) {
      toast.error("Selecione uma rodada primeiro");
      return;
    }

    if (!novoJogoForm.time_casa || !novoJogoForm.time_visitante) {
      toast.error("Selecione os dois times");
      return;
    }

    if (novoJogoForm.time_casa === novoJogoForm.time_visitante) {
      toast.error("Os times devem ser diferentes");
      return;
    }

    const dataInicioRodada = selectedRodada.data_inicio instanceof Date 
      ? selectedRodada.data_inicio 
      : null;
    const dataJogo = parseDateTimeLocal(novoJogoForm.data_jogo) || dataInicioRodada || new Date();

    try {
      await createJogo.mutateAsync({
        rodada_id: selectedRodada.id,
        rodada_numero: selectedRodada.numero,
        time_casa: TIMES.find((t) => t.slug === novoJogoForm.time_casa)?.name || "Mandante",
        time_visitante: TIMES.find((t) => t.slug === novoJogoForm.time_visitante)?.name || "Visitante",
        logo_casa: novoJogoForm.time_casa,
        logo_visitante: novoJogoForm.time_visitante,
        data_jogo: dataJogo,
        status: "agendado",
      });

      toast.success("Jogo adicionado com sucesso!");
      setModalAdicionarJogo(false);
      
      // Invalidar cache de jogos
      await queryClient.invalidateQueries({ queryKey: ["jogos-rodada", selectedRodada.id] });
      await queryClient.refetchQueries({ queryKey: ["jogos-rodada", selectedRodada.id] });
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível adicionar o jogo");
    }
  };

  const handleEditarJogo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!modalEditarJogo) return;

    if (!editarJogoForm.time_casa || !editarJogoForm.time_visitante) {
      toast.error("Selecione os dois times");
      return;
    }

    if (editarJogoForm.time_casa === editarJogoForm.time_visitante) {
      toast.error("Os times devem ser diferentes");
      return;
    }

    const dataJogo = parseDateTimeLocal(editarJogoForm.data_jogo) || modalEditarJogo.data_jogo;

    try {
      await updateJogo.mutateAsync({
        id: modalEditarJogo.id,
        data: {
          time_casa: TIMES.find((t) => t.slug === editarJogoForm.time_casa)?.name || modalEditarJogo.time_casa,
          time_visitante: TIMES.find((t) => t.slug === editarJogoForm.time_visitante)?.name || modalEditarJogo.time_visitante,
          logo_casa: editarJogoForm.time_casa,
          logo_visitante: editarJogoForm.time_visitante,
          data_jogo: dataJogo,
          status: editarJogoForm.status as "agendado" | "ao_vivo" | "finalizado" | "cancelado",
        },
      });

      toast.success("Jogo atualizado com sucesso!");
      setModalEditarJogo(null);
      
      // Invalidar cache de jogos
      if (modalEditarJogo.rodada_id) {
        await queryClient.invalidateQueries({ queryKey: ["jogos-rodada", modalEditarJogo.rodada_id] });
        await queryClient.refetchQueries({ queryKey: ["jogos-rodada", modalEditarJogo.rodada_id] });
      }
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível atualizar o jogo");
    }
  };

  const handleDeletarJogo = async () => {
    if (!modalEditarJogo) return;

    const rodadaId = modalEditarJogo.rodada_id;

    try {
      await deleteJogo.mutateAsync({ id: modalEditarJogo.id });
      toast.success("Jogo removido com sucesso!");
      setModalEditarJogo(null);
      
      // Invalidar cache de jogos
      if (rodadaId) {
        await queryClient.invalidateQueries({ queryKey: ["jogos-rodada", rodadaId] });
        await queryClient.refetchQueries({ queryKey: ["jogos-rodada", rodadaId] });
      }
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível remover o jogo");
    }
  };

  const handleSalvarPlacarECalcular = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!modalEditarPlacar) return;

    const placarCasa = Number(editarPlacarForm.placar_casa);
    const placarVisitante = Number(editarPlacarForm.placar_visitante);

    // Validação
    if (editarPlacarForm.placar_casa === "" || editarPlacarForm.placar_visitante === "") {
      toast.error("Informe ambos os placares");
      return;
    }

    if (Number.isNaN(placarCasa) || placarCasa < 0) {
      toast.error("Placar do time da casa deve ser um número >= 0");
      return;
    }

    if (Number.isNaN(placarVisitante) || placarVisitante < 0) {
      toast.error("Placar do time visitante deve ser um número >= 0");
      return;
    }

    try {
      const result = await finalizarJogoECalcular.mutateAsync({
        jogoId: modalEditarPlacar.id,
        rodadaId: modalEditarPlacar.rodada_id,
        placarCasa,
        placarVisitante,
      });

      toast.success(
        `Placar salvo e pontuação calculada para ${result.palpitesAtualizados} usuário(s)!`
      );
      setModalEditarPlacar(null);
      
      // Invalidar cache e refetch
      if (modalEditarPlacar.rodada_id) {
        await queryClient.invalidateQueries({ queryKey: ["jogos-rodada", modalEditarPlacar.rodada_id] });
        await queryClient.refetchQueries({ queryKey: ["jogos-rodada", modalEditarPlacar.rodada_id] });
      }
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível salvar o placar e calcular pontos");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-brasil">
            <Settings className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerencie rodadas e jogos do campeonato</p>
          </div>
        </div>

        {/* Layout Master-Detail */}
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Sidebar de Rodadas */}
          <div className="w-80 flex-shrink-0">
            <Card className="shadow-card h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Rodadas
                </CardTitle>
                <CardDescription>Selecione uma rodada para gerenciar</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
                <Button
                  className="w-full"
                  onClick={() => setModalNovaRodada(true)}
                  disabled={createRodada.isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Rodada
                </Button>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {loadingRodadas ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : errorRodadas ? (
                    <div className="text-sm text-destructive py-8 text-center">
                      Erro ao carregar rodadas
                    </div>
                  ) : !rodadas || rodadas.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-8 text-center">
                      <p className="mb-2">Nenhuma rodada cadastrada</p>
                      <p className="text-xs">Clique em "Nova Rodada" para começar</p>
                    </div>
                  ) : (
                    rodadas.map((rodada) => (
                      <div key={rodada.id} className="relative group">
                        <Button
                          variant={selectedRodadaId === rodada.id ? "default" : "ghost"}
                          className="w-full justify-between h-auto py-3 pr-12"
                          onClick={() => setSelectedRodadaId(rodada.id)}
                        >
                          <span className="font-semibold">Rodada {rodada.numero}</span>
                          <Badge
                            variant={getStatusBadgeVariant(rodada.status)}
                            className="ml-2 text-xs capitalize"
                          >
                            {rodada.status || "aguardando"}
                          </Badge>
                        </Button>
                        
                        {/* Botão de Editar - Aparece ao hover */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalEditarRodada(rodada);
                          }}
                          title="Editar rodada"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Área Principal */}
          <div className="flex-1 min-w-0">
            <Card className="shadow-card h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedRodada ? (
                        <>
                          Rodada {selectedRodada.numero}
                          <Badge
                            variant={getStatusBadgeVariant(selectedRodada.status)}
                            className="capitalize"
                          >
                            {selectedRodada.status}
                          </Badge>
                        </>
                      ) : (
                        "Selecione uma rodada"
                      )}
                    </CardTitle>
                    <CardDescription>
                      {selectedRodada
                        ? "Gerencie os jogos desta rodada"
                        : "Escolha uma rodada na sidebar para começar"}
                    </CardDescription>
                  </div>
                  {selectedRodada && (
                    <Button
                      onClick={() => setModalAdicionarJogo(true)}
                      disabled={createJogo.isLoading}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Jogo
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {!selectedRodada ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma rodada selecionada</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Selecione uma rodada na sidebar ou crie uma nova
                    </p>
                    <Button onClick={() => setModalNovaRodada(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Nova Rodada
                    </Button>
                  </div>
                ) : loadingJogosRodada ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-muted-foreground">Carregando jogos...</span>
                  </div>
                ) : errorJogos ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-destructive mb-2">Erro ao carregar jogos</p>
                    <p className="text-sm text-muted-foreground">
                      {errorJogos instanceof Error ? errorJogos.message : "Tente novamente mais tarde"}
                    </p>
                  </div>
                ) : !jogosRodada || jogosRodada.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <Clock className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum jogo cadastrado</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta rodada ainda não possui jogos cadastrados
                    </p>
                    <Button onClick={() => setModalAdicionarJogo(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Primeiro Jogo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jogosRodada.map((jogo) => (
                      <Card key={jogo.id} className="shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              {/* Time Casa */}
                              <div className="flex items-center gap-2">
                                {jogo.logo_casa && (
                                  <img
                                    src={`${URL_ESCUDOS}${jogo.logo_casa}`}
                                    alt={jogo.time_casa}
                                    className="h-10 w-10 object-contain"
                                    loading="lazy"
                                  />
                                )}
                                <span className="font-semibold">{jogo.time_casa}</span>
                              </div>

                              <span className="text-muted-foreground font-medium">x</span>

                              {/* Time Visitante */}
                              <div className="flex items-center gap-2">
                                {jogo.logo_visitante && (
                                  <img
                                    src={`${URL_ESCUDOS}${jogo.logo_visitante}`}
                                    alt={jogo.time_visitante}
                                    className="h-10 w-10 object-contain"
                                    loading="lazy"
                                  />
                                )}
                                <span className="font-semibold">{jogo.time_visitante}</span>
                              </div>

                              {/* Data do Jogo */}
                              <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {jogo.data_jogo instanceof Date 
                                  ? jogo.data_jogo.toLocaleString("pt-BR", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : new Date(jogo.data_jogo).toLocaleString("pt-BR", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <Badge
                                variant={getGameStatusBadgeVariant(jogo.status)}
                                className="capitalize"
                              >
                                {jogo.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setModalEditarPlacar(jogo)}
                                title="Editar Placar"
                              >
                                <Trophy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setModalEditarJogo(jogo)}
                                title="Editar Jogo"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Placar (se finalizado) */}
                          {jogo.status === "finalizado" && (
                            <div className="mt-3 pt-3 border-t flex items-center justify-center gap-2">
                              <span className="text-2xl font-bold">{jogo.placar_casa ?? 0}</span>
                              <span className="text-muted-foreground">x</span>
                              <span className="text-2xl font-bold">{jogo.placar_visitante ?? 0}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal Nova Rodada */}
        <Dialog open={modalNovaRodada} onOpenChange={setModalNovaRodada}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Rodada</DialogTitle>
              <DialogDescription>
                Crie uma nova rodada do campeonato. Defina o número, status e datas.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCriarRodada}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número da Rodada *</Label>
                  <Input
                    id="numero"
                    type="number"
                    min="1"
                    max="38"
                    value={rodadaForm.numero}
                    onChange={(e) => setRodadaForm({ ...rodadaForm, numero: e.target.value })}
                    required
                    placeholder="Ex: 1"
                  />
                  <p className="text-xs text-muted-foreground">Número entre 1 e 38</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={rodadaForm.status}
                    onValueChange={(value) => setRodadaForm({ ...rodadaForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aguardando">Aguardando</SelectItem>
                      <SelectItem value="em_andamento">Em andamento</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data de Início (abre palpite)</Label>
                  <Input
                    id="data_inicio"
                    type="datetime-local"
                    value={rodadaForm.data_inicio}
                    onChange={(e) => setRodadaForm({ ...rodadaForm, data_inicio: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_fechamento">Data de Fechamento (encerra palpite)</Label>
                  <Input
                    id="data_fechamento"
                    type="datetime-local"
                    value={rodadaForm.data_fechamento}
                    onChange={(e) => setRodadaForm({ ...rodadaForm, data_fechamento: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalNovaRodada(false)}
                  disabled={createRodada.isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createRodada.isLoading}>
                  {createRodada.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Criar Rodada
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Editar Rodada */}
        <Dialog open={!!modalEditarRodada} onOpenChange={(open) => !open && setModalEditarRodada(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Rodada</DialogTitle>
              <DialogDescription>
                Altere as informações da Rodada {modalEditarRodada?.numero}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditarRodada}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_numero">Número da Rodada *</Label>
                  <Input
                    id="edit_numero"
                    type="number"
                    min="1"
                    max="38"
                    value={editarRodadaForm.numero}
                    onChange={(e) => setEditarRodadaForm({ ...editarRodadaForm, numero: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_status">Status</Label>
                  <Select
                    value={editarRodadaForm.status}
                    onValueChange={(value) => setEditarRodadaForm({ ...editarRodadaForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aguardando">Aguardando</SelectItem>
                      <SelectItem value="em_andamento">Em andamento</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_data_inicio">Data de Início</Label>
                  <Input
                    id="edit_data_inicio"
                    type="datetime-local"
                    value={editarRodadaForm.data_inicio}
                    onChange={(e) => setEditarRodadaForm({ ...editarRodadaForm, data_inicio: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_data_fechamento">Data de Fechamento</Label>
                  <Input
                    id="edit_data_fechamento"
                    type="datetime-local"
                    value={editarRodadaForm.data_fechamento}
                    onChange={(e) => setEditarRodadaForm({ ...editarRodadaForm, data_fechamento: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalEditarRodada(null)}
                  disabled={updateRodada.isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateRodada.isLoading}>
                  {updateRodada.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Adicionar Jogo */}
        <Dialog open={modalAdicionarJogo} onOpenChange={setModalAdicionarJogo}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Jogo</DialogTitle>
              <DialogDescription>
                Adicione um novo jogo à rodada {selectedRodada?.numero}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdicionarJogo}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="time_casa">Time Mandante *</Label>
                  <Select
                    value={novoJogoForm.time_casa}
                    onValueChange={(value) =>
                      setNovoJogoForm({ ...novoJogoForm, time_casa: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o time mandante" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMES.filter((t) => t.slug !== novoJogoForm.time_visitante).map((team) => (
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
                  <Label htmlFor="time_visitante">Time Visitante *</Label>
                  <Select
                    value={novoJogoForm.time_visitante}
                    onValueChange={(value) =>
                      setNovoJogoForm({ ...novoJogoForm, time_visitante: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o time visitante" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMES.filter((t) => t.slug !== novoJogoForm.time_casa).map((team) => (
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
                  <Label htmlFor="data_jogo">Data e Hora do Jogo</Label>
                  <Input
                    id="data_jogo"
                    type="datetime-local"
                    value={novoJogoForm.data_jogo}
                    onChange={(e) =>
                      setNovoJogoForm({ ...novoJogoForm, data_jogo: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Se não informado, usará a data de início da rodada
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalAdicionarJogo(false)}
                  disabled={createJogo.isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createJogo.isLoading}>
                  {createJogo.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Jogo
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Editar Placar */}
        <Dialog open={!!modalEditarPlacar} onOpenChange={(open) => !open && setModalEditarPlacar(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Placar e Calcular Pontos</DialogTitle>
              <DialogDescription>
                {modalEditarPlacar && (
                  <>
                    Informe o placar final do jogo entre{" "}
                    <strong>{modalEditarPlacar.time_casa}</strong> x{" "}
                    <strong>{modalEditarPlacar.time_visitante}</strong>. Os pontos dos palpites serão calculados automaticamente.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSalvarPlacarECalcular}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="placar_casa">
                    Placar {modalEditarPlacar?.time_casa} *
                  </Label>
                  <Input
                    id="placar_casa"
                    type="number"
                    min="0"
                    value={editarPlacarForm.placar_casa}
                    onChange={(e) =>
                      setEditarPlacarForm({ ...editarPlacarForm, placar_casa: e.target.value })
                    }
                    required
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placar_visitante">
                    Placar {modalEditarPlacar?.time_visitante} *
                  </Label>
                  <Input
                    id="placar_visitante"
                    type="number"
                    min="0"
                    value={editarPlacarForm.placar_visitante}
                    onChange={(e) =>
                      setEditarPlacarForm({ ...editarPlacarForm, placar_visitante: e.target.value })
                    }
                    required
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalEditarPlacar(null)}
                  disabled={finalizarJogoECalcular.isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={finalizarJogoECalcular.isLoading}>
                  {finalizarJogoECalcular.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    <>
                      <Trophy className="mr-2 h-4 w-4" />
                      Salvar Placar e Calcular
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Editar Jogo */}
        <Dialog open={!!modalEditarJogo} onOpenChange={(open) => !open && setModalEditarJogo(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Jogo</DialogTitle>
              <DialogDescription>
                Edite as informações do jogo ou remova-o.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditarJogo}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_time_casa">Time Mandante *</Label>
                  <Select
                    value={editarJogoForm.time_casa}
                    onValueChange={(value) =>
                      setEditarJogoForm({ ...editarJogoForm, time_casa: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o time mandante" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMES.filter((t) => t.slug !== editarJogoForm.time_visitante).map((team) => (
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
                  <Label htmlFor="edit_time_visitante">Time Visitante *</Label>
                  <Select
                    value={editarJogoForm.time_visitante}
                    onValueChange={(value) =>
                      setEditarJogoForm({ ...editarJogoForm, time_visitante: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o time visitante" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMES.filter((t) => t.slug !== editarJogoForm.time_casa).map((team) => (
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
                  <Label htmlFor="edit_data_jogo">Data e Hora do Jogo</Label>
                  <Input
                    id="edit_data_jogo"
                    type="datetime-local"
                    value={editarJogoForm.data_jogo}
                    onChange={(e) =>
                      setEditarJogoForm({ ...editarJogoForm, data_jogo: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_status">Status</Label>
                  <Select
                    value={editarJogoForm.status}
                    onValueChange={(value) =>
                      setEditarJogoForm({ ...editarJogoForm, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="ao_vivo">Ao vivo</SelectItem>
                      <SelectItem value="finalizado">Finalizado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeletarJogo}
                  disabled={deleteJogo.isLoading}
                >
                  {deleteJogo.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removendo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover Jogo
                    </>
                  )}
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalEditarJogo(null)}
                    disabled={updateJogo.isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateJogo.isLoading}>
                    {updateJogo.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
