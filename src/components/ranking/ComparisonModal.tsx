import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Award } from "lucide-react";

interface ComparisonData {
  user_id: string;
  nickname: string;
  total_pontos: number;
  acertos_resultado: number;
  acertos_placar: number;
  total_palpites: number;
}

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ComparisonData | null;
  targetUser: ComparisonData | null;
}

export function ComparisonModal({ isOpen, onClose, currentUser, targetUser }: ComparisonModalProps) {
  // Não renderiza o Dialog se não houver dados, mas permite o controle do estado isOpen
  if (!isOpen || !currentUser || !targetUser) {
    return null;
  }

  // Calcular taxa de acerto
  const currentAccuracy = currentUser.total_palpites > 0 
    ? Math.round((currentUser.acertos_resultado / currentUser.total_palpites) * 100)
    : 0;
  
  const targetAccuracy = targetUser.total_palpites > 0 
    ? Math.round((targetUser.acertos_resultado / targetUser.total_palpites) * 100)
    : 0;

  // Função para determinar a cor baseada na comparação
  const getMetricColor = (currentValue: number, targetValue: number, isHigherBetter: boolean = true) => {
    if (isHigherBetter) {
      if (currentValue > targetValue) return { current: "text-green-500 font-bold", target: "text-muted-foreground" };
      if (currentValue < targetValue) return { current: "text-muted-foreground", target: "text-green-500 font-bold" };
    } else {
      if (currentValue < targetValue) return { current: "text-green-500 font-bold", target: "text-muted-foreground" };
      if (currentValue > targetValue) return { current: "text-muted-foreground", target: "text-green-500 font-bold" };
    }
    return { current: "text-foreground", target: "text-foreground" };
  };

  const pointsColors = getMetricColor(currentUser.total_pontos, targetUser.total_pontos);
  const hitsColors = getMetricColor(currentUser.acertos_resultado, targetUser.acertos_resultado);
  const exactColors = getMetricColor(currentUser.acertos_placar, targetUser.acertos_placar);
  const accuracyColors = getMetricColor(currentAccuracy, targetAccuracy);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">⚔️ Comparação 1x1</DialogTitle>
          <DialogDescription>
            Comparação de desempenho entre @{currentUser.nickname} e @{targetUser.nickname}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Métrica: Pontos Totais */}
          <div className="grid grid-cols-3 gap-4 items-center rounded-lg border p-4 bg-muted/30">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Você</span>
              <Badge className={`text-lg px-3 py-1 ${pointsColors.current.includes('green') ? 'bg-green-600' : 'bg-muted'}`}>
                <TrendingUp className="h-4 w-4 mr-2" />
                {currentUser.total_pontos ?? 0}
              </Badge>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Pontos</span>
              <Badge variant="outline" className="text-lg">⭐</Badge>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">{targetUser.nickname}</span>
              <Badge className={`text-lg px-3 py-1 ${pointsColors.target.includes('green') ? 'bg-green-600' : 'bg-muted'}`}>
                <TrendingUp className="h-4 w-4 mr-2" />
                {targetUser.total_pontos ?? 0}
              </Badge>
            </div>
          </div>

          {/* Métrica: Acertos (Resultado) */}
          <div className="grid grid-cols-3 gap-4 items-center rounded-lg border p-4 bg-muted/30">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Você</span>
              <Badge className={`text-lg px-3 py-1 ${hitsColors.current.includes('green') ? 'bg-green-600' : 'bg-muted'}`}>
                <Target className="h-4 w-4 mr-2" />
                {currentUser.acertos_resultado ?? 0}
              </Badge>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Acertos</span>
              <Badge variant="outline" className="text-lg">🎯</Badge>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">{targetUser.nickname}</span>
              <Badge className={`text-lg px-3 py-1 ${hitsColors.target.includes('green') ? 'bg-green-600' : 'bg-muted'}`}>
                <Target className="h-4 w-4 mr-2" />
                {targetUser.acertos_resultado ?? 0}
              </Badge>
            </div>
          </div>

          {/* Métrica: Cravadas (Placar Exato) */}
          <div className="grid grid-cols-3 gap-4 items-center rounded-lg border p-4 bg-muted/30">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Você</span>
              <Badge className={`text-lg px-3 py-1 ${exactColors.current.includes('green') ? 'bg-yellow-600' : 'bg-muted'}`}>
                <Award className="h-4 w-4 mr-2" />
                {currentUser.acertos_placar ?? 0}
              </Badge>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Cravadas</span>
              <Badge variant="outline" className="text-lg">🏆</Badge>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">{targetUser.nickname}</span>
              <Badge className={`text-lg px-3 py-1 ${exactColors.target.includes('green') ? 'bg-yellow-600' : 'bg-muted'}`}>
                <Award className="h-4 w-4 mr-2" />
                {targetUser.acertos_placar ?? 0}
              </Badge>
            </div>
          </div>

          {/* Métrica: Taxa de Acerto */}
          <div className="grid grid-cols-3 gap-4 items-center rounded-lg border p-4 bg-muted/30">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Você</span>
              <Badge className={`text-lg px-3 py-1 ${accuracyColors.current.includes('green') ? 'bg-blue-600' : 'bg-muted'}`}>
                {currentAccuracy ?? 0}%
              </Badge>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Taxa</span>
              <Badge variant="outline" className="text-lg">📊</Badge>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">{targetUser.nickname}</span>
              <Badge className={`text-lg px-3 py-1 ${accuracyColors.target.includes('green') ? 'bg-blue-600' : 'bg-muted'}`}>
                {targetAccuracy ?? 0}%
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
