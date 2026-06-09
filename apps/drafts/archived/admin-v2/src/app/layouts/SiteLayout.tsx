import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  Shield,
  ShoppingCart,
  User,
  LogIn,
  MessageSquare,
  LogOut,
  ChevronDown,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CartProvider, useCart } from "../components/CartContext";
import { CartDrawer } from "../components/CartDrawer";
import { useAuth } from "../components/AuthContext";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Blog", href: "/blog" },
  { label: "Chat", href: "/chat" },
];

function CartButton() {
  const { toggle, itemCount } = useCart();
  return (
    <button
      onClick={toggle}
      className="relative flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
      aria-label="Open cart"
    >
      <ShoppingCart className="h-4 w-4" />
      {itemCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] text-white">
          {itemCount}
        </span>
      )}
    </button>
  );
}

function AuthButton() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated && user) {
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 transition hover:bg-slate-50 outline-none data-[state=open]:bg-slate-50">
            <ImageWithFallback
              src={user.author.avatar}
              alt={user.author.name}
              className="h-6 w-6 rounded-full border border-slate-200 object-cover"
            />
            <span className="hidden sm:inline text-xs text-slate-700">
              {user.author.name.split(" ")[0]}
            </span>
            <ChevronDown className="hidden sm:block h-3 w-3 text-slate-400" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-[100] min-w-[200px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg animate-in fade-in slide-in-from-top-1"
          >
            {/* User info */}
            <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
              <div className="flex items-center gap-2.5">
                <ImageWithFallback
                  src={user.author.avatar}
                  alt={user.author.name}
                  className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-900">
                    {user.author.name}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile */}
            <DropdownMenu.Item
              onSelect={() => navigate("/profile")}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-700 outline-none cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50"
            >
              <User className="h-4 w-4 text-slate-400" />
              My Profile
            </DropdownMenu.Item>

            {/* Chat */}
            <DropdownMenu.Item
              onSelect={() => navigate("/chat")}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-700 outline-none cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50"
            >
              <MessageSquare className="h-4 w-4 text-slate-400" />
              Team Chat
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />

            {/* Sign out */}
            <DropdownMenu.Item
              onSelect={() => {
                logout();
                navigate("/");
              }}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-red-600 outline-none cursor-pointer transition-colors hover:bg-red-50 focus:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  }

  return (
    <Link
      to="/login"
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 transition hover:bg-slate-50"
    >
      <LogIn className="h-4 w-4" />
      <span className="hidden sm:inline">Sign In</span>
    </Link>
  );
}

function SiteLayoutInner() {
  const location = useLocation();
  const isChatPage = location.pathname === "/chat";

  return (
    <div
      className={`flex flex-col bg-[#eaf0f7] text-slate-900 antialiased ${isChatPage ? "h-screen overflow-hidden" : "min-h-screen"}`}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <span className="text-sm">S</span>
              </div>
              <span className="text-sm text-slate-900">SinglePageStartup</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((link) => {
                const isActive =
                  link.href === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    className={`rounded-md px-3 py-1.5 text-sm transition ${
                      isActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <CartButton />
            <AuthButton />
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin Panel</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Page content */}
      <Outlet />

      {/* Footer */}
      {!isChatPage && (
        <footer className="mt-auto border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-white">
                  <span className="text-[10px]">S</span>
                </div>
                <span className="text-sm text-slate-500">
                  &copy; 2026 SinglePageStartup
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  to="/privacy"
                  className="text-xs text-slate-400 transition hover:text-slate-600"
                >
                  Privacy
                </Link>
                <Link
                  to="/terms"
                  className="text-xs text-slate-400 transition hover:text-slate-600"
                >
                  Terms
                </Link>
                <Link
                  to="/services"
                  className="text-xs text-slate-400 transition hover:text-slate-600"
                >
                  Services
                </Link>
                <Link
                  to="/blog"
                  className="text-xs text-slate-400 transition hover:text-slate-600"
                >
                  Blog
                </Link>
                <Link
                  to="/admin"
                  className="text-xs text-slate-400 transition hover:text-slate-600"
                >
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Cart drawer */}
      <CartDrawer />
    </div>
  );
}

export function SiteLayout() {
  return (
    <CartProvider>
      <SiteLayoutInner />
    </CartProvider>
  );
}
