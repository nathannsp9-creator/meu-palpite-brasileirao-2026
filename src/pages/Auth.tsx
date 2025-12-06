import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const signUpSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  nickname: z.string().min(3, "Apelido deve ter pelo menos 3 caracteres").max(20, "Apelido deve ter no máximo 20 caracteres").regex(/^[a-zA-Z0-9_]+$/, "Apelido só pode conter letras, números e _"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").regex(/[a-zA-Z]/, "Senha deve conter pelo menos uma letra").regex(/[0-9]/, "Senha deve conter pelo menos um número"),
  confirmarSenha: z.string()
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    nome: "",
    nickname: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user, loading } = useAuth();

  const from = (location.state as any)?.from?.pathname || "/";

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  const validateForm = () => {
    setErrors({});
    try {
      if (isLogin) {
        signInSchema.parse({ email: formData.email, senha: formData.senha });
      } else {
        signUpSchema.parse(formData);
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.senha);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email ou senha incorretos");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Login realizado com sucesso!");
      } else {
        const { error } = await signUp(formData.email, formData.senha, formData.nome, formData.nickname);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Este email já está cadastrado");
          } else if (error.message.includes("duplicate key value violates unique constraint")) {
            toast.error("Este apelido já está em uso. Escolha outro.");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Cadastro realizado com sucesso!");
      }
    } catch (error: any) {
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error("Digite seu email primeiro");
      return;
    }
    
    toast.info("Funcionalidade de recuperação de senha em breve!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-brasil">
        <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-brasil p-4">
      <Card className="w-full max-w-md shadow-hover">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Trophy className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Bolão Brasileirão</CardTitle>
            <CardDescription>
              {isLogin
                ? "Entre com sua conta para fazer seus palpites"
                : "Crie sua conta e participe do bolão"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    className={errors.nome ? "border-destructive" : ""}
                    disabled={isLoading}
                  />
                  {errors.nome && (
                    <p className="text-xs text-destructive">{errors.nome}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">Apelido (único)</Label>
                  <Input
                    id="nickname"
                    type="text"
                    placeholder="seu_apelido"
                    value={formData.nickname}
                    onChange={(e) =>
                      setFormData({ ...formData, nickname: e.target.value.toLowerCase() })
                    }
                    className={errors.nickname ? "border-destructive" : ""}
                    disabled={isLoading}
                  />
                  {errors.nickname && (
                    <p className="text-xs text-destructive">{errors.nickname}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Este será seu nome de exibição no ranking
                  </p>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={errors.email ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.senha}
                  onChange={(e) =>
                    setFormData({ ...formData, senha: e.target.value })
                  }
                  className={errors.senha ? "border-destructive pr-10" : "pr-10"}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.senha && (
                <p className="text-xs text-destructive">{errors.senha}</p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmarSenha}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmarSenha: e.target.value })
                  }
                  className={errors.confirmarSenha ? "border-destructive" : ""}
                  disabled={isLoading}
                />
                {errors.confirmarSenha && (
                  <p className="text-xs text-destructive">{errors.confirmarSenha}</p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isLogin ? "Entrar" : "Cadastrar"}
            </Button>

            {isLogin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-muted-foreground hover:text-primary transition-smooth"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-smooth"
              >
                {isLogin
                  ? "Não tem conta? Cadastre-se"
                  : "Já tem conta? Faça login"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
