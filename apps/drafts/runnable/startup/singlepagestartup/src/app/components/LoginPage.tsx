import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import {
  ChevronRight,
  Eye,
  EyeOff,
  Github,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { useAuth } from "./AuthContext";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already authenticated, redirect
  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/profile");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-1.5 text-xs text-slate-400">
            <Link to="/" className="transition hover:text-slate-600">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600">Sign In</span>
          </nav>

          {/* Card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="border-b border-slate-100 px-8 pb-6 pt-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Lock className="h-5 w-5" />
              </div>
              <h1 className="text-xl tracking-tight text-slate-900">
                Welcome back
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Sign in to your account to continue
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 px-8 py-6">
              {/* Info banner */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-xs text-blue-700">
                  <span className="mr-1">ℹ️</span>
                  This is a demo — any email and password will work. Try{" "}
                  <strong>sarah@sps.dev</strong>, <strong>james@sps.dev</strong>
                  , or <strong>marcus@sps.dev</strong> to log in as a specific
                  author.
                </p>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-xs text-slate-500"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="text-xs text-slate-500"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-slate-500 transition hover:text-slate-700"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  >
                    {showPwd ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                />
                <span className="text-xs text-slate-600">
                  Remember me for 30 days
                </span>
              </label>

              {/* Error */}
              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-400 bg-slate-900 px-4 py-2.5 text-sm text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[10px] text-slate-400 uppercase">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    await login("sarah@sps.dev", "");
                    setLoading(false);
                    navigate("/profile");
                  }}
                  className="flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    await login("james@sps.dev", "");
                    setLoading(false);
                    navigate("/profile");
                  }}
                  className="flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-slate-100 px-8 py-4 text-center">
              <p className="text-xs text-slate-500">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-slate-700 underline transition hover:text-slate-900"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
