import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useToast } from "../context/ToastContext";
import { ApiError, apiFetch } from "../lib/api";

interface PromptHistoryEntry {
  role: string;
  content: string;
}

interface DropDetails {
  id: string;
  user_id: string;
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

interface UpdateDropFormState {
  name: string;
  description: string;
  vibe: string;
  dropDate: string;
}

interface GenerateResponse {
  html: string;
  prompt_used: string;
}

const VIBE_OPTIONS = [
  { label: "Streetwear Hype", value: "streetwear hype" },
  { label: "Luxury Minimal", value: "luxury minimal" },
  { label: "Y2K Retro", value: "y2k retro" },
  { label: "Cyberpunk", value: "cyberpunk" },
  { label: "Clean & Modern", value: "clean & modern" },
];

const ITERATION_PROMPT_SUGGESTIONS = [
  "Make the countdown bigger and more dramatic.",
  "Add a spinning sneaker animation in the hero.",
  "Switch to a red and black colorway.",
];

export function DropDetailsPage() {
  const { id } = useParams();
  const { showError, showSuccess } = useToast();
  const [drop, setDrop] = useState<DropDetails | null>(null);
  const [form, setForm] = useState<UpdateDropFormState | null>(null);
  const [iterationPrompt, setIterationPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCopyingPublicUrl, setIsCopyingPublicUrl] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDrop() {
      if (!id) {
        setError("Drop not found.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiFetch<DropDetails>(`/drops/${id}`);
        setDrop(response);
        setForm({
          name: response.name,
          description: response.description,
          vibe: response.vibe,
          dropDate: toDateInputValue(response.drop_date),
        });
      } catch (loadError) {
        if (loadError instanceof ApiError) {
          setError(loadError.message);
        } else {
          setError("Unable to load this drop right now.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadDrop();
  }, [id]);

  const publicUrl =
    drop && typeof window !== "undefined" ? `${window.location.origin}/drops/${drop.id}/public` : "";

  async function handleSaveMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!drop || !form) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedDrop = await apiFetch<DropDetails>(`/drops/${drop.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          vibe: form.vibe,
          drop_date: toDropDateIso(form.dropDate),
        }),
      });

      setDrop(updatedDrop);
      setForm({
        name: updatedDrop.name,
        description: updatedDrop.description,
        vibe: updatedDrop.vibe,
        dropDate: toDateInputValue(updatedDrop.drop_date),
      });
      showSuccess({
        title: "Metadata saved",
        description: "The drop brief has been updated.",
      });
    } catch (saveError) {
      if (saveError instanceof ApiError) {
        showError({
          title: "Could not save metadata",
          description: saveError.message,
        });
      } else {
        showError({
          title: "Could not save metadata",
          description: "Unable to save drop metadata right now.",
        });
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerate() {
    if (!drop) {
      return;
    }

    setIsGenerating(true);

    try {
      const response = await apiFetch<GenerateResponse>(`/drops/${drop.id}/generate`, {
        method: "POST",
        body: JSON.stringify({
          prompt:
            iterationPrompt.trim() ||
            "Create the first polished landing page version for this product drop.",
        }),
      });

      setDrop((current) =>
        current
          ? {
              ...current,
              generated_html: response.html,
              prompt_history: [
                ...current.prompt_history,
                { role: "user", content: response.prompt_used },
              ],
              updated_at: new Date().toISOString(),
            }
          : current
      );
      setIterationPrompt("");
      showSuccess({
        title: drop.generated_html ? "Iteration applied" : "Page generated",
        description: drop.generated_html
          ? "The latest prompt has been applied to the preview."
          : "The first landing page draft is ready.",
      });
    } catch (generateError) {
      if (generateError instanceof ApiError) {
        showError({
          title: "Generation failed",
          description: generateError.message,
        });
      } else {
        showError({
          title: "Generation failed",
          description: "Unable to generate the landing page right now.",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function handlePublish() {
    if (!drop) {
      return;
    }

    setIsPublishing(true);

    try {
      const response = await apiFetch<DropDetails>(`/drops/${drop.id}/publish`, {
        method: "POST",
      });
      setDrop(response);
      showSuccess({
        title: "Drop published",
        description: "The public URL is now live.",
      });
    } catch (publishError) {
      if (publishError instanceof ApiError) {
        showError({
          title: "Publish failed",
          description: publishError.message,
        });
      } else {
        showError({
          title: "Publish failed",
          description: "Unable to publish this drop right now.",
        });
      }
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleCopyPublicUrl() {
    if (!publicUrl) {
      return;
    }

    setIsCopyingPublicUrl(true);

    try {
      await navigator.clipboard.writeText(publicUrl);
      showSuccess({
        title: "Public URL copied",
        description: "The share link is ready to paste.",
      });
    } catch {
      showError({
        title: "Copy failed",
        description: "Clipboard access is unavailable in this browser.",
      });
    } finally {
      setIsCopyingPublicUrl(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-6 py-14">
      <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(217,70,239,0.16),_transparent_32%),rgba(15,23,42,0.82)] p-8 shadow-[0_24px_100px_rgba(2,6,23,0.55)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.32em] text-cyan-200">
              Drop editor
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
              {isLoading ? "Loading drop..." : drop?.name ?? "Unavailable drop"}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-300">
              Tune the metadata, steer the next iteration in plain English, and publish once the
              preview hits the right temperature.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {drop ? <StatusBadge status={drop.status} /> : null}
            <Link
              to="/dashboard"
              className="inline-flex rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/8"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-[1.75rem] border border-rose-400/30 bg-rose-500/10 px-6 py-5 text-sm text-rose-200">
          {error}
        </section>
      ) : null}

      {isLoading ? (
        <section className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
          <div className="launchpad-shimmer h-[52rem] rounded-[2rem] border border-white/10 bg-white/[0.04]" />
          <div className="launchpad-shimmer h-[52rem] rounded-[2rem] border border-white/10 bg-white/[0.04]" />
        </section>
      ) : drop && form ? (
        <section className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
          <div className="space-y-6">
            <form
              onSubmit={handleSaveMetadata}
              className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.28em] text-fuchsia-200">
                    Metadata
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Control panel</h2>
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : "Save metadata"}
                </button>
              </div>

              <div className="mt-6 grid gap-5">
                <Field label="Drop name" htmlFor="drop-name">
                  <input
                    id="drop-name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => (current ? { ...current, name: event.target.value } : current))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:bg-white/[0.07]"
                    required
                  />
                </Field>

                <Field label="Vibe" htmlFor="drop-vibe">
                  <select
                    id="drop-vibe"
                    value={form.vibe}
                    onChange={(event) =>
                      setForm((current) => (current ? { ...current, vibe: event.target.value } : current))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-fuchsia-400/60"
                  >
                    {VIBE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Drop date" htmlFor="drop-date">
                  <input
                    id="drop-date"
                    type="date"
                    value={form.dropDate}
                    onChange={(event) =>
                      setForm((current) =>
                        current ? { ...current, dropDate: event.target.value } : current
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-fuchsia-400/60 focus:bg-white/[0.07]"
                    required
                  />
                </Field>

                <Field label="Description" htmlFor="drop-description">
                  <textarea
                    id="drop-description"
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) =>
                        current ? { ...current, description: event.target.value } : current
                      )
                    }
                    className="min-h-36 w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:bg-white/[0.07]"
                    required
                  />
                </Field>
              </div>
            </form>

            <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.12),_transparent_40%),rgba(15,23,42,0.82)] p-6 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.28em] text-cyan-200">
                    Iteration prompt
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Direct the next render</h2>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`launchpad-action-button rounded-full px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(217,70,239,0.26)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-80 ${
                    isGenerating
                      ? "launchpad-action-button-loading"
                      : "bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400"
                  }`}
                >
                  {isGenerating
                    ? "Generating..."
                    : drop.generated_html
                      ? iterationPrompt.trim()
                        ? "Iterate"
                        : "Regenerate"
                      : "Generate"}
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <textarea
                  value={iterationPrompt}
                  onChange={(event) => setIterationPrompt(event.target.value)}
                  className="min-h-32 w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:bg-white/[0.07]"
                  placeholder="Make the countdown bigger. Add a stronger hero headline. Shift the palette toward midnight red."
                />

                <div className="flex flex-wrap gap-2">
                  {ITERATION_PROMPT_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setIterationPrompt(suggestion)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing || !drop.generated_html}
                  className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/45 hover:bg-emerald-500/18 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPublishing ? "Publishing..." : drop.status === "published" ? "Republish" : "Publish"}
                </button>

                {drop ? (
                  <button
                    type="button"
                    onClick={handleCopyPublicUrl}
                    disabled={isCopyingPublicUrl}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-cyan-400/35 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCopyingPublicUrl ? "Copying..." : "Copy public URL"}
                  </button>
                ) : null}

                {publicUrl ? (
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/8"
                  >
                    Open public page
                  </a>
                ) : null}
              </div>

              {publicUrl ? (
                <div className="mt-5 rounded-[1.25rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">
                        Public page
                      </p>
                      <p className="mt-1 text-sm text-emerald-100">
                        {drop.status === "published"
                          ? "Visitors will see the live landing page."
                          : "Visitors will see the Coming Soon placeholder until you publish."}
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-100">
                      {drop.status}
                    </span>
                  </div>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block break-all text-sm text-white underline decoration-white/20 underline-offset-4"
                  >
                    {publicUrl}
                  </a>
                </div>
              ) : null}
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-400">
                    Prompt history
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Revision trail</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  {drop.prompt_history.length} prompt{drop.prompt_history.length === 1 ? "" : "s"}
                </div>
              </div>

              {drop.prompt_history.length === 0 ? (
                <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] px-5 py-8 text-sm leading-7 text-slate-300">
                  No prompts yet. Hit generate to create the first page, then iterate from here.
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {drop.prompt_history
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <article
                        key={`${entry.role}-${index}-${entry.content}`}
                        className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-100">
                            {entry.role}
                          </span>
                          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            #{drop.prompt_history.length - index}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-300">{entry.content}</p>
                      </article>
                    ))}
                </div>
              )}
            </section>
          </div>

          <section className="preview-glow sticky top-24 overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_35%),rgba(2,6,23,0.95)] shadow-[0_20px_90px_rgba(2,6,23,0.6)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-cyan-200">
                  Live preview
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Rendered landing page</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                {drop.generated_html ? "HTML loaded" : "No output yet"}
              </div>
            </div>

            <div className="relative min-h-[72vh] bg-slate-950">
              {drop.generated_html ? (
                <iframe
                  title={`${drop.name} generated preview`}
                  srcDoc={drop.generated_html}
                  className="h-[72vh] w-full border-0 bg-white"
                />
              ) : (
                <div className="flex h-[72vh] items-center justify-center px-8 text-center">
                  <div className="max-w-md space-y-4">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-[0.28em] text-slate-300">
                      Preview
                    </div>
                    <h3 className="text-2xl font-semibold text-white">No generated page yet</h3>
                    <p className="text-sm leading-7 text-slate-300">
                      Use the prompt controls on the left to generate the first landing page.
                      Once HTML exists, this panel updates in place and becomes your live preview.
                    </p>
                  </div>
                </div>
              )}

              {isGenerating ? (
                <div className="absolute inset-0 bg-slate-950/58 backdrop-blur-[2px]">
                  <div className="launchpad-preview-loading absolute inset-5 rounded-[1.5rem] border border-fuchsia-400/20 bg-[linear-gradient(110deg,rgba(255,255,255,0.05),rgba(255,255,255,0.13),rgba(255,255,255,0.05))]" />
                  <div className="absolute inset-x-10 top-10 space-y-3">
                    <div className="launchpad-shimmer h-5 w-40 rounded-full bg-white/10" />
                    <div className="launchpad-shimmer h-4 w-72 rounded-full bg-white/10" />
                  </div>
                  <div className="absolute bottom-10 left-10 right-10 grid gap-3">
                    <div className="launchpad-shimmer h-20 rounded-[1.5rem] bg-white/10" />
                    <div className="launchpad-shimmer h-20 rounded-[1.5rem] bg-white/10" />
                    <div className="launchpad-shimmer h-20 rounded-[1.5rem] bg-white/10" />
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </section>
      ) : null}
    </main>
  );
}

interface FieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
}

function Field({ label, htmlFor, children }: FieldProps) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      {children}
    </label>
  );
}

interface StatusBadgeProps {
  status: "draft" | "published";
}

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`rounded-full px-4 py-3 text-sm font-medium uppercase tracking-[0.24em] ${
        status === "published"
          ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
          : "border border-amber-400/30 bg-amber-500/10 text-amber-200"
      }`}
    >
      {status}
    </span>
  );
}

function toDateInputValue(value: string): string {
  return value.slice(0, 10);
}

function toDropDateIso(value: string): string {
  return new Date(`${value}T12:00:00`).toISOString();
}
