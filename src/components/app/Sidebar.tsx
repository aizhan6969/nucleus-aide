import { MessageSquare, BarChart3, Target, FolderOpen, PanelLeftClose, PanelLeft, Plus } from "lucide-react";
import type { Mode } from "@/lib/api";
import { cn } from "@/lib/utils";

const items: { id: Mode; label: string; icon: typeof MessageSquare }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "recommendations", label: "Recommendations", icon: Target },
  { id: "documents", label: "Documents", icon: FolderOpen },
];

export interface Conversation { id: string; title: string }

export function Sidebar({
  mode, onMode, collapsed, onToggle, conversations, activeId, onSelectConversation, onNewChat,
}: {
  mode: Mode;
  onMode: (m: Mode) => void;
  collapsed: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-surface/40 transition-all duration-300",
        collapsed ? "w-[64px]" : "w-[240px]",
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/15 ring-1 ring-primary/30">
            <span className="font-mono text-[11px] font-semibold text-primary">M</span>
          </div>
          {!collapsed && <span className="truncate text-sm font-semibold tracking-tight">MynDerek</span>}
        </div>
        <button
          onClick={onToggle}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* New chat */}
      <div className="px-2">
        <button
          onClick={onNewChat}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-sm text-foreground transition hover:border-primary/40 hover:bg-surface-elevated",
            collapsed && "justify-center px-0",
          )}
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
          {!collapsed && <span>New chat</span>}
        </button>
      </div>

      {/* Modes */}
      <nav className="mt-4 flex flex-col gap-0.5 px-2">
        {items.map((it) => {
          const active = mode === it.id;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              onClick={() => onMode(it.id)}
              className={cn(
                "group relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition",
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <span
                className={cn(
                  "absolute left-0 h-5 w-[2px] rounded-r-full bg-primary transition-opacity",
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                )}
              />
              <Icon className={cn("h-4 w-4", active && "text-primary")} />
              {!collapsed && <span className="truncate">{it.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Conversations */}
      {!collapsed && (
        <div className="mt-6 flex min-h-0 flex-1 flex-col px-2">
          <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Recent
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto pr-1">
            {conversations.length === 0 && (
              <div className="px-2 py-3 text-xs text-muted-foreground/60">No conversations yet</div>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                className={cn(
                  "block w-full truncate rounded-md px-2.5 py-1.5 text-left text-[13px] transition",
                  activeId === c.id
                    ? "bg-surface-elevated text-foreground"
                    : "text-muted-foreground hover:bg-surface-elevated/60 hover:text-foreground",
                )}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* User */}
      <div className={cn("mt-auto flex items-center gap-2.5 border-t border-border p-3", collapsed && "justify-center")}>
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-elevated text-xs font-medium ring-1 ring-border">
          DK
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">Derek</div>
            <div className="truncate text-[11px] text-muted-foreground">Student · Free</div>
          </div>
        )}
      </div>
    </aside>
  );
}
