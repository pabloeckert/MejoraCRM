import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { DemoRoleToggle } from "@/components/DemoRoleToggle";
import { DemoModeToggle } from "@/components/DemoModeToggle";
import { BottomNav } from "@/components/BottomNav";
import { useLocation } from "react-router-dom";
import { useDemoMode } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Vista General",
  "/clients": "Clientes",
  "/interactions": "Interacciones",
  "/products": "Productos",
  "/whatsapp-link": "Link WhatsApp",
  "/whatsapp-campanas": "Campañas WhatsApp",
  "/contactos": "Contactos",
  "/settings": "Configuración",
};

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "";
  const demoMode = useDemoMode();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 shrink-0 sticky top-0 z-10">
            <div className="flex items-center">
              <SidebarTrigger />
              <span className="ml-3 text-sm font-medium text-muted-foreground">{title}</span>
            </div>
            <div className="flex items-center gap-2">
              <DemoModeToggle />
              <DemoRoleToggle />
              <NotificationsPanel />
            </div>
          </header>
          {demoMode && (
            <div
              className="h-7 flex items-center justify-center gap-1.5 shrink-0 sticky top-14 z-10 text-[11px] font-medium"
              style={{ background: "rgba(247, 204, 19, 0.18)", borderBottom: "1px solid rgba(247, 204, 19, 0.5)", color: "#8a6d00" }}
            >
              <Sparkles className="h-3 w-3" />
              Estás viendo datos de ejemplo — no es tu información real
            </div>
          )}
          <main className="flex-1 p-4 pb-20 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </SidebarProvider>
  );
}
