import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { NavBar } from "./NavBar";

export function AppShell() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--lp-bg)] text-[var(--lp-fg)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-white/8" />
        <div className="absolute inset-x-6 top-20 h-px bg-white/6" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.38))]" />
        <div className="absolute right-0 top-0 h-[32rem] w-[32rem] bg-[radial-gradient(circle_at_top_right,rgba(200,255,97,0.08),transparent_55%)]" />
        <div className="absolute left-6 top-20 hidden h-[calc(100%-5rem)] w-px bg-white/6 xl:block" />
        <div className="absolute right-6 top-20 hidden h-[calc(100%-5rem)] w-px bg-white/6 xl:block" />
      </div>

      <div className="relative z-10">
        <NavBar />
        <Outlet />
      </div>
    </div>
  );
}
