import { Link, useParams } from "react-router-dom";

export function DropDetailsPage() {
  const { id } = useParams();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-14">
      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-200">Protected route</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Drop {id}</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
          This route is gated behind auth now. It is ready for the next phase where the actual drop
          detail and generated landing page editor will live.
        </p>
        <Link
          to="/dashboard"
          className="mt-8 inline-flex rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/8"
        >
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
