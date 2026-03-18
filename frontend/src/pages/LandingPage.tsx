import { Link } from "react-router-dom";

const featureCards = [
  {
    title: "Describe the drop",
    body: "Give Launchpad a name, vibe, story, and drop date. It turns rough intent into a polished campaign concept.",
  },
  {
    title: "Generate the page",
    body: "Codex produces a fully themed single-file landing page with a countdown, product story, and notify form.",
  },
  {
    title: "Iterate in plain English",
    body: "Ask for stronger visuals, sharper copy, or a completely different mood without opening a design tool.",
  },
];

export function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-14 md:py-20">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-fuchsia-200">
            AI-powered drop pages
          </span>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
              Launch limited-edition drops with a page that already feels sold out.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Launchpad gives merchants a fast path from product idea to high-polish landing
              page. Describe the drop, generate the experience, refine it with prompts, then
              publish when the story feels right.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(217,70,239,0.3)] transition hover:scale-[1.02]"
            >
              Start building
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/8"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_0_60px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="rounded-[1.5rem] border border-fuchsia-400/15 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.18),_transparent_55%),linear-gradient(180deg,_rgba(15,23,42,0.85),_rgba(15,23,42,0.98))] p-8">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.26em] text-slate-400">
              <span>Preview Signal</span>
              <span>Midnight Carbon Capsule</span>
            </div>
            <div className="mt-10 space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-200">
                04.19.2026  08:00 PM EST
              </p>
              <h2 className="text-4xl font-semibold text-white">Built for the drop before the drop.</h2>
              <p className="max-w-md text-sm leading-7 text-slate-300">
                Strong typography, a cinematic palette, and urgency-driven layouts generated from
                a simple merchant brief.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4">
                <div className="text-2xl font-semibold text-white">48</div>
                <div className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">Hours</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4">
                <div className="text-2xl font-semibold text-white">12</div>
                <div className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">Minutes</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4">
                <div className="text-2xl font-semibold text-white">09</div>
                <div className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">Seconds</div>
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
    </main>
  );
}
