import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function NavBar() {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const { isAuthenticated, isLoading, logout, user } = useAuth();

  function handleLogout() {
    logout();
    showSuccess({
      title: "Signed out",
      description: "Your Launchpad session has been cleared.",
    });
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[rgba(8,9,9,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="group"
          >
            <span className="block text-[10px] uppercase tracking-[0.32em] text-[var(--lp-accent)]">
              Computational publishing
            </span>
            <span className="mt-1 block text-lg font-semibold tracking-[0.28em] text-[var(--lp-fg)] transition group-hover:text-white">
              LAUNCHPAD
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-xs uppercase tracking-[0.24em] text-[var(--lp-muted)] md:flex">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? "border-b border-[var(--lp-accent)] pb-1 text-[var(--lp-fg)]"
                  : "border-b border-transparent pb-1 transition hover:text-[var(--lp-fg)]"
              }
            >
              Home
            </NavLink>
            {isAuthenticated ? (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive
                    ? "border-b border-[var(--lp-accent)] pb-1 text-[var(--lp-fg)]"
                    : "border-b border-transparent pb-1 transition hover:text-[var(--lp-fg)]"
                }
              >
                Dashboard
              </NavLink>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-10 w-40 animate-pulse border border-white/10 bg-white/5" />
          ) : isAuthenticated && user ? (
            <>
              <span className="hidden border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--lp-muted)] sm:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="launchpad-button-secondary px-4 py-2 text-xs font-medium uppercase tracking-[0.22em]"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="launchpad-button-secondary px-4 py-2 text-xs font-medium uppercase tracking-[0.22em]"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="launchpad-button-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]"
              >
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
