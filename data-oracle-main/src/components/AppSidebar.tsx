import { MessageSquare, LayoutDashboard, AlertTriangle, Settings, History, Star, RotateCcw, Bot } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type HistoryItem } from "@/lib/api";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "AI Chat", url: "/", icon: MessageSquare },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Alerts", url: "/alerts", icon: AlertTriangle },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: historyItems = [] } = useQuery({
    queryKey: ["history", "all"],
    queryFn: () => api.getAllHistory(150),
    staleTime: 5000,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (messageId: string) => api.toggleFavoriteGlobal(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history", "all"] });
    },
  });

  const queryRows = historyItems
    .filter((item: HistoryItem) => item.role === "user" && item.message?.trim())
    .sort((a: HistoryItem, b: HistoryItem) => {
      if (a.is_favorite === b.is_favorite) {
        return String(b.created_at).localeCompare(String(a.created_at));
      }
      return a.is_favorite ? -1 : 1;
    })
    .slice(0, 10);

  const rerunQuery = (query: string) => {
    if (!query.trim()) return;
    navigate("/");
    window.dispatchEvent(new CustomEvent("datagod:rerun-query", { detail: query }));
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-white/[0.06] bg-sidebar">
      <SidebarContent className="pt-4">
        <div className="px-4 pb-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-cyan">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-foreground tracking-wide">DataGod</span>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        }`}
                        activeClassName="bg-primary/10 text-primary"
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-3 pt-4 pb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <History className="h-3.5 w-3.5" />
                Previous Queries
              </div>
              <div className="px-2 space-y-2 max-h-[46vh] overflow-y-auto">
                {queryRows.length === 0 ? (
                  <div className="text-xs text-muted-foreground px-2 py-2">No queries yet.</div>
                ) : (
                  queryRows.map((item: HistoryItem) => (
                    <div key={item.id} className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-2">
                      <div className="text-xs text-foreground/90 line-clamp-2">{item.message}</div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <button
                          onClick={() => toggleFavoriteMutation.mutate(item.id)}
                          className="text-[11px] px-2 py-1 rounded-md border border-white/[0.12] hover:bg-white/[0.06] flex items-center gap-1"
                        >
                          <Star className={`h-3 w-3 ${item.is_favorite ? "text-yellow-300 fill-yellow-300" : "text-muted-foreground"}`} />
                          {item.is_favorite ? "Favorite" : "Mark Favorite"}
                        </button>
                        <button
                          onClick={() => rerunQuery(item.message)}
                          className="text-[11px] px-2 py-1 rounded-md border border-primary/30 text-primary hover:bg-primary/10 flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Rerun
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
