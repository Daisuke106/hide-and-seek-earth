import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Header />
              <main className="App-main">
                <HomePage />
              </main>
              <Footer />
            </>
          }
        />
        <Route
          path="/game"
          element={
            <>
              <GamePage />
              <Footer />
            </>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <>
              <Header />
              <main className="App-main">
                <LeaderboardPage />
              </main>
              <Footer />
            </>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
