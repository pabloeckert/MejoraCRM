import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/skeletons";
import { useDashboardData } from "@/hooks/useDashboard";
import { OwnerView, SellerView } from "@/components/dashboard";

export default function Dashboard() {
  const { user, role, profile } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useDashboardData();
  const interactions = data?.interactions ?? [];
  const clients = data?.clients ?? [];
  const profiles = data?.profiles ?? [];

  if (isLoading) return <DashboardSkeleton />;

  const isOwner = role === "admin" || role === "supervisor";

  if (isOwner) {
    return <OwnerView interactions={interactions} clients={clients} profiles={profiles} navigate={navigate} />;
  }

  return (
    <SellerView
      interactions={interactions.filter((i: any) => i.user_id === user?.id)}
      myClients={clients.filter((c: any) => c.assigned_to === user?.id)}
      sellerName={profile?.full_name || "Vendedor"}
      navigate={navigate}
    />
  );
}
