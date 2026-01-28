import { useMemo, useRef, useLayoutEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRankingHistory } from "@/hooks/useRankingHistory";
import { Loader2 } from "lucide-react";

// Dados mockados para fallback inicial
const MOCK_DATA = [
  { rodada: "R1", Miguel: 1, Nathan: 3, Carlos: 2, Ana: 5, Pedro: 4 },
  { rodada: "R2", Miguel: 2, Nathan: 1, Carlos: 3, Ana: 4, Pedro: 5 },
  { rodada: "R3", Miguel: 1, Nathan: 2, Carlos: 4, Ana: 3, Pedro: 5 },
  { rodada: "R4", Miguel: 3, Nathan: 1, Carlos: 2, Ana: 5, Pedro: 4 },
  { rodada: "R5", Miguel: 2, Nathan: 3, Carlos: 1, Ana: 4, Pedro: 5 },
];

interface RankingEvolutionChartProps {
  data?: Array<Record<string, string | number>>;
}

// Paleta de cores vibrantes e distintas
const COLOR_PALETTE = [
  "#10B981", // Verde Neon
  "#3B82F6", // Azul
  "#F59E0B", // Laranja
  "#EC4899", // Rosa
  "#8B5CF6", // Roxo
  "#06B6D4", // Cyan
  "#EF4444", // Vermelho
  "#14B8A6", // Teal
  "#D97706", // Âmbar
  "#7C3AED", // Violeta
];

// Mapeamento de cores por usuário (consistente)
const getColorForUser = (userName: string, allUsers: string[], userColorsMap?: Record<string, string>): string => {
  // Se temos mapa de cores real, usar
  if (userColorsMap && userColorsMap[userName]) {
    return userColorsMap[userName];
  }
  // Fallback: usar índice no array
  const index = allUsers.indexOf(userName);
  return index >= 0 ? COLOR_PALETTE[index % COLOR_PALETTE.length] : "#6B7280";
};

// Custom Dot com efeito visual
const CustomDot = (props: any) => {
  const { cx, cy, fill } = props;
  return (
    <g>
      {/* Aura/Glow */}
      <circle cx={cx} cy={cy} r={8} fill={fill} opacity={0.15} />
      {/* Ponto principal com borda */}
      <circle cx={cx} cy={cy} r={5} fill={fill} stroke="white" strokeWidth={1.5} />
    </g>
  );
};

// Custom Tooltip com estilo dark e vibrante
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-primary/40 bg-background/98 p-4 shadow-2xl backdrop-blur-sm">
        <p className="mb-2 font-bold text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span style={{ color: entry.color }} className="font-semibold">
              {entry.name}:
            </span>
            <span className="text-foreground">{entry.value}º lugar</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Definir filtro de glow para o SVG
const GlowDefs = () => (
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

export function RankingEvolutionChart({ data }: RankingEvolutionChartProps) {
  const { data: realData, isLoading, userColors } = useRankingHistory();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Usar dados reais se disponíveis, caso contrário usar mock
  const chartData = data || realData || MOCK_DATA;

  // Calcular largura dinâmica do gráfico
  const chartWidth = useMemo(() => {
    return Math.max(typeof window !== 'undefined' ? window.innerWidth : 800, chartData.length * 80);
  }, [chartData.length]);

  // Extrair nomes dos usuários (todas as colunas exceto 'rodada' e 'numero')
  const usuarios = useMemo(() => {
    if (chartData.length === 0) return [];
    const firstRow = chartData[0];
    return Object.keys(firstRow).filter((key) => key !== "rodada" && key !== "numero");
  }, [chartData]);

  // Rolar para a direita (última rodada) quando o gráfico carregar
  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      // Aguardar um frame para garantir que o layout foi calculado
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          container.scrollLeft = container.scrollWidth - container.clientWidth;
        }
      });
    }
  }, [chartData.length]);

  // Se está carregando dados reais
  if (isLoading && realData.length === 0) {
    return (
      <Card className="shadow-card border-primary/20 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            Evolução do Ranking
          </CardTitle>
          <CardDescription>Acompanhe como as posições mudaram ao longo das rodadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se não houver dados suficientes, não renderizar
  if (chartData.length < 2) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>📈 Evolução do Ranking</CardTitle>
          <CardDescription>Acompanhe como as posições mudaram ao longo das rodadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            Dados insuficientes para renderizar o gráfico
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-primary/20 bg-background/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📈</span>
          Evolução do Ranking
        </CardTitle>
        <CardDescription>Acompanhe como as posições mudaram ao longo das rodadas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto overflow-y-hidden pb-4" ref={scrollContainerRef}>
          <div style={{ width: chartWidth }} className="min-w-full">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  {/* SVG Defs para efeitos */}
                  <GlowDefs />

                  {/* Grid com estilo moderno */}
                  <CartesianGrid
                    strokeDasharray="5 5"
                    stroke="#374151"
                    opacity={0.2}
                    vertical={false}
                  />

                  {/* Eixo X - Rodadas */}
                  <XAxis
                    dataKey="rodada"
                    stroke="#6B7280"
                    style={{ fontSize: "0.875rem", fontWeight: 500 }}
                    tickLine={{ stroke: "#4B5563" }}
                  />

                  {/* Eixo Y - Posição (Invertido: 1 no TOPO) */}
                  <YAxis
                    reversed={true}
                    stroke="#6B7280"
                    style={{ fontSize: "0.875rem", fontWeight: 500 }}
                    ticks={Array.from({ length: Math.max(...chartData.flatMap((row) =>
                      usuarios.map((user) => (typeof row[user] === "number" ? row[user] : 0))
                    )) }, (_, i) => i + 1)}
                    domain={[Math.max(...chartData.flatMap((row) =>
                      usuarios.map((user) => (typeof row[user] === "number" ? row[user] : 0))
                    )), 1]}
                    label={{
                      value: "Posição",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                      style: { fill: "#9CA3AF" },
                    }}
                    tickLine={{ stroke: "#4B5563" }}
                  />

                  {/* Tooltip customizado */}
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: "rgba(59, 130, 246, 0.2)", strokeWidth: 2 }}
                  />

                  {/* Legenda */}
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="line"
                    textAnchor="middle"
                  />

                  {/* Linhas para cada usuário com efeito glow */}
                  {usuarios.map((usuario) => {
                    const color = getColorForUser(usuario, usuarios, userColors);
                    return (
                      <Line
                        key={usuario}
                        type="monotone"
                        dataKey={usuario}
                        stroke={color}
                        strokeWidth={3}
                        dot={<CustomDot fill={color} />}
                        activeDot={{ r: 7, filter: "url(#glow)" }}
                        isAnimationActive={true}
                        name={usuario}
                        filter="url(#glow)"
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Legenda de cores */}
        <div className="mt-6 grid gap-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Legenda de Usuários
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {usuarios.map((usuario) => {
              const color = getColorForUser(usuario, usuarios, userColors);
              return (
                <div key={usuario} className="flex items-center gap-2 rounded-lg bg-muted/40 p-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-medium text-foreground">{usuario}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
