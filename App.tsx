import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import Actors from './components/Actors';
import ActorDetail from './components/ActorDetail';
import Plays from './components/Plays';
import PlayDetail from './components/PlayDetail';
import SeriesList from './components/SeriesList';
import SeriesDetail from './components/SeriesDetail';
import Favorites from './components/Favorites';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/actors" element={<Actors />} />
          <Route path="/actors/:slug" element={<ActorDetail />} />
          <Route path="/plays" element={<Plays />} />
          <Route path="/plays/:slug" element={<PlayDetail />} />
          <Route path="/series" element={<SeriesList />} />
          <Route path="/series/:name" element={<SeriesDetail />} />
          <Route path="/favorites" element={<Favorites />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;