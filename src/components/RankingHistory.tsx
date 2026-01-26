import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Target, TrendingUp } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface RankingHistoryProps {
  userId: string;
  nickname: string;
  isOpen: boolean;
  onClose: () => void;
}

interface RodadaStats {
  rodada_numero: number;
  total_pontos: number;
  total_palpites: number;
  acertos_placar: number;
  acertos_resultado: number;
}

export function RankingHistory({ userId, nickname, isOpen, onClose }: RankingHistoryProps) {
  const { data: historico, isLoading } = useQuery({
    queryKey: ["ranking-history", userId],
    queryFn: async (): Promise<RodadaStats[]> => {
      const palpitesRef = collection(db, "palpites");
      const q = query(palpitesRef, where("usuario_id", "==", userId));
      const snapshot = await getDocs(q);

      const rodadasMap = new Map<string, RodadaStats>();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const rodadaId = data.rodada_id;

        if (!rodadasMap.has(rodadaId)) {
          rodadasMap.set(rodadaId, {
            rodada_numero: 0,
            total_pontos: 0,
            total_palpites: 0,
            acertos_placar: 0,
            acertos_resultado: 0,
          });
        }

        const stats = rodadasMap.get(rodadaId)!;
        stats.total_palpites++;

        if (data.pontos_obtidos !== null && data.pontos_obtidos !== undefined) {
          stats.total_pontos += data.pontos_obtidos;

          if (data.pontos_obtidos === 5) {
            stats.acertos_placar++;
            stats.acertos_resultado++;
          } else if (data.pontos_obtidos === 3) {
            stats.acertos_resultado++;
          }
        }
      });

      const rodasRef = collection(db, "rodadas");
      const rodasSnapshot = await getDocs(rodasRef);
      const rodadaNumeros = new Map<string, number>();

      rodasSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        rodadaNumeros.set(doc.id, data.numero);
      });

      const historico = Array.from(rodadasMap.entries()).map(([rodadaId, stats]) => ({
        ...stats,
        rodada_numero: rodadaNumeros.get(rodadaId) || 0,
      }));

      return historico.sort((a, b) => a.rodada_numero - b.rodada_numero);
    },
    enabled: isOpen && !!userId,
    staleTime: 2 * 60 * 1000,
  });

  const totalGeral = historico?.reduce((acc, r) => acc + r.total_pontos, 0) || 0;
  const mediaRodada = historico && historico.length > 0 
    ? (totalGeral / historico.length).toFixed(1) 
    : "0";
  const melhorRodada = historico?.reduce((max, r) => (r.total_pontos > max.total_pontos ? r : max), historico[0]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Histórico de @{nickname}
          </SheetTitle>
          <SheetDescription>Desempenho detalhado por rodada</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !historico || historico.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum palpite registrado ainda</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Total</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{totalGeral}</div>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Média</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-secondary">{mediaRodada}</div>
                    <p className="text-xs text-muted-foreground">pts/rodada</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Melhor</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent">{melhorRodada?.total_pontos || 0}</div>
                    <p className="text-xs text-muted-foreground">R{melhorRodada?.rodada_numero || "-"}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">Rodadas Disputadas</h3>
                {historico.map((rodada) => (
                  <Card key={rodada.rodada_numero} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="h-10 w-10 rounded-full flex items-center justify-center font-bold">
                            {rodada.rodada_numero}
                          </Badge>
                          <div>
                            <div className="font-semibold">Rodada {rodada.rodada_numero}</div>
                            <div className="text-xs text-muted-foreground">
                              {rodada.total_palpites} palpite(s)
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {rodada.total_pontos}
                          </div>
                          <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground">
                            <Trophy className="h-3 w-3 text-yellow-500" />
                            {rodada.acertos_placar}
                            <Target className="h-3 w-3 ml-1" />
                            {rodada.acertos_resultado}
                          </div>
                        </div>
                      </div>

                      {rodada.total_pontos === melhorRodada?.total_pontos && rodada.total_pontos > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <Badge variant="default" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Melhor Rodada
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
