import { Link } from "react-router-dom";

const featureCards = [
  {
    title: "Brief the drop",
    body: "Start with the product name, launch date, description, and vibe. Launchpad turns merchant intent into a concrete campaign setup.",
  },
  {
    title: "Generate instantly",
    body: "Codex creates a self-contained landing page with themed visuals, a countdown timer, product storytelling, and a notify form.",
  },
  {
    title: "Publish when ready",
    body: "Refine the page in plain English, review it in real time, then ship a public link when the campaign feels sharp enough.",
  },
];

export function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-14 md:py-20">
      <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(217,70,239,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.14),_transparent_34%),rgba(15,23,42,0.84)] p-8 shadow-[0_28px_100px_rgba(2,6,23,0.55)] backdrop-blur md:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-fuchsia-200">
              AI landing pages for product drops
            </span>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
                Launchpad turns a drop brief into a polished public page in minutes.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Merchants describe the release, Codex generates a premium landing page, and every
                revision happens through simple prompts instead of design handoffs or hand-coded
                one-offs.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Input</p>
                <p className="mt-3 text-2xl font-semibold text-white">Brief</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">Name, description, vibe, and date.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Engine</p>
                <p className="mt-3 text-2xl font-semibold text-white">Codex</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">Single-file HTML with inline styling and scripts.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Output</p>
                <p className="mt-3 text-2xl font-semibold text-white">Public URL</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">Preview, iterate, publish, and share.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(217,70,239,0.3)] transition hover:scale-[1.02]"
              >
                Sign up to start
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/8"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_0_60px_rgba(15,23,42,0.45)]">
            <div className="rounded-[1.5rem] border border-fuchsia-400/15 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.18),_transparent_55%),linear-gradient(180deg,_rgba(15,23,42,0.85),_rgba(15,23,42,0.98))] p-8">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.26em] text-slate-400">
                <span>Live concept</span>
                <span>Neon Voltage Run</span>
              </div>
              <div className="mt-10 space-y-4">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-200">
                  Limited release  07.16.2026
                </p>
                <h2 className="text-4xl font-semibold text-white">
                  Build the waitlist page before the drop starts trending.
                </h2>
                <p className="max-w-md text-sm leading-7 text-slate-300">
                  Launchpad is a lightweight studio for merchants who want premium release pages
                  without building each campaign from scratch.
                </p>
              </div>
              <div className="mt-10 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                  Generate a themed page with a countdown and notify form.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                  Iterate on copy, visuals, and atmosphere in plain English.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                  Publish a shareable public link when the page is ready.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {featureCards.map((feature) => (
          <article
            key={feature.title}
            className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          >
            <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">{feature.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 text-center shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.32em] text-cyan-200">Hackathon demo</p>
        <h2 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
          From brief to public page without leaving the browser.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-300">
          Launchpad is built for fast iteration. Create a drop, generate a page, refine the output,
          and ship the public experience from one workflow.
        </p>
        <Link
          to="/signup"
          className="mt-8 inline-flex rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(217,70,239,0.3)] transition hover:scale-[1.02]"
        >
          Create an account
        </Link>
      </section>
    </main>
  );
}
