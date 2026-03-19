import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ApiError, apiFetch } from "../lib/api";

interface PromptHistoryEntry {
  role: string;
  content: string;
}

interface DropSummary {
  id: string;
  name: string;
  description: string;
  vibe: string;
  drop_date: string;
  generated_html: string | null;
  prompt_history: PromptHistoryEntry[];
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

interface CreateDropFormState {
  name: string;
  description: string;
  vibe: string;
  dropDate: string;
}

interface SamplePreset {
  id: string;
  category: string;
  name: string;
  description: string;
  vibe: string;
  daysFromNow: number;
}

const VIBE_OPTIONS = [
  { label: "Streetwear Hype", value: "streetwear hype" },
  { label: "Luxury Minimal", value: "luxury minimal" },
  { label: "Y2K Retro", value: "y2k retro" },
  { label: "Cyberpunk", value: "cyberpunk" },
  { label: "Clean & Modern", value: "clean & modern" },
];

const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: "limited-edition-sneaker",
    category: "Limited-edition sneaker",
    name: "Phantom Sprint 01",
    description:
      "A midnight performance runner built for a tight collector drop, cinematic product framing, and a countdown that feels like a release event.",
    vibe: "streetwear hype",
    daysFromNow: 10,
  },
  {
    id: "hot-sauce-collab",
    category: "Hot sauce collab",
    name: "Scoville Syndicate Reserve",
    description:
      "A chef-led hot sauce collaboration with glossy bottle visuals, scarcity-driven copy, and a launch page tuned for impulse signups and social buzz.",
    vibe: "cyberpunk",
    daysFromNow: 16,
  },
  {
    id: "vinyl-record-drop",
    category: "Vinyl record drop",
    name: "After Hours Pressing",
    description:
      "A limited vinyl pressing with analog texture, collector-focused storytelling, and a polished waitlist experience for fans chasing the first run.",
    vibe: "luxury minimal",
    daysFromNow: 21,
  },
];

const initialFormState: CreateDropFormState = {
  name: "",
  description: "",
  vibe: VIBE_OPTIONS[0].value,
  dropDate: "",
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { user } = useAuth();
  const [drops, setDrops] = useState<DropSummary[]>([]);
  const [isLoadingDrops, setIsLoadingDrops] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [form, setForm] = useState<CreateDropFormState>(initialFormState);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadDrops() {
      try {
        const response = await apiFetch<DropSummary[]>("/drops/");
        setDrops(response);
      } catch (error) {
        if (error instanceof ApiError) {
          setLoadError(error.message);
        } else {
          setLoadError("Unable to load drops right now.");
        }
      } finally {
        setIsLoadingDrops(false);
      }
    }

    void loadDrops();
  }, []);

  function applySamplePreset(preset: SamplePreset) {
    setForm({
      name: preset.name,
      description: preset.description,
      vibe: preset.vibe,
      dropDate: getNearFutureDate(preset.daysFromNow),
    });
    setFormError("");
  }

  async function handleCreateDrop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const createdDrop = await apiFetch<DropSummary>("/drops/", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          vibe: form.vibe,
          drop_date: toDropDateIso(form.dropDate),
        }),
      });

      setDrops((current) => [createdDrop, ...current]);
      setForm(initialFormState);
      setIsComposerOpen(false);
      showSuccess({
        title: "Drop created",
        description: "The draft is ready for editing.",
      });
      navigate(`/drops/${createdDrop.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        showError({
          title: "Could not create drop",
          description: error.message,
        });
      } else {
        setFormError("Unable to create the drop right now.");
        showError({
          title: "Could not create drop",
          description: "Unable to create the drop right now.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-14">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(217,70,239,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(34,211,238,0.12),_transparent_28%),rgba(15,23,42,0.82)] p-8 shadow-[0_20px_100px_rgba(2,6,23,0.5)] backdrop-blur">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.32em] text-fuchsia-200">
              Merchant command
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                {user?.email} is now running a live drop pipeline.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-300">
                Shape the creative direction, push a page through Codex, and watch every draft
                start looking like it already sold out. The cards below are now live, previewable,
                and ready for generation smoke tests.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsComposerOpen(true)}
              className="rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(217,70,239,0.3)] transition hover:scale-[1.02]"
            >
              Create New Drop
            </button>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-slate-300">
              {drops.length} campaign{drops.length === 1 ? "" : "s"} loaded
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Pipeline"
          value={String(drops.length)}
          body="Every card is wired to a real backend record and ready for generate/publish passes."
        />
        <MetricCard
          label="Latest motion"
          value={drops[0]?.name ?? "Ready"}
          body={
            drops[0]
              ? `Touched ${formatRelativeDate(drops[0].updated_at)}. ${capitalize(drops[0].status)} state.`
              : "Open the composer, lock the date, and create the first campaign shell."
          }
        />
        <MetricCard
          label="Preview mode"
          value={isLoadingDrops ? "Syncing" : loadError ? "Blocked" : "Armed"}
          body={loadError || "Generated drops render miniature previews right on the dashboard."}
        />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-400">
              Drop gallery
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Launch lineup</h2>
          </div>

          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10"
          >
            New draft
          </button>
        </div>

        {isLoadingDrops ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="launchpad-shimmer h-[26rem] rounded-[1.75rem] border border-white/10 bg-white/[0.04]"
              />
            ))}
          </div>
        ) : loadError ? (
          <div className="mt-6 rounded-[1.5rem] border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {loadError}
          </div>
        ) : drops.length === 0 ? (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-white/10 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.08),_transparent_40%),rgba(255,255,255,0.03)] px-6 py-16 text-center">
            <p className="text-lg font-medium text-white">No drops in motion yet.</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-300">
              Create a launch brief to start generating pages, iterating on the vibe, and pushing
              a public link live.
            </p>
            <button
              type="button"
              onClick={() => setIsComposerOpen(true)}
              className="mt-6 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(217,70,239,0.28)] transition hover:scale-[1.02]"
            >
              Create first drop
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {drops.map((drop) => (
              <Link
                key={drop.id}
                to={`/drops/${drop.id}`}
                className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] transition hover:-translate-y-1 hover:border-fuchsia-400/30 hover:shadow-[0_18px_45px_rgba(8,15,30,0.45)]"
              >
                <div className="preview-glow relative m-4 overflow-hidden rounded-[1.35rem] border border-white/10 bg-slate-950">
                  {drop.generated_html ? (
                    <div className="pointer-events-none h-48 overflow-hidden bg-slate-950">
                      <iframe
                        title={`${drop.name} thumbnail preview`}
                        srcDoc={drop.generated_html}
                        className="h-[720px] w-[1280px] origin-top-left scale-[0.375] border-0 bg-white"
                      />
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.18),_transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.8),rgba(2,6,23,0.95))]">
                      <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-slate-300">
                        Awaiting first generation
                      </div>
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
                </div>

                <div className="space-y-4 px-5 pb-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={drop.status} />
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-100">
                          {formatVibe(drop.vibe)}
                        </span>
                      </div>
                      <h3 className="text-2xl font-semibold text-white transition group-hover:text-fuchsia-100">
                        {drop.name}
                      </h3>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-300">
                      {drop.generated_html ? "Preview ready" : "No HTML"}
                    </span>
                  </div>

                  <p className="line-clamp-3 text-sm leading-7 text-slate-300">{drop.description}</p>

                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>{formatDropDate(drop.drop_date)}</span>
                    <span>{drop.prompt_history.length} prompt{drop.prompt_history.length === 1 ? "" : "s"}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {isComposerOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-10">
          <button
            type="button"
            aria-label="Close create drop modal"
            onClick={() => {
              setIsComposerOpen(false);
              setForm(initialFormState);
              setFormError("");
            }}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
          />

          <section className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.18),_transparent_38%),radial-gradient(circle_at_right,_rgba(34,211,238,0.12),_transparent_28%),rgba(15,23,42,0.96)] p-8 shadow-[0_30px_120px_rgba(2,6,23,0.7)]">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-[0.32em] text-cyan-200">
                  New drop
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-white">
                  Launch a merchant-ready campaign brief
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-300">
                  Start from a polished sample or write your own brief. Either way, Launchpad turns
                  the product story into a draft landing page workflow without slowing down the demo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsComposerOpen(false);
                  setForm(initialFormState);
                  setFormError("");
                }}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form className="grid gap-5 md:grid-cols-2" onSubmit={handleCreateDrop}>
              <div className="md:col-span-2 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.28em] text-fuchsia-200">
                      Campaign starters
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">
                      One-click sample briefs
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                      Use a preset to drop straight into a polished merchant scenario, then fine-tune
                      the copy before you create the draft.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                    Fully editable after selection
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {SAMPLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applySamplePreset(preset)}
                      className="text-left rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 transition hover:-translate-y-0.5 hover:border-fuchsia-400/35 hover:bg-white/[0.07]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-100">
                          {preset.category}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                          {formatVibe(preset.vibe)}
                        </span>
                      </div>
                      <h4 className="mt-4 text-xl font-semibold text-white">{preset.name}</h4>
                      <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-300">
                        {preset.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-[0.22em] text-slate-400">
                          Launches {formatRelativeDateOnly(getNearFutureDate(preset.daysFromNow))}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white">
                          Use sample brief
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-1">
                <label htmlFor="drop-name" className="mb-2 block text-sm font-medium text-slate-200">
                  Name
                </label>
                <input
                  id="drop-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:bg-white/[0.07]"
                  placeholder="Midnight Carbon Capsule"
                  required
                />
              </div>

              <div className="md:col-span-1">
                <label htmlFor="drop-date" className="mb-2 block text-sm font-medium text-slate-200">
                  Drop date
                </label>
                <input
                  id="drop-date"
                  type="date"
                  value={form.dropDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, dropDate: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-fuchsia-400/60 focus:bg-white/[0.07]"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="drop-vibe" className="mb-2 block text-sm font-medium text-slate-200">
                  Vibe
                </label>
                <select
                  id="drop-vibe"
                  value={form.vibe}
                  onChange={(event) => setForm((current) => ({ ...current, vibe: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-fuchsia-400/60"
                >
                  {VIBE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="drop-description"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Merchant brief
                </label>
                <textarea
                  id="drop-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="min-h-40 w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:bg-white/[0.07]"
                  placeholder="Describe the product, the collector energy, and the kind of page experience merchants should expect to ship."
                  required
                />
              </div>

              {formError ? (
                <div className="md:col-span-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {formError}
                </div>
              ) : null}

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(217,70,239,0.3)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Creating drop..." : "Create drop"}
                </button>
                <p className="self-center text-sm leading-7 text-slate-400">
                  Fast path for demos: pick a preset, create the draft, then generate immediately.
                </p>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  body: string;
}

function MetricCard({ label, value, body }: MetricCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-7 text-slate-300">{body}</p>
    </article>
  );
}

interface StatusBadgeProps {
  status: "draft" | "published";
}

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${
        status === "published"
          ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
          : "border border-amber-400/30 bg-amber-500/10 text-amber-200"
      }`}
    >
      {status}
    </span>
  );
}

function formatDropDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatRelativeDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRelativeDateOnly(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatVibe(value: string): string {
  return value
    .split(" ")
    .map((token) => capitalize(token))
    .join(" ");
}

function toDropDateIso(value: string): string {
  return new Date(`${value}T12:00:00`).toISOString();
}

function getNearFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}
