import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ApiError, apiFetchText } from "../lib/api";

export function PublicDropPage() {
  const { id } = useParams();
  const [html, setHtml] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [error, setError] = useState("");
  const publicUrl =
    id && typeof window !== "undefined" ? `${window.location.origin}/drops/${id}/public` : "";

  useEffect(() => {
    async function loadPublicDrop() {
      if (!id) {
        setIsComingSoon(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      setIsComingSoon(false);

      try {
        const response = await apiFetchText(`/public/drops/${id}`, {
          skipAuth: true,
        });
        setHtml(response);
        setIsComingSoon(false);
      } catch (loadError) {
        setHtml("");

        if (loadError instanceof ApiError && loadError.status === 404) {
          setIsComingSoon(true);
        } else if (loadError instanceof ApiError) {
          setError(loadError.message);
        } else {
          setError("Unable to load this public drop right now.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadPublicDrop();
  }, [id]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--lp-bg)] px-5 py-5 text-[var(--lp-fg)]">
        <section className="launchpad-panel-strong mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[1700px] flex-col overflow-hidden">
          <PublicShellHeader eyebrow="Loading drop" title="Preparing the public launch page" />
          <div className="grid flex-1 gap-px bg-white/10 lg:grid-cols-[0.34fr_0.66fr]">
            <div className="space-y-4 bg-[rgba(8,9,9,0.9)] p-5 lg:p-6">
              <div className="launchpad-shimmer h-4 w-28 bg-white/10" />
              <div className="launchpad-shimmer h-10 w-3/4 bg-white/10" />
              <div className="launchpad-shimmer h-4 w-full bg-white/10" />
              <div className="launchpad-shimmer h-4 w-5/6 bg-white/10" />
              <div className="launchpad-shimmer h-28 bg-white/10" />
            </div>
            <div className="launchpad-shimmer bg-[rgba(12,14,14,0.96)]" />
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--lp-bg)] px-5 py-5 text-[var(--lp-fg)]">
        <section className="launchpad-panel-strong mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[1600px] flex-col overflow-hidden">
          <PublicShellHeader eyebrow="Launch unavailable" title="This public drop could not be loaded" />
          <div className="grid flex-1 gap-px bg-white/10 lg:grid-cols-[0.38fr_0.62fr]">
            <div className="border-r border-white/10 bg-[rgba(8,9,9,0.9)] p-6">
              <p className="launchpad-label text-rose-200">Error details</p>
              <p className="mt-4 text-base leading-8 text-[var(--lp-fg)]">{error}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="launchpad-button-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em]"
                >
                  Retry
                </button>
                <Link
                  to="/"
                  className="launchpad-button-secondary px-5 py-3 text-sm font-medium uppercase tracking-[0.22em]"
                >
                  Back to Launchpad
                </Link>
              </div>
            </div>

            <div className="bg-[rgba(12,14,14,0.98)] p-5 lg:p-6">
              <div className="flex h-full min-h-[26rem] items-center justify-center border border-dashed border-white/10 bg-[rgba(8,9,9,0.72)] px-8 text-center">
                <div className="max-w-md">
                  <p className="launchpad-label">Public shell</p>
                  <h2 className="mt-4 text-3xl font-semibold text-[var(--lp-fg)]">
                    The launch frame is intact.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-[var(--lp-muted)]">
                    Once the page loads successfully, the published HTML takes over this entire stage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (isComingSoon) {
    return (
      <main className="min-h-screen bg-[var(--lp-bg)] px-5 py-5 text-[var(--lp-fg)]">
        <section className="launchpad-panel-strong mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[1600px] flex-col overflow-hidden">
          <PublicShellHeader eyebrow="Coming soon" title="This drop exists, but it is not public yet" />
          <div className="grid flex-1 gap-px bg-white/10 lg:grid-cols-[0.38fr_0.62fr]">
            <div className="bg-[rgba(8,9,9,0.9)] p-6">
              <p className="text-base leading-8 text-[var(--lp-muted)]">
                The launch route is reserved. When the merchant publishes, the generated landing
                page takes over this shell and becomes the full experience.
              </p>
              {publicUrl ? (
                <div className="mt-6 border border-white/10 bg-[rgba(12,14,14,0.96)] px-4 py-4">
                  <p className="launchpad-label">Public URL</p>
                  <p className="mt-3 break-all text-sm text-[var(--lp-fg)]">{publicUrl}</p>
                </div>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="launchpad-button-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em]"
                >
                  Learn about Launchpad
                </Link>
                <Link
                  to="/signup"
                  className="launchpad-button-secondary px-5 py-3 text-sm font-medium uppercase tracking-[0.22em]"
                >
                  Sign up
                </Link>
              </div>
            </div>

            <div className="bg-[rgba(12,14,14,0.98)] p-5 lg:p-6">
              <div className="flex h-full min-h-[28rem] items-center justify-center border border-dashed border-white/10 bg-[rgba(8,9,9,0.72)] px-8 text-center">
                <div className="max-w-lg">
                  <p className="launchpad-label text-[var(--lp-accent)]">Launch stage armed</p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--lp-fg)]">
                    Waiting for publish
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-[var(--lp-muted)]">
                    Once published, the generated HTML becomes the hero here without any extra chrome
                    competing for attention.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--lp-bg)] px-4 py-4 text-[var(--lp-fg)] md:px-5 md:py-5">
      <section className="launchpad-panel-strong mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1800px] flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[rgba(8,9,9,0.9)] px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--lp-accent)]" />
            <div>
              <p className="launchpad-label text-[var(--lp-accent)]">Live drop</p>
              <p className="mt-1 text-sm text-[var(--lp-muted)]">Published with Launchpad</p>
            </div>
          </div>
          {publicUrl ? (
            <p className="max-w-xl truncate text-xs uppercase tracking-[0.18em] text-[var(--lp-muted)]">
              {publicUrl}
            </p>
          ) : null}
        </div>

        <div className="flex-1 overflow-hidden bg-white">
          <iframe
            title="Published drop"
            srcDoc={html}
            sandbox="allow-scripts allow-forms"
            className="h-[calc(100vh-5.75rem)] w-full border-0 bg-white"
          />
        </div>
      </section>
    </main>
  );
}

interface PublicShellHeaderProps {
  eyebrow: string;
  title: string;
}

function PublicShellHeader({ eyebrow, title }: PublicShellHeaderProps) {
  return (
    <div className="border-b border-white/10 bg-[rgba(8,9,9,0.88)] px-5 py-5 backdrop-blur lg:px-6">
      <p className="launchpad-label text-[var(--lp-accent)]">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--lp-fg)] md:text-5xl">
        {title}
      </h1>
    </div>
  );
}
