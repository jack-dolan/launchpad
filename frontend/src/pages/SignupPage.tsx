import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

interface SignupFormState {
  email: string;
  password: string;
  confirmPassword: string;
}

export function SignupPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { isAuthenticated, isLoading, signup } = useAuth();
  const [form, setForm] = useState<SignupFormState>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          <div className="launchpad-shimmer h-[32rem] border border-white/10 bg-white/[0.04]" />
        </div>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      showError({
        title: "Signup failed",
        description: "Passwords do not match.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({ email: form.email, password: form.password });
      showSuccess({
        title: "Account created",
        description: "Your Launchpad workspace is ready.",
      });
      navigate("/dashboard", { replace: true });
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message);
        showError({
          title: "Signup failed",
          description: submitError.message,
        });
      } else {
        setError("Unable to create your account right now.");
        showError({
          title: "Signup failed",
          description: "Unable to create your account right now.",
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
            Create your studio
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--lp-fg)] md:text-5xl">
            Start generating launch pages with a sharper first impression.
          </h1>
          <p className="max-w-xl text-base leading-8 text-[var(--lp-muted)]">
            Launchpad is built for merchants who want more heat around a release without slowing
            down for design handoffs or one-off landing page builds.
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
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="launchpad-input"
                placeholder="Create a password"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium text-[var(--lp-fg)]"
              >
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                className="launchpad-input"
                placeholder="Confirm your password"
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
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>

            <p className="text-sm text-[var(--lp-muted)]">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-[var(--lp-accent)] transition hover:text-white">
                Sign in
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
