import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import AdminSignIn from "./AdminSignIn";

const getAdminEmails = () => {
  const raw = import.meta.env.VITE_ADMIN_EMAILS as string | undefined;
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
};

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const adminEmails = useMemo(() => getAdminEmails(), []);
  const [loading, setLoading] = useState(true);
  const [authedEmail, setAuthedEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email?.toLowerCase() ?? null;
      if (!mounted) return;
      setAuthedEmail(email);
      setLoading(false);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email?.toLowerCase() ?? null;
      setAuthedEmail(email);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = useMemo(() => {
    if (!authedEmail) return false;
    if (adminEmails.length === 0) return false;
    return adminEmails.includes(authedEmail);
  }, [authedEmail, adminEmails]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  if (!authedEmail) return <AdminSignIn />;

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-white">権限がありません</h2>
        <p className="text-sm text-slate-400 mt-3">
          このアカウント（{authedEmail}）は管理者に登録されていません。
        </p>
        <button
          className="mt-6 px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-bold"
          onClick={() => supabase.auth.signOut()}
        >
          ログアウト
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;