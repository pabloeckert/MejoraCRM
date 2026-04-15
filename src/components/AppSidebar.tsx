import { LayoutDashboard, Users, MessageSquare, Kanban, BarChart3, LogOut, Bell } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Clientes", url: "/clients", icon: Users },
  { title: "Interacciones", url: "/interactions", icon: MessageSquare },
  { title: "Pipeline", url: "/pipeline", icon: Kanban },
  { title: "Reportes", url: "/reports", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className={`flex items-center gap-2 px-3 py-4 ${collapsed ? "justify-center" : ""}`}>
            <img src={logoImg} alt="Mejora Continua" className="h-8 object-contain shrink-0" />
            {!collapsed && (
              <div>
                <h2 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">Mejora Continua</h2>
                <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">CRM Forestal</p>
              </div>
            )}
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
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
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className={`text-xs text-sidebar-foreground/40 ${collapsed ? "text-center" : "px-1"}`}>
          {collapsed ? "MC" : "Mejora Continua CRM v1.0"}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
