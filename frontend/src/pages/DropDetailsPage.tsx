import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

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
  const navigate = useNavigate();
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
  const [isDeleting, setIsDeleting] = useState(false);
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

  async function handleDeleteDrop() {
    if (!drop) {
      return;
    }

    const shouldDelete = window.confirm(`Delete "${drop.name}"? This cannot be undone.`);

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await apiFetch<void>(`/drops/${drop.id}`, {
        method: "DELETE",
      });
      showSuccess({
        title: "Drop deleted",
        description: `"${drop.name}" has been removed.`,
      });
      navigate("/dashboard");
    } catch (deleteError) {
      if (deleteError instanceof ApiError) {
        showError({
          title: "Could not delete drop",
          description: deleteError.message,
        });
      } else {
        showError({
          title: "Could not delete drop",
          description: "Unable to delete this drop right now.",
        });
      }
    } finally {
      setIsDeleting(false);
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
    <main className="mx-auto flex w-full max-w-[1700px] flex-col gap-6 px-6 py-10 md:py-12">
      <section className="launchpad-panel-strong overflow-hidden">
        <div className="grid gap-px bg-white/10 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="bg-[rgba(8,9,9,0.9)] p-6 md:p-8">
            <p className="launchpad-label text-[var(--lp-accent)]">Drop editor</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[var(--lp-fg)] md:text-5xl">
              {isLoading ? "Loading drop..." : drop?.name ?? "Unavailable drop"}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--lp-muted)]">
              Tune the metadata, steer the next iteration in plain English, and publish once the
              preview hits the right temperature.
            </p>
          </div>

          <div className="grid gap-px bg-white/10 md:grid-cols-2">
            <div className="bg-[rgba(12,14,14,0.96)] p-6">
              <p className="launchpad-label">Editor state</p>
              <p className="mt-4 text-lg font-semibold text-[var(--lp-fg)]">
                {drop?.generated_html ? "Preview armed" : "Preview idle"}
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--lp-muted)]">
                {drop?.generated_html
                  ? "A generated draft is loaded and ready for iteration or publish."
                  : "Save metadata, direct the render, and bring the artifact into view."}
              </p>
            </div>
            <div className="bg-[rgba(12,14,14,0.96)] p-6">
              <p className="launchpad-label">Prompt trail</p>
              <p className="mt-4 text-lg font-semibold text-[var(--lp-fg)]">
                {promptCount} prompt{promptCount === 1 ? "" : "s"} recorded
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--lp-muted)]">
                Each successful generation stores the instruction that shaped the page.
              </p>
            </div>
            <div className="bg-[rgba(12,14,14,0.96)] p-6 md:col-span-2">
              <div className="flex flex-wrap items-center gap-4">
                {drop ? <StatusBadge status={drop.status} /> : null}
                <Link
                  to="/dashboard"
                  className="launchpad-button-secondary px-4 py-2 text-xs font-medium uppercase tracking-[0.22em]"
                >
                  Back to dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleDeleteDrop}
                  disabled={isDeleting}
                  className="launchpad-button-secondary px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-rose-200"
                >
                  {isDeleting ? "Deleting..." : "Delete drop"}
                </button>
                <div className="border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--lp-muted)]">
                  Preview / {previewStatusLabel}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <section className="border border-rose-400/30 bg-rose-500/10 px-6 py-5 text-sm text-rose-200">
          {error}
        </section>
      ) : null}

      {isLoading ? (
        <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="launchpad-shimmer h-[52rem] border border-white/10 bg-white/[0.04]" />
          <div className="launchpad-shimmer h-[52rem] border border-white/10 bg-white/[0.04]" />
        </section>
      ) : drop && form ? (
        <section className="space-y-6">
          {showPublishSuccessBanner ? (
            <section className="launchpad-panel-strong overflow-hidden border-[rgba(200,255,97,0.3)]">
              <div className="grid gap-px bg-white/10 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="bg-[rgba(8,9,9,0.9)] p-6 md:p-7">
                  <p className="launchpad-label text-[var(--lp-accent)]">Launch is live</p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--lp-fg)] md:text-4xl">
                    {drop.status === "published" ? "The public drop page is now live." : "Publish complete."}
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--lp-muted)]">
                    Share the launch link immediately or open the public experience in a new tab to
                    verify the live page.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="launchpad-button-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em]"
                    >
                      Open public page
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyPublicUrl}
                      disabled={isCopyingPublicUrl}
                      className="launchpad-button-secondary px-5 py-3 text-sm font-medium uppercase tracking-[0.22em]"
                    >
                      {isCopyingPublicUrl ? "Copying..." : "Copy public URL"}
                    </button>
                  </div>
                </div>

                <div className="bg-[rgba(12,14,14,0.98)] p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="launchpad-label">Public URL</p>
                      <p className="mt-3 text-sm leading-7 text-[var(--lp-muted)]">
                        This is the link customers can open right now.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPublishSuccessBanner(false)}
                      className="launchpad-button-secondary px-3 py-2 text-[11px] uppercase tracking-[0.22em]"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="mt-5 border border-white/10 bg-[rgba(8,9,9,0.72)] px-4 py-4">
                    <p className="break-all text-sm text-[var(--lp-fg)]">{publicUrl}</p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr] xl:items-start">
            <section className="launchpad-panel-strong preview-glow sticky top-24 overflow-hidden">
              <div className="grid gap-px bg-white/10 lg:grid-cols-[1fr_auto]">
                <div className="bg-[rgba(8,9,9,0.92)] px-6 py-5">
                  <p className="launchpad-label text-[var(--lp-accent)]">Live preview</p>
                  <h2 className="mt-3 text-2xl font-semibold text-[var(--lp-fg)]">
                    Rendered landing page
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--lp-muted)]">
                    Flip between desktop and mobile framing, then compare the last session render
                    against the newest output after each successful iteration.
                  </p>
                </div>
                <div className="bg-[rgba(12,14,14,0.98)] px-6 py-5">
                  <div className="space-y-4">
                    <div className="border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.22em] text-[var(--lp-muted)]">
                      {previewStatusLabel}
                    </div>
                    <div className="space-y-2">
                      <p className="launchpad-label">Device</p>
                      <div className="flex flex-wrap gap-2">
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
                    <div className="space-y-2">
                      <p className="launchpad-label">View</p>
                      <div className="flex flex-wrap gap-2">
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
              </div>

              <div className="relative min-h-[78vh] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent),rgba(6,7,7,0.98)]">
                <div className="pointer-events-none absolute inset-0 launchpad-halftone opacity-[0.06]" />
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
                  <div className="absolute inset-0 bg-black/72 backdrop-blur-sm">
                    <div className="launchpad-preview-loading absolute inset-4 border border-[rgba(200,255,97,0.24)] bg-[linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.08),rgba(255,255,255,0.04))]" />
                    <div className="absolute inset-x-6 top-6 border border-white/10 bg-[rgba(8,9,9,0.92)] p-5">
                      <p className="launchpad-label text-[var(--lp-accent)]">Codex render in flight</p>
                      <h3 className="mt-3 text-2xl font-semibold text-[var(--lp-fg)]">
                        {drop.generated_html
                          ? "Composing the next iteration"
                          : "Drafting the first landing page"}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--lp-muted)]">
                        {iterationPrompt.trim()
                          ? iterationPrompt
                          : "Using the current product brief to build a polished, self-contained landing page."}
                      </p>
                    </div>
                    <div className="absolute inset-x-6 bottom-6 grid gap-4 md:grid-cols-3">
                      <div className="launchpad-shimmer h-28 border border-white/10 bg-white/[0.06]" />
                      <div className="launchpad-shimmer h-28 border border-white/10 bg-white/[0.06]" />
                      <div className="launchpad-shimmer h-28 border border-white/10 bg-white/[0.06]" />
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <div className="space-y-6 xl:sticky xl:top-24">
              <section className="launchpad-panel overflow-hidden">
                <div className="grid gap-px bg-white/10 md:grid-cols-2">
                  <div className="bg-[rgba(8,9,9,0.86)] p-6 md:col-span-2">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="launchpad-label text-[var(--lp-accent)]">Primary actions</p>
                        <h2 className="mt-3 text-2xl font-semibold text-[var(--lp-fg)]">
                          Keep the drop moving
                        </h2>
                      </div>
                      <div className="border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--lp-muted)]">
                        {drop.generated_html ? "Ready to iterate" : "Ready for first render"}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[rgba(12,14,14,0.96)] p-4">
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className={`launchpad-action-button h-full w-full px-5 py-4 text-sm font-semibold uppercase tracking-[0.22em] ${
                        isGenerating
                          ? "launchpad-action-button-loading border border-[rgba(200,255,97,0.34)]"
                          : "launchpad-button-primary"
                      }`}
                    >
                      {generateButtonLabel}
                    </button>
                  </div>
                  <div className="bg-[rgba(12,14,14,0.96)] p-4">
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={isPublishing || !drop.generated_html}
                      className="launchpad-button-secondary h-full w-full px-5 py-4 text-sm font-semibold uppercase tracking-[0.22em] disabled:opacity-45"
                    >
                      {isPublishing ? "Publishing..." : drop.status === "published" ? "Republish" : "Publish"}
                    </button>
                  </div>
                  <div className="bg-[rgba(12,14,14,0.96)] p-4">
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="launchpad-button-secondary h-full w-full px-5 py-4 text-center text-sm font-medium uppercase tracking-[0.22em]"
                    >
                      Open public page
                    </a>
                  </div>
                  <div className="bg-[rgba(12,14,14,0.96)] p-4">
                    <button
                      type="button"
                      onClick={handleCopyPublicUrl}
                      disabled={isCopyingPublicUrl}
                      className="launchpad-button-secondary h-full w-full px-5 py-4 text-sm font-medium uppercase tracking-[0.22em]"
                    >
                      {isCopyingPublicUrl ? "Copying..." : "Copy link"}
                    </button>
                  </div>
                </div>

                <div className="border-t border-white/10 bg-[rgba(8,9,9,0.86)] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="launchpad-label">Public page</p>
                      <p className="mt-3 text-sm leading-7 text-[var(--lp-muted)]">
                        {drop.status === "published"
                          ? "Visitors are seeing the live landing page right now."
                          : drop.generated_html
                            ? "Publish when this version is ready. Until then the public route stays on the placeholder."
                            : "Generate a page first, then publish when the preview feels launch-ready."}
                      </p>
                    </div>
                    <span className="launchpad-label border border-white/10 px-3 py-1 text-[var(--lp-muted)]">
                      {drop.status}
                    </span>
                  </div>
                  <div className="mt-5 border border-white/10 bg-[rgba(12,14,14,0.96)] px-4 py-4">
                    <p className="launchpad-label">Shareable URL</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 flex-1 break-all text-sm text-[var(--lp-fg)] underline decoration-white/20 underline-offset-4"
                      >
                        {publicUrl}
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyPublicUrl}
                        disabled={isCopyingPublicUrl}
                        className="launchpad-button-secondary px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em]"
                      >
                        {isCopyingPublicUrl ? "Copying..." : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="launchpad-panel px-6 py-6">
                <div>
                  <p className="launchpad-label text-[var(--lp-accent)]">Iteration prompt</p>
                  <h2 className="mt-3 text-2xl font-semibold text-[var(--lp-fg)]">
                    Direct the next render
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--lp-muted)]">
                    Give Codex one clear instruction at a time. The action rail stays close while
                    you iterate through revisions.
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  <textarea
                    value={iterationPrompt}
                    onChange={(event) => setIterationPrompt(event.target.value)}
                    className="launchpad-input min-h-32"
                    placeholder="Make the countdown bigger. Add a stronger hero headline. Shift the palette toward midnight red."
                  />

                  <div className="flex flex-wrap gap-2">
                    {ITERATION_PROMPT_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setIterationPrompt(suggestion)}
                        className="launchpad-button-secondary px-3 py-2 text-[11px] uppercase tracking-[0.18em]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <form onSubmit={handleSaveMetadata} className="launchpad-panel px-6 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="launchpad-label">Metadata</p>
                    <h2 className="mt-3 text-2xl font-semibold text-[var(--lp-fg)]">
                      Control panel
                    </h2>
                  </div>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="launchpad-button-secondary px-4 py-2 text-xs font-medium uppercase tracking-[0.22em]"
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
                      className="launchpad-input"
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
                      className="launchpad-input"
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
                      className="launchpad-input"
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
                      className="launchpad-input min-h-36"
                      required
                    />
                  </Field>
                </div>
              </form>

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
    <section className="launchpad-panel overflow-hidden">
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="launchpad-label">Generation activity</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--lp-fg)]">Runtime trace</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--lp-muted)]">
              This landing page is generated programmatically by a runtime agent connected to
              Codex, then stored on this drop as the latest HTML draft.
            </p>
          </div>

          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            className="launchpad-button-secondary px-4 py-2 text-xs font-medium uppercase tracking-[0.22em]"
          >
            {isOpen ? "Hide details" : "Show details"}
          </button>
        </div>

        <div className="mt-6 grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
          <article className={`px-4 py-4 ${generationState.tone}`}>
            <p className="launchpad-label">Generation state</p>
            <div className="mt-3 flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${generationState.badgeTone}`} />
              <p className="text-base font-semibold text-[var(--lp-fg)]">{generationState.label}</p>
            </div>
            <p className="mt-2 text-sm leading-7 text-[var(--lp-muted)]">{generationState.detail}</p>
          </article>

          <article className="bg-[rgba(12,14,14,0.96)] px-4 py-4">
            <p className="launchpad-label">Last updated</p>
            <p className="mt-3 text-base font-semibold text-[var(--lp-fg)]">
              {formatActivityTimestamp(lastUpdatedAt)}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--lp-muted)]">
              The timestamp refreshes whenever a new draft is saved or the drop metadata changes.
            </p>
          </article>

          <article className="bg-[rgba(12,14,14,0.96)] px-4 py-4">
            <p className="launchpad-label">Prompt trail</p>
            <p className="mt-3 text-base font-semibold text-[var(--lp-fg)]">
              {promptCount} prompt{promptCount === 1 ? "" : "s"} recorded
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--lp-muted)]">
              Each successful generation saves the exact instruction that shaped the current page.
            </p>
          </article>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-white/10 bg-[rgba(8,9,9,0.72)] px-6 py-6">
          <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <article className="border border-white/10 bg-[rgba(12,14,14,0.98)] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="launchpad-label text-[var(--lp-accent)]">Latest prompt</p>
                  <h3 className="mt-3 text-lg font-semibold text-[var(--lp-fg)]">
                    {isGenerating ? "Current request in flight" : "Most recent saved instruction"}
                  </h3>
                </div>
                {isGenerating ? (
                  <span className="border border-[rgba(200,255,97,0.3)] bg-[rgba(200,255,97,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[var(--lp-accent)]">
                    In flight
                  </span>
                ) : null}
              </div>

              <div className="mt-4 border border-white/10 bg-[rgba(8,9,9,0.72)] px-4 py-4">
                {latestPrompt ? (
                  <p className="text-sm leading-7 text-[var(--lp-fg)]">{latestPrompt}</p>
                ) : (
                  <p className="text-sm leading-7 text-[var(--lp-muted)]">
                    No prompt has been sent yet. When you generate the first draft, the instruction
                    used for that render will appear here.
                  </p>
                )}
              </div>
            </article>

            <article className="border border-white/10 bg-[rgba(12,14,14,0.98)] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="launchpad-label">Previous prompts</p>
                  <h3 className="mt-3 text-lg font-semibold text-[var(--lp-fg)]">Revision trail</h3>
                </div>
                <span className="border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[var(--lp-muted)]">
                  {previousPrompts.length}
                </span>
              </div>

              {previousPrompts.length === 0 ? (
                <div className="mt-4 border border-dashed border-white/10 bg-[rgba(8,9,9,0.72)] px-4 py-5 text-sm leading-7 text-[var(--lp-muted)]">
                  Earlier prompts will stack here as you iterate.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {previousPrompts.map((entry, index) => (
                    <article
                      key={`${entry.role}-${index}-${entry.content}`}
                      className="border border-white/10 bg-[rgba(8,9,9,0.72)] px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[var(--lp-fg)]">
                          {entry.role}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--lp-muted)]">
                          Earlier prompt {previousPrompts.length - index}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[var(--lp-muted)]">{entry.content}</p>
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
      <span className="mb-2 block text-sm font-medium text-[var(--lp-fg)]">{label}</span>
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
      className={`border px-4 py-2 text-sm font-medium uppercase tracking-[0.18em] transition ${
        isActive
          ? "border-[rgba(200,255,97,0.34)] bg-[var(--lp-accent)] text-[#050606]"
          : "border-white/10 bg-transparent text-[var(--lp-muted)] hover:border-white/20 hover:text-[var(--lp-fg)]"
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
  const viewportHeightClass = device === "mobile" ? "h-[760px]" : "h-[72vh] min-h-[700px]";
  const shellWidthClass = device === "mobile" ? "max-w-[390px]" : "max-w-full";

  return (
    <article className="border border-white/10 bg-[rgba(12,14,14,0.98)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[var(--lp-fg)]">{title}</h3>
          <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--lp-muted)]">{description}</p>
        </div>
        <span className="launchpad-label border border-white/10 px-3 py-1 text-[var(--lp-muted)]">
          {device}
        </span>
      </div>

      <div className={`mx-auto mt-5 w-full ${shellWidthClass}`}>
        <div className="launchpad-terminal-frame overflow-hidden">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <WindowDot tone="bg-[#ff7b72]" />
            <WindowDot tone="bg-[#f2cc60]" />
            <WindowDot tone="bg-[var(--lp-accent)]" />
            <p className="ml-3 truncate text-xs uppercase tracking-[0.18em] text-[var(--lp-muted)]">
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
    <div className="flex h-full items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent),#060707] px-8 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center border border-white/10 bg-white/[0.03] text-xs uppercase tracking-[0.28em] text-[var(--lp-muted)]">
          {device}
        </div>
        <h3 className="text-2xl font-semibold text-[var(--lp-fg)]">First render pending</h3>
        <p className="text-sm leading-7 text-[var(--lp-muted)]">
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
      className={`border px-4 py-3 text-sm font-medium uppercase tracking-[0.24em] ${
        status === "published"
          ? "border-[rgba(200,255,97,0.34)] bg-[rgba(200,255,97,0.1)] text-[var(--lp-accent)]"
          : "border-white/12 bg-white/[0.03] text-[var(--lp-fg)]"
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
      tone: "border border-[rgba(200,255,97,0.28)] bg-[rgba(200,255,97,0.08)]",
      badgeTone: "bg-[var(--lp-accent)]",
    };
  }

  if (status === "published") {
    return {
      label: "Published",
      detail: "The current generated HTML is live on the public drop URL.",
      tone: "border border-[rgba(200,255,97,0.28)] bg-[rgba(200,255,97,0.08)]",
      badgeTone: "bg-[var(--lp-accent)]",
    };
  }

  if (hasGeneratedHtml) {
    return {
      label: "Latest draft ready",
      detail: "The current draft is saved and ready for another prompt or a publish pass.",
      tone: "border border-white/10 bg-[rgba(12,14,14,0.96)]",
      badgeTone: "bg-[var(--lp-fg)]",
    };
  }

  return {
    label: "Ready for first render",
    detail:
      promptCount > 0
        ? "The latest generation did not produce a stored HTML draft yet."
        : "The drop brief is saved and ready to send to the runtime agent.",
    tone: "border border-white/10 bg-[rgba(12,14,14,0.96)]",
    badgeTone: "bg-[var(--lp-fg)]",
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
