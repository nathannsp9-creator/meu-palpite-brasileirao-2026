import { Layout } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContextFirebase";
import AdminDashboard from "./AdminDashboard";
import PlayerDashboard from "./PlayerDashboard";

export default function Dashboard() {
  const { isAdmin, loading } = useAuth();

  // Loading state - mostrar skeleton enquanto verifica o cargo
  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          {/* Hero Skeleton */}
          <div className="rounded-lg p-8">
            <Skeleton className="h-12 w-12 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>

          {/* Stats Skeleton */}
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>

          {/* Cards Skeleton */}
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Decisão: Admin ou Player
  return isAdmin ? <AdminDashboard /> : <PlayerDashboard />;
}
