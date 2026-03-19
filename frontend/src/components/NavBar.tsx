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
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-lg font-semibold tracking-[0.24em] text-white transition hover:text-fuchsia-200"
          >
            LAUNCHPAD
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-slate-300 md:flex">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "text-white" : "transition hover:text-white"
              }
            >
              Home
            </NavLink>
            {isAuthenticated ? (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? "text-white" : "transition hover:text-white"
                }
              >
                Dashboard
              </NavLink>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-10 w-36 animate-pulse rounded-full border border-white/10 bg-white/5" />
          ) : isAuthenticated && user ? (
            <>
              <span className="hidden text-sm text-slate-300 sm:inline">{user.email}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-fuchsia-400/50 hover:bg-fuchsia-500/10"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:text-white"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(192,38,211,0.35)] transition hover:scale-[1.02]"
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
