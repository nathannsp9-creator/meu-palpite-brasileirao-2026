import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const navigate = useNavigate();

  const handleReset = async () => {
    if (!email) {
      toast.error("Digite seu email");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email, {
        // Redireciona o usuário para a página de reset após clicar no email
        url: `${window.location.origin}/#/reset-password`, 
      });
      
      // Abre o pop-up de sucesso
      setShowSuccessDialog(true);
      
    } catch (error: any) {
      console.log(error);
      if (error.code === 'auth/user-not-found') {
        toast.error("Usuário não encontrado.");
      } else {
        toast.error("Não foi possível enviar o email. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recuperar senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={handleReset} disabled={loading} className="w-full">
            {loading ? "Enviando..." : "Enviar link"}
          </Button>
        </CardContent>
      </Card>

      {/* Pop-up de Confirmação */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verifique seu e-mail 📧</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Enviamos um link de recuperação para <strong>{email}</strong>.
              </p>
              <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md border border-yellow-200 text-sm">
                <strong>⚠️ Importante:</strong>
                <br />
                Se não encontrar na caixa de entrada, verifique sua pasta de <strong>SPAM</strong> ou <strong>Lixo Eletrônico</strong>.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => {
                setShowSuccessDialog(false);
                // Redireciona para a tela de Login (Auth.tsx)
                navigate("/auth"); 
              }}
            >
              Entendi, vou verificar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}