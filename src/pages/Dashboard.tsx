import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/skeletons";
import { useDashboardData } from "@/hooks/useDashboard";
import { OwnerViewV2, SellerViewV2 } from "@/components/dashboard";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user, role, profile } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useDashboardData();
  const interactions = data?.interactions ?? [];
  const clients = data?.clients ?? [];
  const profiles = data?.profiles ?? [];

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="p-3 rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Error al cargar datos</h2>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Reintentar
        </Button>
      </div>
    );
  }

  const isOwner = role === "admin" || role === "supervisor";

  if (isOwner) {
    return <OwnerViewV2 interactions={interactions} clients={clients} profiles={profiles} navigate={navigate} />;
  }

  return (
    <SellerViewV2
      interactions={interactions.filter((i: any) => i.user_id === user?.id)}
      sellerName={profile?.full_name || "Vendedor"}
      navigate={navigate}
    />
  );
}
