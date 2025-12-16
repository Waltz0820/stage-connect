import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import Actors from './components/Actors';
import ActorDetail from './components/ActorDetail';
import Plays from './components/Plays';
import PlayDetail from './components/PlayDetail';
import SeriesList from './components/SeriesList';
import SeriesDetail from './components/SeriesDetail';
import Favorites from './components/Favorites';
import GuideList from './components/GuideList';
import GuideDetail from './components/GuideDetail';
import { DebugSupabase } from './DebugSupabase'; // ← 追加

const App: React.FC = () => {
  return (
    <BrowserRouter>
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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
