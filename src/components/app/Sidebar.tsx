import { MessageSquare, BarChart3, Target, FolderOpen, PanelLeftClose, PanelLeft, Plus, Trash2, Brain, ClipboardList, Map, LayoutDashboard, Sparkles, Trophy, Briefcase, Calendar as CalIcon, Users } from "lucide-react";
import type { Mode } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { ProfileMenu } from "./ProfileMenu";
import { cn } from "@/lib/utils";

export interface Conversation { id: string; title: string }

type Item = { id: Mode; label: string; icon: typeof MessageSquare };

export function Sidebar({
  mode, onMode, collapsed, onToggle, conversations, activeId,
  onSelectConversation, onNewChat, onDeleteConversation,
}: {
  mode: Mode;
  onMode: (m: Mode) => void;
  collapsed: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
}) {
  const { t } = useI18n();
  const { user } = useAuth();

  const workspaceTeacher: Item[] = [
    { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { id: "today", label: t("today"), icon: Sparkles },
    { id: "chat", label: t("chat"), icon: MessageSquare },
    { id: "documents", label: t("documents"), icon: FolderOpen },
  ];
  const toolsTeacher: Item[] = [
    { id: "lecture", label: t("lectureAnalyzer"), icon: Brain },
    { id: "tasks", label: t("generateTasks"), icon: ClipboardList },
    { id: "group", label: t("groupDashboard"), icon: Users },
  ];
  const workspaceStudent: Item[] = [
    { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { id: "today", label: t("today"), icon: Sparkles },
    { id: "chat", label: t("chat"), icon: MessageSquare },
    { id: "documents", label: t("documents"), icon: FolderOpen },
  ];
  const growthStudent: Item[] = [
    { id: "goals", label: t("goals"), icon: Target },
    { id: "career", label: t("career"), icon: Briefcase },
    { id: "calendar", label: t("calendar"), icon: CalIcon },
    { id: "achievements", label: t("achievements"), icon: Trophy },
    { id: "plan", label: t("learningPlan"), icon: Map },
    { id: "analytics", label: t("analytics"), icon: BarChart3 },
    { id: "recommendations", label: t("recommendations"), icon: Target },
  ];

  const isTeacher = user?.role === "teacher";
  const groups: { label: string; items: Item[] }[] = isTeacher
    ? [{ label: t("workspace"), items: workspaceTeacher }, { label: t("growth"), items: toolsTeacher }]
    : [{ label: t("workspace"), items: workspaceStudent }, { label: t("growth"), items: growthStudent }];

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-surface/40 transition-all duration-300",
        collapsed ? "w-[64px]" : "w-[240px]",
      )}
    >
      <div className="flex h-14 items-center justify-between px-3">
        <button onClick={() => onMode("dashboard")} className="flex items-center gap-2 overflow-hidden">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/15 ring-1 ring-primary/30">
            <span className="font-mono text-[11px] font-semibold text-primary">M</span>
          </div>
          {!collapsed && <span className="truncate text-sm font-semibold tracking-tight">MynDerek</span>}
        </button>
        <button
          onClick={onToggle}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <div className="px-2">
        <button
          onClick={onNewChat}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-sm text-foreground transition hover:border-primary/40 hover:bg-surface-elevated",
            collapsed && "justify-center px-0",
          )}
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
          {!collapsed && <span>{t("newChat")}</span>}
        </button>
      </div>

      <div className="scrollbar-thin mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto px-2">
        {groups.map((grp, gi) => (
          <div key={gi} className={cn(gi > 0 && "mt-4")}>
            {!collapsed && (
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {grp.label}
              </div>
            )}
            <nav className="flex flex-col gap-0.5">
              {grp.items.map((it) => {
                const active = mode === it.id;
                const Icon = it.icon;
                return (
                  <button
                    key={it.id}
                    onClick={() => onMode(it.id)}
                    className={cn(
                      "group relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition",
                      active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <span className={cn(
                      "absolute left-0 h-5 w-[2px] rounded-r-full bg-primary transition-opacity",
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                    )} />
                    <Icon className={cn("h-4 w-4", active && "text-primary")} />
                    {!collapsed && <span className="truncate">{it.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}

        {!collapsed && conversations.length > 0 && (
          <div className="mt-5">
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {t("recent")}
            </div>
            <div>
              {conversations.slice(0, 8).map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-md transition",
                    activeId === c.id ? "bg-surface-elevated" : "hover:bg-surface-elevated/60",
                  )}
                >
                  <button
                    onClick={() => onSelectConversation(c.id)}
                    className={cn(
                      "min-w-0 flex-1 truncate px-2.5 py-1.5 text-left text-[13px] transition",
                      activeId === c.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {c.title}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteConversation(c.id); }}
                    className="mr-1 grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground/60 opacity-0 transition hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-border p-2">
        <ProfileMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}
