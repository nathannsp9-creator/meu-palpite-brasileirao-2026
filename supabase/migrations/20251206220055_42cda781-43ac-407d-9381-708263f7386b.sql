-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for game status
CREATE TYPE public.game_status AS ENUM ('agendado', 'ao_vivo', 'finalizado');

-- Create enum for round status
CREATE TYPE public.round_status AS ENUM ('futura', 'em_andamento', 'finalizada');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL UNIQUE,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create rounds table
CREATE TABLE public.rodadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL UNIQUE,
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE,
  status round_status DEFAULT 'futura' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create games table
CREATE TABLE public.jogos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rodada_id UUID REFERENCES public.rodadas(id) ON DELETE CASCADE NOT NULL,
  time_casa VARCHAR(100) NOT NULL,
  time_visitante VARCHAR(100) NOT NULL,
  logo_casa VARCHAR(500),
  logo_visitante VARCHAR(500),
  data_jogo TIMESTAMP WITH TIME ZONE NOT NULL,
  placar_casa INTEGER,
  placar_visitante INTEGER,
  status game_status DEFAULT 'agendado' NOT NULL,
  api_fixture_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create predictions table
CREATE TABLE public.palpites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  jogo_id UUID REFERENCES public.jogos(id) ON DELETE CASCADE NOT NULL,
  palpite_casa INTEGER NOT NULL CHECK (palpite_casa >= 0),
  palpite_visitante INTEGER NOT NULL CHECK (palpite_visitante >= 0),
  pontos_obtidos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (usuario_id, jogo_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rodadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palpites ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles (only admins can manage)
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" 
ON public.user_roles FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" 
ON public.user_roles FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" 
ON public.user_roles FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for rounds
CREATE POLICY "Rounds are viewable by everyone" 
ON public.rodadas FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage rounds" 
ON public.rodadas FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for games
CREATE POLICY "Games are viewable by everyone" 
ON public.jogos FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage games" 
ON public.jogos FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for predictions
CREATE POLICY "Users can view their own predictions" 
ON public.palpites FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can view predictions after game starts" 
ON public.palpites FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.jogos 
    WHERE jogos.id = palpites.jogo_id 
    AND jogos.data_jogo <= NOW()
  )
);

CREATE POLICY "Users can insert their own predictions" 
ON public.palpites FOR INSERT 
WITH CHECK (
  auth.uid() = usuario_id 
  AND EXISTS (
    SELECT 1 FROM public.jogos 
    WHERE jogos.id = jogo_id 
    AND jogos.data_jogo > NOW() + INTERVAL '1 minute'
  )
);

CREATE POLICY "Users can update their own predictions before game" 
ON public.palpites FOR UPDATE 
USING (
  auth.uid() = usuario_id 
  AND EXISTS (
    SELECT 1 FROM public.jogos 
    WHERE jogos.id = jogo_id 
    AND jogos.data_jogo > NOW() + INTERVAL '1 minute'
  )
);

CREATE POLICY "Admins can manage all predictions" 
ON public.palpites FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, nickname)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'nome', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data ->> 'nickname', 'user_' || LEFT(NEW.id::text, 8))
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jogos_updated_at
  BEFORE UPDATE ON public.jogos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_palpites_updated_at
  BEFORE UPDATE ON public.palpites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate points for a prediction
CREATE OR REPLACE FUNCTION public.calcular_pontos(
  palpite_casa INTEGER,
  palpite_visitante INTEGER,
  placar_casa INTEGER,
  placar_visitante INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  pontos INTEGER := 0;
  resultado_real VARCHAR(10);
  resultado_palpite VARCHAR(10);
BEGIN
  -- Determine real result
  IF placar_casa > placar_visitante THEN
    resultado_real := 'casa';
  ELSIF placar_visitante > placar_casa THEN
    resultado_real := 'visitante';
  ELSE
    resultado_real := 'empate';
  END IF;
  
  -- Determine predicted result
  IF palpite_casa > palpite_visitante THEN
    resultado_palpite := 'casa';
  ELSIF palpite_visitante > palpite_casa THEN
    resultado_palpite := 'visitante';
  ELSE
    resultado_palpite := 'empate';
  END IF;
  
  -- Calculate points
  IF resultado_real = resultado_palpite THEN
    pontos := 3; -- Correct result
    
    IF palpite_casa = placar_casa AND palpite_visitante = placar_visitante THEN
      pontos := pontos + 2; -- Exact score bonus
    END IF;
  END IF;
  
  RETURN pontos;
END;
$$;

-- Function to update points when game results are entered
CREATE OR REPLACE FUNCTION public.atualizar_pontos_jogo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.placar_casa IS NOT NULL AND NEW.placar_visitante IS NOT NULL THEN
    UPDATE public.palpites
    SET pontos_obtidos = public.calcular_pontos(
      palpite_casa, 
      palpite_visitante, 
      NEW.placar_casa, 
      NEW.placar_visitante
    )
    WHERE jogo_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update points when game result is updated
CREATE TRIGGER on_game_result_updated
  AFTER UPDATE OF placar_casa, placar_visitante ON public.jogos
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_pontos_jogo();