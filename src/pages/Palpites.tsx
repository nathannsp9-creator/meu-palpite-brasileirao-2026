import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContextFirebase";
import AdminPredictionsView from "@/components/admin/AdminPredictionsView";
import UserPredictions from "@/components/predictions/UserPredictions";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Controlador de Acesso - Página de Palpites
 * 
 * Este componente decide qual interface mostrar baseado no cargo do usuário:
 * - Admin: Monitoramento de progresso dos palpites (AdminPredictionsView)
 * - Usuário: Interface para fazer palpites (UserPredictions)
 */
export default function Palpites() {
  const { isAdmin, loading } = useAuth();

  // LOADING: Exibe skeleton enquanto verifica o cargo do usuário
  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  // ADMIN: Exibe o painel de monitoramento
  if (isAdmin) {
    return (
      <Layout>
        <AdminPredictionsView />
      </Layout>
    );
  }

  // USUÁRIO COMUM: Exibe a interface de apostas
  return (
    <Layout>
      <UserPredictions />
    </Layout>
  );
}
