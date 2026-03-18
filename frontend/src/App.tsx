import { Link, Route, Routes, useParams } from "react-router-dom";

function Page({ title }: { title: string }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-3 text-slate-600">Placeholder content</p>
      <nav className="mt-6 flex flex-wrap gap-3 text-sm text-blue-600">
        <Link to="/">Landing</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup">Signup</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/drops/1">Drop #1</Link>
      </nav>
    </main>
  );
}

function DropDetailsPage() {
  const { id } = useParams();
  return <Page title={`Drop Details (${id})`} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Page title="Landing" />} />
      <Route path="/login" element={<Page title="Login" />} />
      <Route path="/signup" element={<Page title="Signup" />} />
      <Route path="/dashboard" element={<Page title="Dashboard" />} />
      <Route path="/drops/:id" element={<DropDetailsPage />} />
    </Routes>
  );
}
