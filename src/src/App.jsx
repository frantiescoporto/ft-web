import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { DataProvider } from './context/DataContext.jsx'
import HomePage from './pages/HomePage.jsx'
import PortfoliosRecomendadosPage from './pages/PortfoliosRecomendadosPage.jsx'
import PortfolioDetailPage from './pages/PortfolioDetailPage.jsx'
import ResultadosPage from './pages/ResultadosPage.jsx'
import ComoAdquirirPage from './pages/ComoAdquirirPage.jsx'
import HistoricoPage from './pages/HistoricoPage.jsx'

export default function App() {
  useEffect(() => {
    document.documentElement.className = 'theme-dark'
  }, [])

  return (
    <DataProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/portfolios-recomendados" element={<PortfoliosRecomendadosPage />} />
        <Route path="/portfolios-recomendados/:id" element={<PortfolioDetailPage />} />
        <Route path="/resultados" element={<ResultadosPage />} />
        <Route path="/como-adquirir" element={<ComoAdquirirPage />} />
        <Route path="/historico" element={<HistoricoPage />} />
      </Routes>
    </DataProvider>
  )
}
