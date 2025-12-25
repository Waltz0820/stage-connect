// src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
import WatchProvider from "./components/watch/WatchProvider";

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
          <Route path="/series" element={<SeriesList />} />
          <Route path="/series/:name" element={<SeriesDetail />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/watch" element={<WatchIndex />} />
          <Route path="/watch/:provider" element={<WatchProvider />} />

          {/* Guide */}
          <Route path="/guide" element={<GuideList />} />
          <Route path="/guide/:slug" element={<GuideDetail />} />
          <Route path="/search" element={<SearchPage />} />

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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
