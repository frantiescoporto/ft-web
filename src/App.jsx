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
import MentoriaMetodo6015Page from './pages/MentoriaMetodo6015Page.jsx'
import AvaliacaoPage from './pages/AvaliacaoPage.jsx'
import Balanse03Page from './pages/Balanse03Page.jsx'
import AvelPage from './pages/AvelPage.jsx'
import CopaRobosPage from './pages/CopaRobosPage.jsx'
import AvelClientesPage from './pages/AvelClientesPage.jsx'
import ResultadoDoMesPage from './pages/ResultadoDoMesPage.jsx'
import CadastroClientePage from './pages/CadastroClientePage.jsx'

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
        <Route path="/mentoria_metodo6015" element={<MentoriaMetodo6015Page />} />
        <Route path="/avaliacoes" element={<AvaliacaoPage />} />
        <Route path="/balanse_03" element={<Balanse03Page />} />
        <Route path="/daytrademodoautomatico" element={<AvelPage />} />
        <Route path="/copa-dos-robos" element={<CopaRobosPage />} />
        <Route path="/avel-clientes" element={<AvelClientesPage />} />
        <Route path="/resultado-do-mes" element={<ResultadoDoMesPage />} />
        <Route path="/cadastro" element={<CadastroClientePage />} />
      </Routes>
    </DataProvider>
  )
}
