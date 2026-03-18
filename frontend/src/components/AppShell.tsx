import { Outlet } from "react-router-dom";

import { NavBar } from "./NavBar";

export function AppShell() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12rem] top-[-10rem] h-96 w-96 rounded-full bg-fuchsia-500/18 blur-3xl" />
        <div className="absolute right-[-8rem] top-12 h-[26rem] w-[26rem] rounded-full bg-cyan-400/14 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-violet-500/14 blur-3xl" />
      </div>

      <div className="relative z-10">
        <NavBar />
        <Outlet />
      </div>
    </div>
  );
}
