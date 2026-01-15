// src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./components/Home";
import Actors from "./components/Actors";
import ActorDetail from "./components/ActorDetail";
import Plays from "./components/Plays";
import PlayDetail from "./components/PlayDetail";
import SeriesList from "./components/SeriesList";
import SeriesDetail from "./components/SeriesDetail";
import Favorites from "./components/Favorites";
import GuideList from "./components/GuideList";
import GuideDetail from "./components/GuideDetail";
import { DebugSupabase } from "./DebugSupabase";
import WatchIndex from "./components/watch/WatchIndex";
import WatchDmmPage from "./components/watch/WatchDmmPage";
import WatchUNextPage from "./components/watch/WatchUNextPage";
import WatchDanimePage from "./components/watch/WatchDanimePage";

import { gaPageView } from "./lib/ga";
import SeoHead from "./components/SeoHead";
import SearchPage from "./components/SearchPage";

// ===== Admin =====
import AdminGuard from "./components/admin/AdminGuard";
import AdminLayout from "./components/admin/AdminLayout";
import AdminHome from "./components/admin/AdminHome";

import AdminSeries from "./components/admin/AdminSeries";
import AdminSeriesEdit from "./components/admin/AdminSeriesEdit";

import AdminPlays from "./components/admin/AdminPlays";
import AdminPlayEdit from "./components/admin/AdminPlayEdit";

import AdminActors from "./components/admin/AdminActors";
import AdminActorEdit from "./components/admin/AdminActorEdit";

import AdminCastsEdit from "./components/admin/AdminCastsEdit";

import TagsIndexPage from "./components/tags/TagsIndexPage";
import TagDetailPage from "./components/tags/TagDetailPage";

const RouteTracker: React.FC = () => {
  const loc = useLocation();

  useEffect(() => {
    const path = loc.pathname + loc.search + loc.hash;
    gaPageView(path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname, loc.search, loc.hash]);

  return null;
};

/**
 * ✅ SEO事故防止：管理画面は noindex（SPAでも確実に効かせる）
 * - document.head を upsert する SeoHead を使う
 */
const AdminNoIndex: React.FC = () => {
  const loc = useLocation();
  const isAdmin = loc.pathname.startsWith("/admin");
  if (!isAdmin) return null;

  return <SeoHead title="Admin | Stage Connect" robots="noindex,nofollow,noarchive" />;
};

/**
 * ✅ 404（NotFound）
 * - SEO的にも noindex を付けて事故防止
 */
const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
      <SeoHead title={`ページが見つかりません - Stage Connect`} robots="noindex,nofollow" />
      <h2 className="text-2xl font-bold text-white">ページが見つかりませんでした</h2>
      <p className="mt-2 text-slate-400">URLが変更されたか、存在しないページの可能性があります。</p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          to="/"
          className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-full text-sm font-bold hover:bg-white/10 hover:border-neon-purple/50 transition-colors"
        >
          トップに戻る
        </Link>
        <Link
          to="/search"
          className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-full text-sm font-bold hover:bg-white/10 hover:border-neon-purple/50 transition-colors"
        >
          検索する
        </Link>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <RouteTracker />
      <AdminNoIndex />

      <Layout>
        {/* Supabase 接続テスト用（画面には何も出ない） */}
        <DebugSupabase />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/actors" element={<Actors />} />
          <Route path="/actors/:slug" element={<ActorDetail />} />
          <Route path="/plays" element={<Plays />} />
          <Route path="/plays/:slug" element={<PlayDetail />} />

          {/* ✅ Series */}
          <Route path="/series" element={<SeriesList />} />
          {/* ✅ slug 統一（新） */}
          <Route path="/series/:slug" element={<SeriesDetail />} />
          {/* ✅ 旧互換：/series/:name でも同じ詳細を開ける（過去リンク救済） */}
          <Route path="/series/:name" element={<SeriesDetail />} />

          <Route path="/favorites" element={<Favorites />} />

          {/* Watch */}
          <Route path="/watch" element={<WatchIndex />} />
          <Route path="/watch/dmm" element={<WatchDmmPage />} />
          <Route path="/watch/u-next" element={<WatchUNextPage />} />
          <Route path="/watch/danime" element={<WatchDanimePage />} />

          {/* Guide */}
          <Route path="/guide" element={<GuideList />} />
          <Route path="/guide/:slug" element={<GuideDetail />} />
          <Route path="/search" element={<SearchPage />} />

          {/* Tags */}
          <Route path="/tags" element={<TagsIndexPage />} />
          <Route path="/tags/:slug" element={<TagDetailPage />} />

          {/* ===== Admin Routes ===== */}
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminHome />
                </AdminLayout>
              </AdminGuard>
            }
          />

          {/* Series */}
          <Route
            path="/admin/series"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminSeries />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/series/new"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminSeriesEdit mode="new" />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/series/:slug"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminSeriesEdit mode="edit" />
                </AdminLayout>
              </AdminGuard>
            }
          />

          {/* Plays */}
          <Route
            path="/admin/plays"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminPlays />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/plays/new"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminPlayEdit mode="new" />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/plays/:slug"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminPlayEdit mode="edit" />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/plays/:slug/casts"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminCastsEdit />
                </AdminLayout>
              </AdminGuard>
            }
          />

          {/* Actors */}
          <Route
            path="/admin/actors"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminActors />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/actors/new"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminActorEdit mode="new" />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/admin/actors/:slug"
            element={
              <AdminGuard>
                <AdminLayout>
                  <AdminActorEdit mode="edit" />
                </AdminLayout>
              </AdminGuard>
            }
          />

          {/* ✅ 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
