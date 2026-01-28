import { useMemo, useRef, useLayoutEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { useRankingHistory } from "@/hooks/useRankingHistory";
import { Loader2, Maximize2, X } from "lucide-react";

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

// Neon Ring Dot - Anel elegante para cada rodada
const RingDot = (props: any) => {
  const { cx, cy, fill, stroke } = props;
  if (!cx || !cy) return null;
  
  const color = stroke || fill;
  
  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={4} 
      fill="#0f172a"
      stroke={color}
      strokeWidth={2}
      opacity={0.9}
    />
  );
};

// Halo Effect para activeDot (apenas no hover)
const HaloDot = (props: any) => {
  const { cx, cy, fill, stroke } = props;
  if (!cx || !cy) return null;
  
  const color = stroke || fill;
  
  return (
    <g filter="url(#glow)">
      {/* Halo externo grande - transparente */}
      <circle 
        cx={cx} 
        cy={cy} 
        r={14} 
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={0.6}
      />
      {/* Halo médio */}
      <circle 
        cx={cx} 
        cy={cy} 
        r={10} 
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        opacity={0.8}
      />
      {/* Centro brilhante */}
      <circle 
        cx={cx} 
        cy={cy} 
        r={5} 
        fill={color}
        opacity={0.9}
      />
    </g>
  );
};

// Custom Tooltip com glassmorphism minimalista
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-white/5 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-xl">
        <p className="mb-2 font-semibold text-white text-xs tracking-widest uppercase opacity-70">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ 
                  backgroundColor: entry.color,
                  boxShadow: `0 0 6px ${entry.color}`
                }}
              />
              <span style={{ color: entry.color }} className="text-xs font-medium">
                {entry.name}
              </span>
              <span className="text-gray-400 text-xs ml-auto">
                {entry.value}º
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Defs com filtros suaves e modernos
const GlowDefs = () => (
  <defs>
    {/* Glow suave e difuso para as linhas */}
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

export function RankingEvolutionChart({ data }: RankingEvolutionChartProps) {
  const { data: realData, isLoading, userColors } = useRankingHistory();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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
    <>
      <Card className="shadow-card border-primary/20 bg-background/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex-1">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            Evolução do Ranking
          </CardTitle>
          <CardDescription>Acompanhe como as posições mudaram ao longo das rodadas</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFullscreen(true)}
          className="ml-2"
          title="Ver em tela cheia"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
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

                  {/* Grid ultra-minimalista - quase invisível */}
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#444444"
                    strokeOpacity={0.15}
                    vertical={false}
                  />

                  {/* Eixo X - Rodadas (minimalista) */}
                  <XAxis
                    dataKey="rodada"
                    stroke="#555555"
                    style={{ fontSize: "0.75rem", fontWeight: 400, fill: "#888888" }}
                    tickLine={{ stroke: "#444444", strokeOpacity: 0.3 }}
                  />

                  {/* Eixo Y - Posição (Invertido: 1 no TOPO, minimalista) */}
                  <YAxis
                    reversed={true}
                    stroke="#555555"
                    style={{ fontSize: "0.75rem", fontWeight: 400, fill: "#888888" }}
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
                      style: { fill: "#888888", fontSize: "0.75rem", fontWeight: 400 },
                    }}
                    tickLine={{ stroke: "#444444", strokeOpacity: 0.3 }}
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

                  {/* Linhas para cada usuário - com neon rings */}
                  {usuarios.map((usuario) => {
                    const color = getColorForUser(usuario, usuarios, userColors);
                    return (
                      <Line
                        key={usuario}
                        type="monotone"
                        dataKey={usuario}
                        stroke={color}
                        strokeWidth={2.5}
                        dot={<RingDot stroke={color} fill={color} />}
                        activeDot={<HaloDot fill={color} stroke={color} />}
                        isAnimationActive={true}
                        name={usuario}
                        style={{
                          filter: `drop-shadow(0px 0px 6px ${color}a0)`,
                        }}
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

    {/* Modal Fullscreen */}
    {isFullscreen && (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-primary/10 bg-background/50 px-4 py-3 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-bold">📈 Evolução do Ranking - Tela Cheia</h2>
            <p className="text-xs text-muted-foreground">Arraste para o lado ou gire a tela para visualizar melhor</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(false)}
            className="ml-4"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Conteúdo do Modal - Gráfico em altura maior */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="w-full overflow-x-auto overflow-y-hidden pb-4 h-full" ref={scrollContainerRef}>
            <div style={{ width: chartWidth }} className="min-w-full">
              <div className="h-[70vh]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                  >
                    <GlowDefs />

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#444444"
                      strokeOpacity={0.15}
                      vertical={false}
                    />

                    <XAxis
                      dataKey="rodada"
                      stroke="#555555"
                      style={{ fontSize: "0.75rem", fontWeight: 400, fill: "#888888" }}
                      tickLine={{ stroke: "#444444", strokeOpacity: 0.3 }}
                    />

                    <YAxis
                      reversed={true}
                      stroke="#555555"
                      style={{ fontSize: "0.75rem", fontWeight: 400, fill: "#888888" }}
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
                        style: { fill: "#888888", fontSize: "0.75rem", fontWeight: 400 },
                      }}
                      tickLine={{ stroke: "#444444", strokeOpacity: 0.3 }}
                    />

                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: "rgba(59, 130, 246, 0.2)", strokeWidth: 2 }}
                    />

                    <Legend
                      wrapperStyle={{ paddingTop: "20px" }}
                      iconType="line"
                      textAnchor="middle"
                    />

                    {usuarios.map((usuario) => {
                      const color = getColorForUser(usuario, usuarios, userColors);
                      return (
                        <Line
                          key={usuario}
                          type="monotone"
                          dataKey={usuario}
                          stroke={color}
                          strokeWidth={2.5}
                          dot={<RingDot stroke={color} fill={color} />}
                          activeDot={<HaloDot fill={color} stroke={color} />}
                          isAnimationActive={true}
                          name={usuario}
                          style={{
                            filter: `drop-shadow(0px 0px 6px ${color}a0)`,
                          }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
