import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Save } from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const [novoJogo, setNovoJogo] = useState({
    timeCasa: "",
    timeVisitante: "",
    data: "",
    hora: "",
    rodada: "15",
  });

  const [resultado, setResultado] = useState({
    jogoId: "",
    placarCasa: "",
    placarVisitante: "",
  });

  // Mock data
  const jogosPendentes = [
    { id: 1, casa: "Flamengo", visitante: "Palmeiras", data: "20/05/2024 16:00", rodada: 15 },
    { id: 2, casa: "São Paulo", visitante: "Corinthians", data: "20/05/2024 18:30", rodada: 15 },
    { id: 3, casa: "Grêmio", visitante: "Internacional", data: "20/05/2024 20:00", rodada: 15 },
  ];

  const handleCadastrarJogo = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Jogo cadastrado com sucesso!");
    setNovoJogo({
      timeCasa: "",
      timeVisitante: "",
      data: "",
      hora: "",
      rodada: "15",
    });
  };

  const handleInserirResultado = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Resultado inserido com sucesso!");
    setResultado({
      jogoId: "",
      placarCasa: "",
      placarVisitante: "",
    });
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
            <p className="text-muted-foreground">Gerencie jogos e resultados do bolão</p>
          </div>
        </div>

        <Tabs defaultValue="cadastrar" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="cadastrar">Cadastrar Jogos</TabsTrigger>
            <TabsTrigger value="resultados">Inserir Resultados</TabsTrigger>
          </TabsList>

          {/* Cadastrar Jogos */}
          <TabsContent value="cadastrar" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Cadastrar Novo Jogo
                </CardTitle>
                <CardDescription>
                  Adicione um novo jogo ao calendário do campeonato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCadastrarJogo} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="timeCasa">Time Mandante</Label>
                      <Input
                        id="timeCasa"
                        placeholder="Ex: Flamengo"
                        value={novoJogo.timeCasa}
                        onChange={(e) =>
                          setNovoJogo({ ...novoJogo, timeCasa: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeVisitante">Time Visitante</Label>
                      <Input
                        id="timeVisitante"
                        placeholder="Ex: Palmeiras"
                        value={novoJogo.timeVisitante}
                        onChange={(e) =>
                          setNovoJogo({ ...novoJogo, timeVisitante: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="rodada">Rodada</Label>
                      <Input
                        id="rodada"
                        type="number"
                        min="1"
                        max="38"
                        placeholder="15"
                        value={novoJogo.rodada}
                        onChange={(e) =>
                          setNovoJogo({ ...novoJogo, rodada: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data">Data</Label>
                      <Input
                        id="data"
                        type="date"
                        value={novoJogo.data}
                        onChange={(e) =>
                          setNovoJogo({ ...novoJogo, data: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hora">Horário</Label>
                      <Input
                        id="hora"
                        type="time"
                        value={novoJogo.hora}
                        onChange={(e) =>
                          setNovoJogo({ ...novoJogo, hora: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Jogo
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inserir Resultados */}
          <TabsContent value="resultados" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Inserir Resultado
                </CardTitle>
                <CardDescription>
                  Registre o resultado final dos jogos realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInserirResultado} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="jogo">Selecionar Jogo</Label>
                    <select
                      id="jogo"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={resultado.jogoId}
                      onChange={(e) =>
                        setResultado({ ...resultado, jogoId: e.target.value })
                      }
                      required
                    >
                      <option value="">Escolha um jogo...</option>
                      {jogosPendentes.map((jogo) => (
                        <option key={jogo.id} value={jogo.id}>
                          {jogo.casa} vs {jogo.visitante} - {jogo.data}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="placarCasa">Placar Mandante</Label>
                      <Input
                        id="placarCasa"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={resultado.placarCasa}
                        onChange={(e) =>
                          setResultado({ ...resultado, placarCasa: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="placarVisitante">Placar Visitante</Label>
                      <Input
                        id="placarVisitante"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={resultado.placarVisitante}
                        onChange={(e) =>
                          setResultado({
                            ...resultado,
                            placarVisitante: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Resultado
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Lista de Jogos Pendentes */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Jogos Pendentes de Resultado</CardTitle>
                <CardDescription>
                  Jogos que ainda precisam ter o resultado cadastrado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jogosPendentes.map((jogo) => (
                    <div
                      key={jogo.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-4"
                    >
                      <div className="flex-1">
                        <div className="font-semibold">
                          {jogo.casa} vs {jogo.visitante}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {jogo.data}
                        </div>
                      </div>
                      <Badge variant="outline">Rodada {jogo.rodada}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
