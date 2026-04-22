import { LayoutGrid, Users, MessageSquare, Package, LogOut, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/logo-white.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Vista General", url: "/", icon: LayoutGrid },
  { title: "Clientes", url: "/clients", icon: Users },
  { title: "Interacciones", url: "/interactions", icon: MessageSquare },
  { title: "Productos", url: "/products", icon: Package, roles: ["admin", "supervisor"] },
  { title: "Configuración", url: "/settings", icon: Settings, roles: ["admin", "supervisor"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile, role, signOut, user } = useAuth();

  const visibleItems = items.filter((i) => !i.roles || (role && i.roles.includes(role)));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className={`flex flex-col items-center px-3 py-4 ${collapsed ? "" : "gap-1"}`}>
            <img src={logoImg} alt="Mejora Continua" className={`object-contain shrink-0 ${collapsed ? "h-7" : "h-10"}`} />
            {!collapsed && (
              <p
                className="text-[11px] font-bold text-sidebar-accent-foreground tracking-[0.25em] uppercase"
                style={{ fontFamily: "'League Spartan', sans-serif" }}
              >
                CRM
              </p>
            )}
          </div>
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
                        className={`transition-all duration-200 rounded-lg ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-primary font-semibold"
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
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border space-y-2">
        {user && !collapsed && (
          <div className="px-1 text-xs">
            <p className="font-medium text-sidebar-accent-foreground truncate">{profile?.full_name || user.email}</p>
            <p className="text-sidebar-foreground/50 capitalize">{role || "—"}</p>
          </div>
        )}
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 h-8"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && <span className="text-xs">Cerrar sesión</span>}
          </Button>
        )}
        <div className={`text-[10px] text-sidebar-foreground/30 ${collapsed ? "text-center" : "px-1"}`}>
          {collapsed ? "v2" : "Mejora CRM v2.0"}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
