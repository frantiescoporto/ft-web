import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { DataProvider } from './context/DataContext.jsx'
import HomePage from './pages/HomePage.jsx'
import EstrategiasPage from './pages/EstrategiasPage.jsx'
import RobotDetailPage from './pages/RobotDetailPage.jsx'
import ResultadosPage from './pages/ResultadosPage.jsx'
import ComoAdquirirPage from './pages/ComoAdquirirPage.jsx'
import HistoricoPage from './pages/HistoricoPage.jsx'
import AvelPortfoliosPage from './pages/AvelPortfoliosPage.jsx'

export default function App() {
  useEffect(() => {
    document.documentElement.className = 'theme-dark'
  }, [])

  return (
    <DataProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/estrategias" element={<EstrategiasPage />} />
        <Route path="/estrategias/:id" element={<RobotDetailPage />} />
        <Route path="/resultados" element={<ResultadosPage />} />
        <Route path="/como-adquirir" element={<ComoAdquirirPage />} />
        <Route path="/historico" element={<HistoricoPage />} />
        <Route path="/avel" element={<AvelPortfoliosPage />} />
        <Route path="/avel/portfolios/:id" element={<AvelPortfoliosPage />} />
      </Routes>
    </DataProvider>
  )
}
