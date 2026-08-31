import { LayoutGrid, Users, MessageSquare, Package, LogOut, Settings, Search, BarChart3, MessageCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/branding/MC_Logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

// Agrupado por sección (patron MejoraSM) -- una lista plana de 9 items ya
// era dificil de escanear, y va a seguir creciendo.
const sections = [
  {
    label: "General",
    items: [{ title: "Vista General", url: "/", icon: LayoutGrid }],
  },
  {
    label: "Ventas",
    items: [
      { title: "Clientes", url: "/clients", icon: Users },
      { title: "Interacciones", url: "/interactions", icon: MessageSquare },
      { title: "Productos", url: "/products", icon: Package, roles: ["admin", "supervisor"] },
      { title: "Reportes", url: "/reports", icon: BarChart3, roles: ["admin", "supervisor"] },
    ],
  },
  {
    label: "WhatsApp",
    items: [
      { title: "Link WhatsApp", url: "/whatsapp-link", icon: MessageCircle, roles: ["admin", "supervisor"] },
      { title: "Campañas WhatsApp", url: "/whatsapp-campanas", icon: MessageCircle, roles: ["admin", "supervisor"] },
      { title: "Contactos", url: "/contactos", icon: Users, roles: ["admin", "supervisor"] },
    ],
  },
  {
    label: "Gestión",
    items: [{ title: "Configuración", url: "/settings", icon: Settings, roles: ["admin", "supervisor"] }],
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile, role, signOut, user } = useAuth();

  const displayName = profile?.full_name || user?.email || "";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`flex items-center px-3 py-4 border-b border-sidebar-border ${collapsed ? "justify-center" : "gap-2.5"}`}>
          <img src={logoImg} alt="Mejora Continua" className="h-8 w-8 object-contain shrink-0" />
          {!collapsed && (
            <div className="leading-none">
              <p className="text-sm text-sidebar-foreground/70">Mejora</p>
              <p
                className="text-sm font-bold text-sidebar-foreground tracking-wide"
                style={{ fontFamily: "var(--font-display)" }}
              >
                CRM
              </p>
            </div>
          )}
        </div>

        {/* Search trigger */}
        <div className="px-2 pt-2">
          <button
            onClick={() => {
              const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
              document.dispatchEvent(event);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 mb-1 rounded-lg text-sm text-sidebar-foreground/50 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <Search className="h-4 w-4" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Buscar...</span>
                <kbd className="hidden sm:inline text-[10px] bg-sidebar-accent/50 px-1.5 py-0.5 rounded font-mono">Ctrl+K</kbd>
              </>
            )}
          </button>
        </div>

        {sections.map((section) => {
          const visibleItems = section.items.filter((i) => !("roles" in i) || !i.roles || (role && i.roles.includes(role)));
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={section.label}>
              {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/40">{section.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const isActive = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end={item.url === "/"}
                            aria-label={item.title}
                            className={`transition-all duration-200 rounded-lg ${
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                            }`}
                            activeClassName=""
                          >
                            <item.icon className={`mr-2 h-4 w-4 ${isActive ? "text-sidebar-primary" : ""}`} />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {user && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-bold flex items-center justify-center shrink-0">
              {initials(displayName) || "?"}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</p>
                <p className="text-[11px] text-sidebar-foreground/50 capitalize">{role || "—"}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              aria-label="Cerrar sesión"
              className="h-8 w-8 shrink-0 text-sidebar-foreground/50 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
        {!collapsed && (
          <div className="text-[10px] text-sidebar-foreground/30 mt-2 px-1">MejoraCRM · v2.0</div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
