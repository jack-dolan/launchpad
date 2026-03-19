import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

interface LoginFormState {
  email: string;
  password: string;
}

interface LocationState {
  from?: {
    pathname?: string;
  };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showSuccess } = useToast();
  const { isAuthenticated, isLoading, login } = useAuth();
  const [form, setForm] = useState<LoginFormState>({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as LocationState | null)?.from?.pathname ?? "/dashboard";

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-[1600px] items-center px-6 py-14 md:min-h-[calc(100vh-81px)]">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-4">
            <div className="launchpad-shimmer h-4 w-40 bg-white/10" />
            <div className="launchpad-shimmer h-14 w-full max-w-xl bg-white/10" />
            <div className="launchpad-shimmer h-24 w-full max-w-2xl bg-white/10" />
          </div>
          <div className="launchpad-shimmer h-[28rem] border border-white/10 bg-white/[0.04]" />
        </div>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await login(form);
      showSuccess({
        title: "Signed in",
        description: "Your dashboard is ready.",
      });
      navigate(from, { replace: true });
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message);
        showError({
          title: "Sign in failed",
          description: submitError.message,
        });
      } else {
        setError("Unable to sign in right now.");
        showError({
          title: "Sign in failed",
          description: "Unable to sign in right now.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[1600px] items-center px-6 py-14 md:min-h-[calc(100vh-81px)]">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="space-y-5">
          <p className="launchpad-label text-[var(--lp-accent)]">
            Return to the control room
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--lp-fg)] md:text-5xl">
            Sign in to keep shaping your next drop.
          </h1>
          <p className="max-w-xl text-base leading-8 text-[var(--lp-muted)]">
            Pick up where you left off, refine your generated page, and get the campaign ready to
            publish before attention moves on.
          </p>
        </section>

        <section className="launchpad-panel px-6 py-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-[var(--lp-fg)]">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="launchpad-input"
                placeholder="merchant@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-[var(--lp-fg)]">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="launchpad-input"
                placeholder="Enter your password"
                required
              />
            </div>

            {error ? (
              <div className="border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="launchpad-button-primary w-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em]"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>

            <p className="text-sm text-[var(--lp-muted)]">
              Need an account?{" "}
              <Link to="/signup" className="font-medium text-[var(--lp-accent)] transition hover:text-white">
                Create one
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
