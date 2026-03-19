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
  const [isActivityOpen, setIsActivityOpen] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewMode, setPreviewMode] = useState<"latest" | "compare">("latest");
  const [previousGeneratedHtml, setPreviousGeneratedHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCopyingPublicUrl, setIsCopyingPublicUrl] = useState(false);
  const [showPublishSuccessBanner, setShowPublishSuccessBanner] = useState(false);
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
        setPreviousGeneratedHtml(null);
        setPreviewMode("latest");
        setShowPublishSuccessBanner(false);
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

  useEffect(() => {
    if (isGenerating) {
      setIsActivityOpen(true);
    }
  }, [isGenerating]);

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

    const currentGeneratedHtml = drop.generated_html;

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
      setPreviousGeneratedHtml(currentGeneratedHtml);
      setPreviewMode(currentGeneratedHtml ? "compare" : "latest");
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
      setShowPublishSuccessBanner(true);
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

  const canCompare = Boolean(previousGeneratedHtml && drop?.generated_html);
  const isCompareMode = canCompare && previewMode === "compare";
  const generateButtonLabel = isGenerating
    ? "Generating..."
    : drop?.generated_html
      ? iterationPrompt.trim()
        ? "Iterate"
        : "Regenerate"
      : "Generate";
  const previewStatusLabel = isGenerating
    ? "Rendering in progress"
    : drop?.generated_html
      ? "HTML loaded"
      : "No output yet";
  const promptCount = drop?.prompt_history.length ?? 0;
  const activePrompt =
    isGenerating && drop
      ? iterationPrompt.trim() || "Create the first polished landing page version for this product drop."
      : drop?.prompt_history[drop.prompt_history.length - 1]?.content ?? null;
  const previousPrompts =
    isGenerating
      ? drop?.prompt_history.slice().reverse() ?? []
      : drop?.prompt_history.slice(0, -1).reverse() ?? [];
  const generationState = getGenerationState({
    isGenerating,
    hasGeneratedHtml: Boolean(drop?.generated_html),
    status: drop?.status ?? "draft",
    promptCount,
  });

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
        <section className="space-y-6">
          {showPublishSuccessBanner ? (
            <section className="overflow-hidden rounded-[2rem] border border-emerald-300/25 bg-[linear-gradient(135deg,rgba(6,78,59,0.9),rgba(15,23,42,0.96))] shadow-[0_24px_80px_rgba(16,185,129,0.12)]">
              <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-7">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.32em] text-emerald-200">
                    Launch is live
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                    {drop.status === "published" ? "The public drop page is now live." : "Publish complete."}
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-emerald-50/90">
                    Share the launch link immediately or open the public experience in a new tab to
                    verify the live page.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:scale-[1.02]"
                    >
                      Open public page
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyPublicUrl}
                      disabled={isCopyingPublicUrl}
                      className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCopyingPublicUrl ? "Copying..." : "Copy public URL"}
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4 backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">
                        Public URL
                      </p>
                      <p className="mt-2 text-sm text-emerald-50/90">
                        This is the link customers can open right now.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPublishSuccessBanner(false)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white transition hover:border-white/20 hover:bg-white/10"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-4">
                    <p className="break-all text-sm text-white">{publicUrl}</p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
            <div className="space-y-6">
            <section className="sticky top-24 z-10 rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(15,23,42,0.8))] p-6 shadow-[0_20px_80px_rgba(2,6,23,0.5)] backdrop-blur-xl">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.28em] text-cyan-200">
                    Primary actions
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Keep the drop moving</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  {drop.generated_html ? "Ready to iterate" : "Ready for first render"}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`launchpad-action-button rounded-[1.25rem] px-5 py-4 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(217,70,239,0.26)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-80 ${
                    isGenerating
                      ? "launchpad-action-button-loading"
                      : "bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400"
                  }`}
                >
                  {generateButtonLabel}
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing || !drop.generated_html}
                  className="rounded-[1.25rem] border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/45 hover:bg-emerald-500/18 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPublishing ? "Publishing..." : drop.status === "published" ? "Republish" : "Publish"}
                </button>

                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-[1.25rem] border border-white/10 bg-white/5 px-5 py-4 text-center text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/8"
                >
                  Open public page
                </a>

                <button
                  type="button"
                  onClick={handleCopyPublicUrl}
                  disabled={isCopyingPublicUrl}
                  className="rounded-[1.25rem] border border-white/10 bg-white/5 px-5 py-4 text-sm font-medium text-white transition hover:border-cyan-400/35 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCopyingPublicUrl ? "Copying..." : "Copy link"}
                </button>
              </div>

              <div className="mt-5 rounded-[1.25rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">
                      Public page
                    </p>
                    <p className="mt-1 text-sm text-emerald-100">
                      {drop.status === "published"
                        ? "Visitors are seeing the live landing page right now."
                        : drop.generated_html
                          ? "Publish when this version is ready. Until then the public route stays on the placeholder."
                          : "Generate a page first, then publish when the preview feels launch-ready."}
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-100">
                    {drop.status}
                  </span>
                </div>
                <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-slate-950/45 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    Shareable URL
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 break-all text-sm text-white underline decoration-white/20 underline-offset-4"
                    >
                      {publicUrl}
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyPublicUrl}
                      disabled={isCopyingPublicUrl}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white transition hover:border-cyan-400/35 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCopyingPublicUrl ? "Copying..." : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </section>

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
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-cyan-200">
                  Iteration prompt
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Direct the next render</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  Give Codex one clear instruction at a time. The sticky action rail keeps generate,
                  publish, and share controls pinned while you scroll through revisions.
                </p>
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
            </section>

            <GenerationActivityPanel
              isOpen={isActivityOpen}
              onToggle={() => setIsActivityOpen((current) => !current)}
              latestPrompt={activePrompt}
              previousPrompts={previousPrompts}
              promptCount={promptCount}
              generationState={generationState}
              isGenerating={isGenerating}
              lastUpdatedAt={drop.updated_at}
            />
          </div>

          <section className="preview-glow sticky top-24 overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_35%),rgba(2,6,23,0.95)] shadow-[0_20px_90px_rgba(2,6,23,0.6)]">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.28em] text-cyan-200">
                    Live preview
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Rendered landing page</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                    Flip between desktop and mobile framing, then compare the last session render
                    against the newest output after each successful iteration.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  {previewStatusLabel}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-4">
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-1">
                  <div className="flex gap-1">
                    <PreviewToggleButton
                      label="Desktop"
                      isActive={previewDevice === "desktop"}
                      onClick={() => setPreviewDevice("desktop")}
                    />
                    <PreviewToggleButton
                      label="Mobile"
                      isActive={previewDevice === "mobile"}
                      onClick={() => setPreviewDevice("mobile")}
                    />
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-1">
                  <div className="flex gap-1">
                    <PreviewToggleButton
                      label="Latest"
                      isActive={!isCompareMode}
                      onClick={() => setPreviewMode("latest")}
                    />
                    <PreviewToggleButton
                      label="Compare"
                      isActive={isCompareMode}
                      onClick={() => setPreviewMode("compare")}
                      disabled={!canCompare}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative min-h-[72vh] bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.06),transparent_28%),#020617]">
              {isCompareMode ? (
                <div className="overflow-x-auto px-6 pb-6 pt-6">
                  <div className="grid min-w-[820px] grid-cols-2 gap-4">
                    <PreviewStage
                      title="Previous version"
                      description="The most recent session render before the latest successful iteration."
                      html={previousGeneratedHtml}
                      dropName={drop.name}
                      device={previewDevice}
                      frameTitle={`${drop.name} previous preview`}
                    />
                    <PreviewStage
                      title="Current version"
                      description="The latest generated output now active on this drop."
                      html={drop.generated_html}
                      dropName={drop.name}
                      device={previewDevice}
                      frameTitle={`${drop.name} current preview`}
                    />
                  </div>
                </div>
              ) : (
                <div className="px-6 pb-6 pt-6">
                  <PreviewStage
                    title={drop.generated_html ? "Current version" : "Preview waiting"}
                    description={
                      drop.generated_html
                        ? "This is the current landing page draft reflected on the drop."
                        : "Generate the first version to bring the landing page into focus."
                    }
                    html={drop.generated_html}
                    dropName={drop.name}
                    device={previewDevice}
                    frameTitle={`${drop.name} generated preview`}
                  />
                </div>
              )}

              {isGenerating ? (
                <div className="absolute inset-0 bg-slate-950/72 backdrop-blur-sm">
                  <div className="launchpad-preview-loading absolute inset-4 rounded-[1.75rem] border border-fuchsia-400/20 bg-[linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.1),rgba(255,255,255,0.04))]" />
                  <div className="absolute inset-x-6 top-6 rounded-[1.5rem] border border-white/10 bg-slate-950/82 p-5 shadow-[0_20px_60px_rgba(2,6,23,0.5)]">
                    <p className="text-xs font-medium uppercase tracking-[0.28em] text-fuchsia-200">
                      Codex render in flight
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">
                      {drop.generated_html
                        ? "Composing the next iteration"
                        : "Drafting the first landing page"}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {iterationPrompt.trim()
                        ? iterationPrompt
                        : "Using the current product brief to build a polished, self-contained landing page."}
                    </p>
                  </div>
                  <div className="absolute inset-x-6 bottom-6 grid gap-4 md:grid-cols-3">
                    <div className="launchpad-shimmer h-28 rounded-[1.5rem] border border-white/10 bg-white/[0.06]" />
                    <div className="launchpad-shimmer h-28 rounded-[1.5rem] border border-white/10 bg-white/[0.06]" />
                    <div className="launchpad-shimmer h-28 rounded-[1.5rem] border border-white/10 bg-white/[0.06]" />
                  </div>
                </div>
              ) : null}
            </div>
          </section>
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

interface GenerationActivityPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  latestPrompt: string | null;
  previousPrompts: PromptHistoryEntry[];
  promptCount: number;
  generationState: GenerationState;
  isGenerating: boolean;
  lastUpdatedAt: string;
}

interface GenerationState {
  label: string;
  detail: string;
  tone: string;
  badgeTone: string;
}

function GenerationActivityPanel({
  isOpen,
  onToggle,
  latestPrompt,
  previousPrompts,
  promptCount,
  generationState,
  isGenerating,
  lastUpdatedAt,
}: GenerationActivityPanelProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_38%),rgba(15,23,42,0.82)] shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur">
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-400">
              Generation activity
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Runtime trace</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              This landing page is generated programmatically by a runtime agent connected to
              Codex, then stored on this drop as the latest HTML draft.
            </p>
          </div>

          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-400/35 hover:bg-cyan-500/10"
          >
            {isOpen ? "Hide details" : "Show details"}
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <article className={`rounded-[1.35rem] border px-4 py-4 ${generationState.tone}`}>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
              Generation state
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${generationState.badgeTone}`} />
              <p className="text-base font-semibold text-white">{generationState.label}</p>
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-300">{generationState.detail}</p>
          </article>

          <article className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Last updated</p>
            <p className="mt-3 text-base font-semibold text-white">{formatActivityTimestamp(lastUpdatedAt)}</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              The timestamp refreshes whenever a new draft is saved or the drop metadata changes.
            </p>
          </article>

          <article className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Prompt trail</p>
            <p className="mt-3 text-base font-semibold text-white">
              {promptCount} prompt{promptCount === 1 ? "" : "s"} recorded
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Each successful generation saves the exact instruction that shaped the current page.
            </p>
          </article>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-white/10 bg-slate-950/25 px-6 py-6">
          <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <article className="rounded-[1.5rem] border border-cyan-400/20 bg-cyan-500/[0.08] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200">
                    Latest prompt
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {isGenerating ? "Current request in flight" : "Most recent saved instruction"}
                  </h3>
                </div>
                {isGenerating ? (
                  <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-fuchsia-100">
                    In flight
                  </span>
                ) : null}
              </div>

              <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-slate-950/50 px-4 py-4">
                {latestPrompt ? (
                  <p className="text-sm leading-7 text-slate-200">{latestPrompt}</p>
                ) : (
                  <p className="text-sm leading-7 text-slate-300">
                    No prompt has been sent yet. When you generate the first draft, the instruction
                    used for that render will appear here.
                  </p>
                )}
              </div>
            </article>

            <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-300">
                    Previous prompts
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Revision trail</h3>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-300">
                  {previousPrompts.length}
                </span>
              </div>

              {previousPrompts.length === 0 ? (
                <div className="mt-4 rounded-[1.25rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm leading-7 text-slate-300">
                  Earlier prompts will stack here as you iterate.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {previousPrompts.map((entry, index) => (
                    <article
                      key={`${entry.role}-${index}-${entry.content}`}
                      className="rounded-[1.25rem] border border-white/10 bg-slate-950/45 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-100">
                          {entry.role}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                          Earlier prompt {previousPrompts.length - index}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-300">{entry.content}</p>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, htmlFor, children }: FieldProps) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      {children}
    </label>
  );
}

interface PreviewToggleButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function PreviewToggleButton({
  label,
  isActive,
  onClick,
  disabled = false,
}: PreviewToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      disabled={disabled}
      className={`rounded-[1rem] px-4 py-2 text-sm font-medium transition ${
        isActive
          ? "bg-white text-slate-950"
          : "bg-transparent text-slate-300 hover:bg-white/6 hover:text-white"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {label}
    </button>
  );
}

interface PreviewStageProps {
  title: string;
  description: string;
  html: string | null;
  dropName: string;
  device: "desktop" | "mobile";
  frameTitle: string;
}

function PreviewStage({ title, description, html, dropName, device, frameTitle }: PreviewStageProps) {
  const viewportHeightClass =
    device === "mobile" ? "h-[760px]" : "h-[72vh] min-h-[700px]";
  const shellWidthClass = device === "mobile" ? "max-w-[390px]" : "max-w-full";

  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 max-w-xl text-sm leading-7 text-slate-300">{description}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-300">
          {device}
        </span>
      </div>

      <div className={`mx-auto mt-5 w-full ${shellWidthClass}`}>
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
          <div className="flex items-center gap-2 border-b border-white/10 bg-slate-900/90 px-4 py-3">
            <WindowDot tone="bg-rose-400" />
            <WindowDot tone="bg-amber-300" />
            <WindowDot tone="bg-emerald-400" />
            <p className="ml-3 truncate text-xs uppercase tracking-[0.18em] text-slate-400">
              {dropName}
            </p>
          </div>

          <div className={`${viewportHeightClass} overflow-hidden bg-white`}>
            {html ? (
              <iframe title={frameTitle} srcDoc={html} className="h-full w-full border-0 bg-white" />
            ) : (
              <EmptyPreviewState device={device} />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

interface WindowDotProps {
  tone: string;
}

function WindowDot({ tone }: WindowDotProps) {
  return <span className={`h-2.5 w-2.5 rounded-full ${tone}`} />;
}

interface EmptyPreviewStateProps {
  device: "desktop" | "mobile";
}

function EmptyPreviewState({ device }: EmptyPreviewStateProps) {
  return (
    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.12),transparent_35%),#020617] px-8 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-[0.28em] text-slate-300">
          {device}
        </div>
        <h3 className="text-2xl font-semibold text-white">First render pending</h3>
        <p className="text-sm leading-7 text-slate-300">
          The preview shell is ready. Generate a landing page to populate this frame, then use
          compare mode after the next successful iteration.
        </p>
      </div>
    </div>
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

function getGenerationState({
  isGenerating,
  hasGeneratedHtml,
  status,
  promptCount,
}: {
  isGenerating: boolean;
  hasGeneratedHtml: boolean;
  status: "draft" | "published";
  promptCount: number;
}): GenerationState {
  if (isGenerating) {
    return {
      label: "Generating now",
      detail: "A runtime agent is composing the next landing-page draft through Codex.",
      tone: "border-fuchsia-400/20 bg-fuchsia-500/[0.08]",
      badgeTone: "bg-fuchsia-300",
    };
  }

  if (status === "published") {
    return {
      label: "Published",
      detail: "The current generated HTML is live on the public drop URL.",
      tone: "border-emerald-400/20 bg-emerald-500/[0.08]",
      badgeTone: "bg-emerald-300",
    };
  }

  if (hasGeneratedHtml) {
    return {
      label: "Latest draft ready",
      detail: "The current draft is saved and ready for another prompt or a publish pass.",
      tone: "border-cyan-400/20 bg-cyan-500/[0.08]",
      badgeTone: "bg-cyan-300",
    };
  }

  return {
    label: "Ready for first render",
    detail:
      promptCount > 0
        ? "The latest generation did not produce a stored HTML draft yet."
        : "The drop brief is saved and ready to send to the runtime agent.",
    tone: "border-amber-400/20 bg-amber-500/[0.08]",
    badgeTone: "bg-amber-300",
  };
}

function formatActivityTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function toDateInputValue(value: string): string {
  return value.slice(0, 10);
}

function toDropDateIso(value: string): string {
  return new Date(`${value}T12:00:00`).toISOString();
}
