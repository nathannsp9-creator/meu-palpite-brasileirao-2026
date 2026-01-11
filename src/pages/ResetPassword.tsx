import { useState, useEffect } from "react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "@/lib/firebase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode") || undefined;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const validateCode = async () => {
      if (!oobCode) {
        toast.error("Link inválido ou expirado");
        navigate("/forgot-password", { replace: true });
        return;
      }
      try {
        await verifyPasswordResetCode(auth, oobCode);
      } catch (error: any) {
        toast.error("Link inválido ou expirado");
        navigate("/forgot-password", { replace: true });
      }
    };

    validateCode();
  }, [navigate, oobCode]);

  const handleUpdate = async () => {
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (!oobCode) {
      toast.error("Link inválido ou expirado");
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      toast.success("Senha atualizada com sucesso");
      navigate("/auth", { replace: true });
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível atualizar a senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nova senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirmar senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button onClick={handleUpdate} disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
