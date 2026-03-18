import { useAuth } from "../context/AuthContext";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-14">
      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-fuchsia-200">
              Dashboard
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-white">Welcome, {user?.email}</h1>
            <p className="max-w-2xl text-base leading-8 text-slate-300">
              This is the merchant control surface for your upcoming campaigns. Drops will live
              here once you start creating and iterating on them.
            </p>
          </div>

          <button
            type="button"
            className="rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(192,38,211,0.25)] transition hover:scale-[1.02]"
          >
            Create New Drop
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Pipeline</p>
          <p className="mt-4 text-3xl font-semibold text-white">0</p>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            You have a clean slate. Create your first drop and start shaping the release page.
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Last action</p>
          <p className="mt-4 text-2xl font-semibold text-white">Account ready</p>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            Auth is wired up. The next major milestone is drop creation and generation.
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Status</p>
          <p className="mt-4 text-2xl font-semibold text-white">Protected</p>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            Dashboard and drop routes now require a valid session before they render.
          </p>
        </article>
      </section>
    </main>
  );
}
