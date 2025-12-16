import React, { useState } from "react";
import { supabase } from "../../lib/supabase";

const AdminSignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const signIn = async () => {
    setMsg("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pw,
      });
      if (error) setMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6">
        <h1 className="text-xl font-extrabold text-white">Admin Login</h1>
        <p className="text-sm text-slate-400 mt-2">
          Supabase Auth（Email/Password）
        </p>

        <div className="mt-6 space-y-3">
          <input
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            placeholder="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            type="password"
            autoComplete="current-password"
          />

          <button
            className="w-full mt-2 px-4 py-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 text-white font-bold"
            onClick={signIn}
            disabled={loading}
          >
            {loading ? "Signing in..." : "ログイン"}
          </button>

          {msg && <p className="text-sm text-red-300 mt-2">{msg}</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminSignIn;
