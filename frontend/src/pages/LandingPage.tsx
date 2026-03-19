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
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-10 px-6 py-12 md:py-16">
      <section className="launchpad-panel-strong overflow-hidden px-6 py-8 md:px-8 md:py-10">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-6">
            <span className="launchpad-label inline-flex border border-[var(--lp-border)] px-3 py-2 text-[var(--lp-accent)]">
              AI landing pages for product drops
            </span>
            <div className="space-y-5">
              <h1 className="max-w-5xl text-4xl font-semibold tracking-tight text-[var(--lp-fg)] md:text-6xl">
                Launchpad turns a drop brief into a polished public page in minutes.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-[var(--lp-muted)] md:text-lg">
                Merchants describe the release, Codex generates a premium landing page, and every
                revision happens through simple prompts instead of design handoffs or hand-coded
                one-offs.
              </p>
            </div>
            <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
              <div className="bg-[rgba(8,9,9,0.86)] p-4">
                <p className="launchpad-label">Input</p>
                <p className="mt-3 text-2xl font-semibold text-[var(--lp-fg)]">Brief</p>
                <p className="mt-3 text-sm leading-7 text-[var(--lp-muted)]">
                  Name, description, vibe, and date.
                </p>
              </div>
              <div className="bg-[rgba(8,9,9,0.86)] p-4">
                <p className="launchpad-label">Engine</p>
                <p className="mt-3 text-2xl font-semibold text-[var(--lp-fg)]">Codex</p>
                <p className="mt-3 text-sm leading-7 text-[var(--lp-muted)]">
                  Single-file HTML with inline styling and scripts.
                </p>
              </div>
              <div className="bg-[rgba(8,9,9,0.86)] p-4">
                <p className="launchpad-label">Output</p>
                <p className="mt-3 text-2xl font-semibold text-[var(--lp-fg)]">Public URL</p>
                <p className="mt-3 text-sm leading-7 text-[var(--lp-muted)]">
                  Preview, iterate, publish, and share.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="launchpad-button-primary px-6 py-3 text-sm font-semibold uppercase tracking-[0.22em]"
              >
                Sign up to start
              </Link>
              <Link
                to="/login"
                className="launchpad-button-secondary px-6 py-3 text-sm font-medium uppercase tracking-[0.22em]"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="launchpad-terminal-frame preview-glow overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <WindowDot tone="bg-[#ff7b72]" />
              <WindowDot tone="bg-[#f2cc60]" />
              <WindowDot tone="bg-[var(--lp-accent)]" />
              <p className="ml-3 text-[11px] uppercase tracking-[0.24em] text-[var(--lp-muted)]">
                live concept / output shell
              </p>
            </div>
            <div className="grid gap-px bg-white/10 lg:grid-cols-[0.72fr_0.28fr]">
              <div className="bg-[rgba(8,9,9,0.96)] p-8">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.26em] text-[var(--lp-muted)]">
                  <span>Live concept</span>
                  <span>Neon Voltage Run</span>
                </div>
                <div className="mt-10 space-y-4">
                  <p className="text-sm font-medium uppercase tracking-[0.3em] text-[var(--lp-accent)]">
                  Limited release  07.16.2026
                  </p>
                  <h2 className="text-3xl font-semibold text-[var(--lp-fg)] md:text-4xl">
                    Build the waitlist page before the drop starts trending.
                  </h2>
                  <p className="max-w-md text-sm leading-7 text-[var(--lp-muted)]">
                    Launchpad is a lightweight studio for merchants who want premium release pages
                    without building each campaign from scratch.
                  </p>
                </div>
              </div>
              <div className="bg-[rgba(12,14,14,0.98)] p-6">
                <p className="launchpad-label">Process</p>
                <div className="mt-6 space-y-4">
                  <div className="border border-white/10 px-4 py-4 text-sm text-[var(--lp-fg)]">
                    Generate a themed page with a countdown and notify form.
                  </div>
                  <div className="border border-white/10 px-4 py-4 text-sm text-[var(--lp-fg)]">
                    Iterate on copy, visuals, and atmosphere in plain English.
                  </div>
                  <div className="border border-white/10 px-4 py-4 text-sm text-[var(--lp-fg)]">
                    Publish a shareable public link when the page is ready.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
        {featureCards.map((feature) => (
          <article key={feature.title} className="bg-[rgba(8,9,9,0.82)] p-6">
            <p className="launchpad-label">Workflow</p>
            <h3 className="mt-4 text-xl font-semibold text-[var(--lp-fg)]">{feature.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--lp-muted)]">{feature.body}</p>
          </article>
        ))}
      </section>

      <section className="launchpad-panel px-6 py-8 md:px-8 md:py-10">
        <p className="launchpad-label text-[var(--lp-accent)]">Hackathon demo</p>
        <h2 className="mt-4 max-w-4xl text-3xl font-semibold text-[var(--lp-fg)] md:text-4xl">
          From brief to public page without leaving the browser.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--lp-muted)]">
          Launchpad is built for fast iteration. Create a drop, generate a page, refine the output,
          and ship the public experience from one workflow.
        </p>
        <Link
          to="/signup"
          className="launchpad-button-primary mt-8 px-6 py-3 text-sm font-semibold uppercase tracking-[0.22em]"
        >
          Create an account
        </Link>
      </section>
    </main>
  );
}

interface WindowDotProps {
  tone: string;
}

function WindowDot({ tone }: WindowDotProps) {
  return <span className={`h-2.5 w-2.5 rounded-full ${tone}`} />;
}
