import { useState } from "react";
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
import { Trophy, Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email inválido"),
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setErrorMsg(parsed.error.errors[0]?.message ?? "Email inválido");
      return;
    }

    setIsLoading(true);
    try {
      // IMPORTANTE: se você usa HashRouter na Vercel, use "#/reset-password"
      const redirectTo = `${window.location.origin}/#/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Enviamos um link de recuperação para seu email.");
      // opcional: voltar pra tela de login
      navigate("/auth");
    } catch {
      toast.error("Não foi possível enviar o link. Tente novamente.");
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
            <CardTitle className="text-2xl">Recuperar senha</CardTitle>
            <CardDescription>
              Digite seu email para receber um link de recuperação.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className={errorMsg ? "border-destructive" : ""}
              />
              {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enviar link
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="text-sm text-muted-foreground hover:text-primary transition-smooth"
              >
                Voltar para login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
