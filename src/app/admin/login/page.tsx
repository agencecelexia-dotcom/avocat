"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin/dashboard");
      } else {
        setError("Mot de passe incorrect");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1b2a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1b2d45] mb-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#c8a96e]" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <h1 className="font-[Playfair_Display,serif] text-2xl font-bold text-white">
            M<sup className="text-sm">e</sup> MINKO MI NZE
          </h1>
          <p className="text-[#6c7a89] mt-1 text-sm">Administration du cabinet</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1b2d45] rounded-2xl p-8 shadow-2xl border border-white/5"
        >
          <label htmlFor="password" className="block text-sm font-medium text-[#6c7a89] mb-2">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#0d1b2a] border border-white/10 text-white placeholder-[#6c7a89] focus:outline-none focus:border-[#c8a96e] focus:ring-1 focus:ring-[#c8a96e] transition-colors"
            placeholder="Entrez le mot de passe"
            required
            autoFocus
          />

          {error && (
            <p className="mt-3 text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 px-4 rounded-xl bg-[#c8a96e] text-[#0d1b2a] font-semibold hover:bg-[#b08d4f] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-center mt-6">
          <a href="/" className="text-[#6c7a89] hover:text-[#c8a96e] text-sm transition-colors">
            ← Retour au site
          </a>
        </p>
      </div>
    </div>
  );
}
