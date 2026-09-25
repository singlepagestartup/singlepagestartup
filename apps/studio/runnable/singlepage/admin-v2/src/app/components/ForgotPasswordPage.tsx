import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Mail,
  CheckCircle2,
} from "lucide-react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    setError("");
    setLoading(true);
    // Mock: simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
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
            <Link to="/login" className="transition hover:text-slate-600">
              Sign In
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600">Forgot Password</span>
          </nav>

          {/* Card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="border-b border-slate-100 px-8 pb-6 pt-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Mail className="h-5 w-5" />
              </div>
              <h1 className="text-xl tracking-tight text-slate-900">
                Reset your password
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            {/* Body */}
            <div className="px-8 py-6">
              {sent ? (
                /* Success state */
                <div className="space-y-5 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                    <CheckCircle2 className="h-7 w-7 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-900">Check your inbox</p>
                    <p className="mt-1 text-xs text-slate-500">
                      We sent a password reset link to{" "}
                      <strong className="text-slate-700">{email}</strong>
                    </p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <p className="text-xs text-blue-700">
                      <span className="mr-1">ℹ️</span>
                      This is a demo — no email is actually sent. Just go back
                      and sign in.
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-700 transition hover:text-slate-900"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Sign In
                  </Link>
                </div>
              ) : (
                /* Form state */
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Info banner */}
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <p className="text-xs text-blue-700">
                      <span className="mr-1">ℹ️</span>
                      This is a demo — no email is actually sent.
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="mb-1.5 block text-xs text-slate-500"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="forgot-email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                      />
                    </div>
                  </div>

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
                        Sending…
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Footer */}
            {!sent && (
              <div className="border-t border-slate-100 px-8 py-4 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-700"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
