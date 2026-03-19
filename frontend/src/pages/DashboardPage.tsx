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
  const [deletingDropId, setDeletingDropId] = useState<string | null>(null);

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

  async function handleDeleteDrop(dropId: string, dropName: string) {
    const shouldDelete = window.confirm(`Delete "${dropName}"? This cannot be undone.`);

    if (!shouldDelete) {
      return;
    }

    setDeletingDropId(dropId);

    try {
      await apiFetch<void>(`/drops/${dropId}`, {
        method: "DELETE",
      });
      setDrops((current) => current.filter((drop) => drop.id !== dropId));
      showSuccess({
        title: "Drop deleted",
        description: `"${dropName}" has been removed.`,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        showError({
          title: "Could not delete drop",
          description: error.message,
        });
      } else {
        showError({
          title: "Could not delete drop",
          description: "Unable to delete the drop right now.",
        });
      }
    } finally {
      setDeletingDropId(null);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-6 py-10 md:py-12">
      <section className="launchpad-panel-strong overflow-hidden">
        <div className="grid gap-px bg-white/10 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="bg-[rgba(8,9,9,0.9)] p-6 md:p-8">
            <p className="launchpad-label text-[var(--lp-accent)]">Merchant command</p>
            <div className="mt-5 space-y-5">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-[var(--lp-fg)] md:text-5xl">
                {user?.email} is now running a live drop pipeline.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-[var(--lp-muted)]">
                Shape the creative direction, push a page through Codex, and review every release
                from an archive that feels more like a publishing system than a CRUD surface.
              </p>
            </div>
          </div>

          <div className="grid gap-px bg-white/10 md:grid-cols-2">
            <div className="bg-[rgba(12,14,14,0.96)] p-6">
              <p className="launchpad-label">Status</p>
              <p className="mt-4 text-4xl font-semibold text-[var(--lp-fg)]">{drops.length}</p>
              <p className="mt-3 text-sm leading-7 text-[var(--lp-muted)]">
                campaign{drops.length === 1 ? "" : "s"} loaded into the archive.
              </p>
            </div>
            <div className="bg-[rgba(12,14,14,0.96)] p-6">
              <p className="launchpad-label">Latest motion</p>
              <p className="mt-4 text-lg font-semibold text-[var(--lp-fg)]">
                {drops[0]?.name ?? "Ready"}
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--lp-muted)]">
                {drops[0]
                  ? `Touched ${formatRelativeDate(drops[0].updated_at)}. ${capitalize(drops[0].status)} state.`
                  : "Open the composer and create the first campaign shell."}
              </p>
            </div>
            <div className="bg-[rgba(12,14,14,0.96)] p-6 md:col-span-2">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(true)}
                  className="launchpad-button-primary px-6 py-3 text-sm font-semibold uppercase tracking-[0.22em]"
                >
                  Create New Drop
                </button>
                <div className="border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.22em] text-[var(--lp-muted)]">
                  Preview mode / {isLoadingDrops ? "syncing" : loadError ? "blocked" : "armed"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
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

      <section className="launchpad-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="launchpad-label">Drop gallery</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--lp-fg)]">Launch archive</h2>
          </div>

          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="launchpad-button-secondary px-4 py-2 text-xs font-medium uppercase tracking-[0.22em]"
          >
            New draft
          </button>
        </div>

        {isLoadingDrops ? (
          <div className="mt-6 space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="launchpad-shimmer h-56 border border-white/10 bg-white/[0.04]"
              />
            ))}
          </div>
        ) : loadError ? (
          <div className="mt-6 border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {loadError}
          </div>
        ) : drops.length === 0 ? (
          <div className="mt-6 border border-dashed border-white/10 bg-[rgba(8,9,9,0.55)] px-6 py-16 text-center">
            <p className="text-lg font-medium text-[var(--lp-fg)]">No drops in motion yet.</p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--lp-muted)]">
              Create a launch brief to start generating pages, iterating on the vibe, and pushing
              a public link live.
            </p>
            <button
              type="button"
              onClick={() => setIsComposerOpen(true)}
              className="launchpad-button-primary mt-6 px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em]"
            >
              Create first drop
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {drops.map((drop) => (
              <article
                key={drop.id}
                className="border border-white/10 bg-[rgba(8,9,9,0.86)] transition hover:border-[rgba(200,255,97,0.28)] hover:bg-[rgba(11,12,12,0.96)]"
              >
                <div className="grid gap-px bg-white/10 xl:grid-cols-[minmax(340px,0.78fr)_minmax(0,1.22fr)]">
                  <div className="bg-[rgba(8,9,9,0.92)] p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <span className="launchpad-label border border-white/10 px-3 py-1 text-[var(--lp-muted)]">
                            Release
                          </span>
                          <StatusBadge status={drop.status} />
                          <span className="launchpad-label border border-white/10 px-3 py-1 text-[var(--lp-muted)]">
                            {formatVibe(drop.vibe)}
                          </span>
                        </div>
                        <Link to={`/drops/${drop.id}`} className="inline-block">
                          <h3 className="text-3xl font-semibold text-[var(--lp-fg)] transition hover:text-white">
                            {drop.name}
                          </h3>
                        </Link>
                      </div>
                      <span className="launchpad-label border border-white/10 px-3 py-2 text-[var(--lp-muted)]">
                        {drop.generated_html ? "Preview ready" : "No HTML"}
                      </span>
                    </div>

                    <p className="mt-5 max-w-2xl text-sm leading-8 text-[var(--lp-muted)]">
                      {drop.description}
                    </p>

                    <div className="mt-6 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 2xl:grid-cols-3">
                      <div className="min-w-0 bg-[rgba(12,14,14,0.96)] px-4 py-4">
                        <p className="launchpad-label">Drop date</p>
                        <p className="mt-3 break-words text-sm leading-7 text-[var(--lp-fg)]">
                          {formatDropDate(drop.drop_date)}
                        </p>
                      </div>
                      <div className="min-w-0 bg-[rgba(12,14,14,0.96)] px-4 py-4">
                        <p className="launchpad-label">Prompt trail</p>
                        <p className="mt-3 break-words text-sm leading-7 text-[var(--lp-fg)]">
                          {drop.prompt_history.length} prompt{drop.prompt_history.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="min-w-0 bg-[rgba(12,14,14,0.96)] px-4 py-4 sm:col-span-2 2xl:col-span-1">
                        <p className="launchpad-label">Updated</p>
                        <p className="mt-3 break-words text-sm leading-7 text-[var(--lp-fg)]">
                          {formatRelativeDate(drop.updated_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        to={`/drops/${drop.id}`}
                        className="launchpad-button-secondary px-4 py-2 text-xs font-medium uppercase tracking-[0.22em]"
                      >
                        Open editor
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteDrop(drop.id, drop.name)}
                        disabled={deletingDropId === drop.id}
                        className="launchpad-button-secondary px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-rose-200"
                      >
                        {deletingDropId === drop.id ? "Deleting..." : "Delete drop"}
                      </button>
                    </div>
                  </div>

                  <div className="p-5 xl:self-start">
                    <div className="launchpad-terminal-frame preview-glow overflow-hidden">
                      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#ff7b72]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#f2cc60]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--lp-accent)]" />
                        <p className="ml-3 text-[11px] uppercase tracking-[0.22em] text-[var(--lp-muted)]">
                          archive preview / {drop.name}
                        </p>
                      </div>

                      {drop.generated_html ? (
                        <div className="pointer-events-none h-[22rem] overflow-hidden bg-white">
                          <iframe
                            title={`${drop.name} thumbnail preview`}
                            srcDoc={drop.generated_html}
                            sandbox="allow-scripts allow-forms"
                            className="h-full w-full border-0 bg-white"
                          />
                        </div>
                      ) : (
                        <div className="flex h-[22rem] items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.01),transparent),rgba(8,9,9,0.98)] px-8 text-center">
                          <div>
                            <p className="launchpad-label">Awaiting first generation</p>
                            <p className="mt-4 text-sm leading-7 text-[var(--lp-muted)]">
                              Create the initial render to turn this row into a live artifact.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isComposerOpen ? (
        <div className="fixed inset-0 z-40 overflow-y-auto px-4 py-6 md:py-10">
          <button
            type="button"
            aria-label="Close create drop modal"
            onClick={() => {
              setIsComposerOpen(false);
              setForm(initialFormState);
              setFormError("");
            }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <div className="relative z-10 flex min-h-full items-start justify-center">
          <section className="launchpad-panel-strong relative z-10 my-auto w-full max-w-4xl max-h-[calc(100vh-3rem)] overflow-y-auto px-6 py-6 md:px-8 md:py-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="launchpad-label text-[var(--lp-accent)]">New drop</p>
                <h2 className="text-3xl font-semibold tracking-tight text-[var(--lp-fg)]">
                  Launch a merchant-ready campaign brief
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-[var(--lp-muted)]">
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
                className="launchpad-button-secondary px-4 py-2 text-xs uppercase tracking-[0.22em]"
              >
                Cancel
              </button>
            </div>

            <form className="grid gap-5 md:grid-cols-2" onSubmit={handleCreateDrop}>
              <div className="md:col-span-2 border border-white/10 bg-[rgba(8,9,9,0.74)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="launchpad-label text-[var(--lp-accent)]">Campaign starters</p>
                    <h3 className="mt-3 text-xl font-semibold text-[var(--lp-fg)]">One-click sample briefs</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--lp-muted)]">
                      Use a preset to drop straight into a polished merchant scenario, then fine-tune
                      the copy before you create the draft.
                    </p>
                  </div>
                  <div className="border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--lp-muted)]">
                    Fully editable after selection
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {SAMPLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applySamplePreset(preset)}
                      className="text-left border border-white/10 bg-[rgba(12,14,14,0.96)] p-4 transition hover:border-[rgba(200,255,97,0.3)] hover:bg-[rgba(16,18,18,1)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="launchpad-label border border-white/10 px-3 py-1 text-[var(--lp-muted)]">
                          {preset.category}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--lp-muted)]">
                          {formatVibe(preset.vibe)}
                        </span>
                      </div>
                      <h4 className="mt-4 text-xl font-semibold text-[var(--lp-fg)]">{preset.name}</h4>
                      <p className="mt-3 line-clamp-4 text-sm leading-7 text-[var(--lp-muted)]">
                        {preset.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-[0.22em] text-[var(--lp-muted)]">
                          Launches {formatRelativeDateOnly(getNearFutureDate(preset.daysFromNow))}
                        </span>
                        <span className="border border-white/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--lp-fg)]">
                          Use sample brief
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-1">
                <label htmlFor="drop-name" className="mb-2 block text-sm font-medium text-[var(--lp-fg)]">
                  Name
                </label>
                <input
                  id="drop-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="launchpad-input"
                  placeholder="Midnight Carbon Capsule"
                  required
                />
              </div>

              <div className="md:col-span-1">
                <label htmlFor="drop-date" className="mb-2 block text-sm font-medium text-[var(--lp-fg)]">
                  Drop date
                </label>
                <input
                  id="drop-date"
                  type="date"
                  value={form.dropDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, dropDate: event.target.value }))
                  }
                  className="launchpad-input"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="drop-vibe" className="mb-2 block text-sm font-medium text-[var(--lp-fg)]">
                  Vibe
                </label>
                <select
                  id="drop-vibe"
                  value={form.vibe}
                  onChange={(event) => setForm((current) => ({ ...current, vibe: event.target.value }))}
                  className="launchpad-input"
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
                  className="mb-2 block text-sm font-medium text-[var(--lp-fg)]"
                >
                  Merchant brief
                </label>
                <textarea
                  id="drop-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="launchpad-input min-h-40"
                  placeholder="Describe the product, the collector energy, and the kind of page experience merchants should expect to ship."
                  required
                />
              </div>

              {formError ? (
                <div className="md:col-span-2 border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {formError}
                </div>
              ) : null}

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="launchpad-button-primary px-6 py-3 text-sm font-semibold uppercase tracking-[0.22em]"
                >
                  {isSubmitting ? "Creating drop..." : "Create drop"}
                </button>
                <p className="self-center text-sm leading-7 text-[var(--lp-muted)]">
                  Fast path for demos: pick a preset, create the draft, then generate immediately.
                </p>
              </div>
            </form>
          </section>
          </div>
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
    <article className="bg-[rgba(8,9,9,0.84)] p-6">
      <p className="launchpad-label">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-[var(--lp-fg)]">{value}</p>
      <p className="mt-3 text-sm leading-7 text-[var(--lp-muted)]">{body}</p>
    </article>
  );
}

interface StatusBadgeProps {
  status: "draft" | "published";
}

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${
        status === "published"
          ? "border-[rgba(200,255,97,0.34)] bg-[rgba(200,255,97,0.1)] text-[var(--lp-accent)]"
          : "border-white/12 bg-white/[0.03] text-[var(--lp-fg)]"
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
