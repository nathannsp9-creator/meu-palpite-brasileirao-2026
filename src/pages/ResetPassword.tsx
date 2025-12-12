import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
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

const schema = z
  .object({
    senha: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .regex(/[a-zA-Z]/, "Senha deve conter pelo menos uma letra")
      .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
    confirmarSenha: z.string(),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

export default function ResetPassword() {
  const navigate = useNavigate();

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Garante que a sessão do tipo "recovery" foi aplicada ao abrir o link.
  // Se não tiver sessão, normalmente é link inválido/expirado.
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // Sem sessão de recovery: link inválido/expirado
        // (não trava o usuário, só orienta)
        toast.error("Link inválido ou expirado. Solicite a recuperação novamente.");
        navigate("/forgot-password");
      }
    };
    check();
  }, [navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = schema.safeParse({ senha, confirmarSenha });
    if (!parsed.success) {
      const newErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        newErrors[key] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Senha atualizada com sucesso!");
      // Opcional: desloga recovery session e manda pro login
      await supabase.auth.signOut();
      navigate("/auth");
    } catch {
      toast.error("Não foi possível atualizar a senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-brasil p-4">
      <Card className="w-full max-w-md shadow-hover">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Trophy className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Nova senha</CardTitle>
            <CardDescription>Defina uma nova senha para sua conta.</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={isLoading}
                  className={`pr-10 ${errors.senha ? "border-destructive" : ""}`}
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
              {errors.senha && <p className="text-xs text-destructive">{errors.senha}</p>}
            </div>

            <div className="space-y-2">
              <Label>Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  disabled={isLoading}
                  className={`pr-10 ${
                    errors.confirmarSenha ? "border-destructive" : ""
                  }`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {errors.confirmarSenha && (
                <p className="text-xs text-destructive">{errors.confirmarSenha}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar nova senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
