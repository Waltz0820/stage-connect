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

import { gaPageView } from "./lib/ga";

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
  }, [loc]);

  return null;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <RouteTracker />

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

          {/* Guide */}
          <Route path="/guide" element={<GuideList />} />
          <Route path="/guide/:slug" element={<GuideDetail />} />

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
