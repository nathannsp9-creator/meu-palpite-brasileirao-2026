-- Fix function search_path for calcular_pontos
CREATE OR REPLACE FUNCTION public.calcular_pontos(
  palpite_casa INTEGER,
  palpite_visitante INTEGER,
  placar_casa INTEGER,
  placar_visitante INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  pontos INTEGER := 0;
  resultado_real VARCHAR(10);
  resultado_palpite VARCHAR(10);
BEGIN
  IF placar_casa > placar_visitante THEN
    resultado_real := 'casa';
  ELSIF placar_visitante > placar_casa THEN
    resultado_real := 'visitante';
  ELSE
    resultado_real := 'empate';
  END IF;
  
  IF palpite_casa > palpite_visitante THEN
    resultado_palpite := 'casa';
  ELSIF palpite_visitante > palpite_casa THEN
    resultado_palpite := 'visitante';
  ELSE
    resultado_palpite := 'empate';
  END IF;
  
  IF resultado_real = resultado_palpite THEN
    pontos := 3;
    IF palpite_casa = placar_casa AND palpite_visitante = placar_visitante THEN
      pontos := pontos + 2;
    END IF;
  END IF;
  
  RETURN pontos;
END;
$$;