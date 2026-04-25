import React, { useState } from "react";
import {
  NavLink,
  Outlet,
  useParams,
  useNavigate,
  useLocation,
  Link,
} from "react-router";
import { api } from "../data";
import { cn } from "../../lib/utils";
import {
  Settings,
  HelpCircle,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
} from "lucide-react";

export function AdminLayout() {
  const modules = api.getModules();
  const { moduleSlug, modelSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(
    moduleSlug || null,
  );

  const isSettingsView = location.pathname === "/admin/settings";
  const isAccountSettingsView = location.pathname === "/admin/settings/account";

  // Keep expanded module in sync when navigating
  React.useEffect(() => {
    if (moduleSlug) {
      setExpandedModuleId(moduleSlug);
    }
  }, [moduleSlug]);

  const handleModuleClick = (modSlug: string) => {
    if (moduleSlug === modSlug && expandedModuleId === modSlug) {
      // Already selected and expanded — collapse
      setExpandedModuleId(null);
      return;
    }
    setExpandedModuleId(modSlug);
    navigate(`/admin/${modSlug}`);
  };

  const handleModelClick = (modSlug: string, model: string) => {
    navigate(`/admin/${modSlug}/${model}`);
  };

  const handleSettingsClick = () => {
    navigate("/admin/settings");
  };

  const handleUserClick = () => {
    navigate("/admin/settings/account");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground antialiased">
      {/* Sidebar */}
      <aside
        className={cn(
          "relative z-[100] flex shrink-0 flex-col border-r border-border bg-card transition-all duration-300",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden",
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm">A</span>
            </div>
            <span className="text-sm">Admin Panel</span>
          </div>
        </div>

        {/* Module list */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-3 py-4">
            <div className="space-y-2">
              {modules.map((mod) => {
                const isSelected = moduleSlug === mod.slug;
                const isExpanded = expandedModuleId === mod.slug;
                const moduleModels = mod.models;

                return (
                  <div
                    key={mod.id}
                    className={cn(
                      "rounded-md",
                      isExpanded &&
                        `bg-[#F1F5F9] border p-1.5 ${isSelected ? "border-slate-300" : "border-slate-200"}`,
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleModuleClick(mod.slug)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition",
                        isSelected
                          ? "border-slate-300 bg-white text-slate-900"
                          : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-white",
                      )}
                    >
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <span className="text-base">{mod.icon}</span>
                        <span className="truncate">{mod.name}</span>
                      </span>
                      <span className="inline-flex items-center">
                        <span
                          className={cn(
                            "inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1.5 text-[10px] leading-none",
                            isSelected
                              ? "border-slate-300 bg-slate-100 text-slate-700"
                              : "border-slate-300 bg-white text-slate-500",
                          )}
                        >
                          {moduleModels.length}
                        </span>
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-1 pl-3">
                        {moduleModels.map((model) => {
                          const isModelSelected =
                            modelSlug === model.slug && moduleSlug === mod.slug;
                          return (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() =>
                                handleModelClick(mod.slug, model.slug)
                              }
                              className={cn(
                                "flex w-full items-center rounded-md border px-3 py-2 text-left text-sm transition",
                                isModelSelected
                                  ? "border-slate-200 bg-white text-slate-900"
                                  : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white",
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                                  isModelSelected
                                    ? "bg-slate-900"
                                    : "bg-slate-300",
                                )}
                              />
                              <span className="ml-2 truncate">
                                {model.slug}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settings button */}
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={handleSettingsClick}
            className={cn(
              "flex w-full items-center justify-start rounded-md px-3 py-2 text-sm transition",
              isSettingsView
                ? "border border-slate-300 bg-white text-slate-900"
                : "hover:bg-muted",
            )}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 items-center border-b border-border bg-card px-6">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="rounded-md p-2 transition hover:bg-muted"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open site</span>
            </Link>
            <button
              type="button"
              className="rounded-md p-2 transition hover:bg-muted"
              aria-label="Help"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleUserClick}
              className={cn(
                "rounded-md p-2 transition",
                isAccountSettingsView
                  ? "border border-slate-300 bg-white"
                  : "hover:bg-muted",
              )}
              aria-label="User"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-background p-6 bg-[#F1F5F9]">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
