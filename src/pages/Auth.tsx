import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

/* =======================
   Schemas
======================= */

const signUpSchema = z
  .object({
    nome: z.string().min(2, "Informe seu nome").max(100),
    nickname: z
      .string()
      .min(3, "Apelido muito curto")
      .max(20, "Apelido muito longo")
      .regex(/^[a-zA-Z0-9_]+$/, "Use apenas letras, números e _"),
    email: z.string().email("Email inválido"),
    senha: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[a-zA-Z]/, "Deve conter letra")
      .regex(/[0-9]/, "Deve conter número"),
    confirmarSenha: z.string(),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    path: ["confirmarSenha"],
    message: "As senhas não coincidem",
  });

const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

/* =======================
   Component
======================= */

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      isLogin
        ? signInSchema.parse(formData)
        : signUpSchema.parse(formData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0]] = err.message;
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
      const { error } = await signIn(
        formData.email.trim().toLowerCase(),
        formData.senha
      );

      if (error) {
        toast.error("Email ou senha incorretos");
        return;
      }

      toast.success("Login realizado com sucesso!");
    } else {
      const { error } = await signUp(
        formData.email,
        formData.senha,
        formData.nome,
        formData.nickname
      );

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Cadastro realizado com sucesso!");

      setTimeout(() => {
        setIsLogin(true);
        setFormData({
          ...formData,
          senha: "",
          confirmarSenha: "",
        });
      }, 2000);
    }
  } finally {
    setIsLoading(false);
  }
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
      <Card className="w-full max-w-md">
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
                  <Label>Nome Completo</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    aria-invalid={!!errors.nome}
                    className={errors.nome ? "border-destructive" : ""}
                  />
                  {errors.nome && (
                    <p className="text-xs text-destructive">{errors.nome}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Apelido</Label>
                  <Input
                    value={formData.nickname}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nickname: e.target.value.toLowerCase(),
                      })
                    }
                    aria-invalid={!!errors.nickname}
                    className={errors.nickname ? "border-destructive" : ""}
                  />
                  {errors.nickname && (
                    <p className="text-xs text-destructive">
                      {errors.nickname}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                aria-invalid={!!errors.email}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.senha}
                  onChange={(e) =>
                    setFormData({ ...formData, senha: e.target.value })
                  }
                  aria-invalid={!!errors.senha}
                  className={`pr-10 ${
                    errors.senha ? "border-destructive" : ""
                  }`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>

              {errors.senha && (
                <p className="text-xs text-destructive">{errors.senha}</p>
              )}

              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label>Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmarSenha}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmarSenha: e.target.value,
                      })
                    }
                    aria-invalid={!!errors.confirmarSenha}
                    className={`pr-10 ${
                      errors.confirmarSenha ? "border-destructive" : ""
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() =>
                      setShowConfirmPassword((v) => !v)
                    }
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
                {errors.confirmarSenha && (
                  <p className="text-xs text-destructive">
                    {errors.confirmarSenha}
                  </p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {isLogin ? "Entrar" : "Cadastrar"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                  setFormData((prev) => ({
                    ...prev,
                    senha: "",
                    confirmarSenha: "",
                  }));
                }}
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
