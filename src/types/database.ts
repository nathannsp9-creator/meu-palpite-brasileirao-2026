export type AppRole = 'admin' | 'user';
export type GameStatus = 'agendado' | 'ao_vivo' | 'finalizado';
export type RoundStatus = 'futura' | 'em_andamento' | 'finalizada';

export interface Profile {
  id: string;
  nome: string;
  nickname: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Rodada {
  id: string;
  numero: number;
  data_inicio: string | null;
  data_fim: string | null;
  status: RoundStatus;
  created_at: string;
}

export interface Jogo {
  id: string;
  rodada_id: string;
  time_casa: string;
  time_visitante: string;
  logo_casa: string | null;
  logo_visitante: string | null;
  data_jogo: string;
  placar_casa: number | null;
  placar_visitante: number | null;
  status: GameStatus;
  api_fixture_id: number | null;
  created_at: string;
  updated_at: string;
  rodada?: Rodada;
}

export interface Palpite {
  id: string;
  usuario_id: string;
  jogo_id: string;
  palpite_casa: number;
  palpite_visitante: number;
  pontos_obtidos: number | null;
  created_at: string;
  updated_at: string;
  jogo?: Jogo;
  profile?: Profile;
}

export interface RankingUser {
  user_id: string;
  nickname: string;
  nome: string;
  avatar_url: string | null;
  total_pontos: number;
  total_acertos_resultado: number;
  total_acertos_placar: number;
  total_jogos: number;
}
