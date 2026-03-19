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
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.1),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(217,70,239,0.12),_transparent_30%),#020617] px-5 py-5 text-white">
        <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[1600px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/85 shadow-[0_28px_100px_rgba(2,6,23,0.6)]">
          <PublicShellHeader eyebrow="Loading drop" title="Preparing the public launch page" />
          <div className="grid flex-1 gap-6 p-5 lg:grid-cols-[0.34fr_0.66fr] lg:p-6">
            <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
              <div className="launchpad-shimmer h-4 w-28 rounded-full bg-white/10" />
              <div className="launchpad-shimmer h-10 w-3/4 rounded-[1rem] bg-white/10" />
              <div className="launchpad-shimmer h-4 w-full rounded-full bg-white/10" />
              <div className="launchpad-shimmer h-4 w-5/6 rounded-full bg-white/10" />
              <div className="launchpad-shimmer h-28 rounded-[1.5rem] bg-white/10" />
            </div>
            <div className="launchpad-shimmer rounded-[1.9rem] border border-white/10 bg-white/[0.04]" />
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(244,63,94,0.14),_transparent_30%),#020617] px-5 py-5 text-white">
        <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[1500px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/88 shadow-[0_28px_100px_rgba(2,6,23,0.6)]">
          <PublicShellHeader eyebrow="Launch unavailable" title="This public drop could not be loaded" />
          <div className="grid flex-1 gap-6 p-5 lg:grid-cols-[0.38fr_0.62fr] lg:p-6">
            <div className="rounded-[1.75rem] border border-rose-400/20 bg-rose-500/10 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-rose-200">Error details</p>
              <p className="mt-4 text-base leading-8 text-slate-200">{error}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                >
                  Retry
                </button>
                <Link
                  to="/"
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/8"
                >
                  Back to Launchpad
                </Link>
              </div>
            </div>

            <div className="rounded-[1.9rem] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex h-full min-h-[26rem] items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/70 px-8 text-center">
                <div className="max-w-md">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Public shell</p>
                  <h2 className="mt-4 text-3xl font-semibold text-white">The launch frame is intact.</h2>
                  <p className="mt-4 text-sm leading-7 text-slate-300">
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
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.14),_transparent_30%),radial-gradient(circle_at_right,_rgba(34,211,238,0.12),_transparent_24%),#020617] px-5 py-5 text-white">
        <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[1500px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/88 shadow-[0_28px_100px_rgba(2,6,23,0.6)]">
          <PublicShellHeader eyebrow="Coming soon" title="This drop exists, but it is not public yet" />
          <div className="grid flex-1 gap-6 p-5 lg:grid-cols-[0.38fr_0.62fr] lg:p-6">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
              <p className="text-base leading-8 text-slate-300">
                The launch route is reserved. When the merchant publishes, the generated landing
                page takes over this shell and becomes the full experience.
              </p>
              {publicUrl ? (
                <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-slate-950/65 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    Public URL
                  </p>
                  <p className="mt-3 break-all text-sm text-white">{publicUrl}</p>
                </div>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(217,70,239,0.3)] transition hover:scale-[1.02]"
                >
                  Learn about Launchpad
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/8"
                >
                  Sign up
                </Link>
              </div>
            </div>

            <div className="rounded-[1.9rem] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex h-full min-h-[28rem] items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.12),transparent_32%),rgba(15,23,42,0.9)] px-8 text-center">
                <div className="max-w-lg">
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-200">Launch stage armed</p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                    Waiting for publish
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-slate-300">
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),_transparent_18%),#020617] px-4 py-4 text-white md:px-5 md:py-5">
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1700px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/92 shadow-[0_28px_100px_rgba(2,6,23,0.65)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-slate-950/85 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-200">Live drop</p>
              <p className="mt-1 text-sm text-slate-300">Published with Launchpad</p>
            </div>
          </div>
          {publicUrl ? (
            <p className="max-w-xl truncate text-xs uppercase tracking-[0.18em] text-slate-500">
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
    <div className="border-b border-white/10 bg-slate-950/82 px-5 py-5 backdrop-blur lg:px-6">
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">{title}</h1>
    </div>
  );
}
