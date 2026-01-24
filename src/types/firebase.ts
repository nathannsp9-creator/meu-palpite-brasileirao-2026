// Firebase types matching your database schema
export type AppRole = 'user' | 'admin';

export type GameStatus = 'agendado' | 'ao_vivo' | 'finalizado' | 'cancelado';

export type RodadaStatus = 'em_andamento' | 'finalizada' | 'aguardando';

export interface Profile {
  id: string;
  nome: string;
  nickname: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: Date;
}

export interface Rodada {
  id: string;
  numero: number;
  status: RodadaStatus;
  data_inicio: Date;
  data_fechamento: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Jogo {
  id: string;
  rodada_id: string;
  rodada_numero?: number;
  time_casa: string;
  time_visitante: string;
  data_jogo: Date;
  placar_casa: number | null;
  placar_visitante: number | null;
  status: GameStatus;
  logo_casa: string | null;
  logo_visitante: string | null;
  api_fixture_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Palpite {
  id: string;
  usuario_id: string;
  jogo_id: string;
  rodada_id: string;
  palpite_casa: number;
  palpite_visitante: number;
  pontos_obtidos: number | null;
  status: 'pendente' | 'calculado';
  created_at: Date;
  updated_at: Date;
}

export interface RankingEntry {
  user_id: string;
  nickname: string;
  total_pontos: number;
  total_palpites: number;
  acertos_resultado: number;
  acertos_placar: number;
}
