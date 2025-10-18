import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
  });
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock authentication
    if (isLogin) {
      toast.success("Login realizado com sucesso!");
    } else {
      toast.success("Cadastro realizado com sucesso!");
    }
    navigate("/");
  };

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
                  required
                />
              </div>
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
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="••••••••"
                value={formData.senha}
                onChange={(e) =>
                  setFormData({ ...formData, senha: e.target.value })
                }
                required
              />
            </div>

            <Button type="submit" className="w-full">
              {isLogin ? "Entrar" : "Cadastrar"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
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
