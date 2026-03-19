import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ApiError, apiFetchText } from "../lib/api";

export function PublicDropPage() {
  const { id } = useParams();
  const [html, setHtml] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [error, setError] = useState("");

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
      <main className="min-h-screen bg-slate-950">
        <div className="h-screen w-full p-5">
          <div className="launchpad-shimmer h-full rounded-[2rem] border border-white/10 bg-white/[0.04]" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(217,70,239,0.16),_transparent_34%),#020617] px-6 py-16 text-white">
        <section className="w-full max-w-2xl rounded-[2rem] border border-rose-400/25 bg-slate-900/80 p-8 text-center shadow-[0_24px_80px_rgba(2,6,23,0.55)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-rose-200">Unavailable</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">This drop could not be loaded.</h1>
          <p className="mt-4 text-base leading-8 text-slate-300">{error}</p>
          <Link
            to="/"
            className="mt-8 inline-flex rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(217,70,239,0.3)] transition hover:scale-[1.02]"
          >
            Back to Launchpad
          </Link>
        </section>
      </main>
    );
  }

  if (isComingSoon) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.14),_transparent_32%),radial-gradient(circle_at_right,_rgba(34,211,238,0.12),_transparent_28%),#020617] px-6 py-16 text-white">
        <section className="w-full max-w-3xl rounded-[2.2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.14),_transparent_42%),rgba(15,23,42,0.88)] p-10 text-center shadow-[0_28px_90px_rgba(2,6,23,0.6)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.34em] text-cyan-200">Coming Soon</p>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white md:text-6xl">
            This drop is not public yet.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">
            The page exists, but it has not been published yet. Check back closer to launch for the
            full experience.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              className="rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(217,70,239,0.3)] transition hover:scale-[1.02]"
            >
              Learn about Launchpad
            </Link>
            <Link
              to="/signup"
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/8"
            >
              Sign up
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-slate-950">
      <iframe
        title="Published drop"
        srcDoc={html}
        sandbox="allow-scripts allow-forms"
        className="h-full w-full border-0 bg-white"
      />
    </main>
  );
}
