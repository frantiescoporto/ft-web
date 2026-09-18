import React, { Suspense, lazy, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { DataProvider } from './context/DataContext.jsx'
import Layout from './components/Layout.jsx'
import HomePage from './pages/HomePage.jsx'

/* Cada rota vira um chunk separado: quem abre a Home não baixa o código
 * das páginas de análise (ResultadosPage e RobotDetailPage são grandes). */
const EstrategiasPage = lazy(() => import('./pages/EstrategiasPage.jsx'))
const RobotDetailPage = lazy(() => import('./pages/RobotDetailPage.jsx'))
const ResultadosPage = lazy(() => import('./pages/ResultadosPage.jsx'))
const HistoricoPage = lazy(() => import('./pages/HistoricoPage.jsx'))
const AvelPortfoliosPage = lazy(() => import('./pages/AvelPortfoliosPage.jsx'))
const MentoriaMetodo6015Page = lazy(() => import('./pages/MentoriaMetodo6015Page.jsx'))
const AvaliacaoPage = lazy(() => import('./pages/AvaliacaoPage.jsx'))
const Balanse03Page = lazy(() => import('./pages/Balanse03Page.jsx'))
const AvelPage = lazy(() => import('./pages/AvelPage.jsx'))
const CopaRobosPage = lazy(() => import('./pages/CopaRobosPage.jsx'))
const AvelClientesPage = lazy(() => import('./pages/AvelClientesPage.jsx'))
const ResultadoDoMesPage = lazy(() => import('./pages/ResultadoDoMesPage.jsx'))
const CadastroClientePage = lazy(() => import('./pages/CadastroClientePage.jsx'))

const Fallback = () => <div className="ft-loading">carregando</div>

export default function App() {
  useEffect(() => {
    document.documentElement.className = 'theme-dark'
  }, [])

  return (
    <DataProvider>
      <Suspense fallback={<Fallback />}>
        <Routes>
          {/* Rotas públicas: nav e footer compartilhados */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/estrategias" element={<EstrategiasPage />} />
            <Route path="/estrategias/:id" element={<RobotDetailPage />} />
            <Route path="/resultados" element={<ResultadosPage />} />
            <Route path="/historico" element={<HistoricoPage />} />
            <Route path="/mentoria_metodo6015" element={<MentoriaMetodo6015Page />} />
            <Route path="/avaliacoes" element={<AvaliacaoPage />} />
            <Route path="/copa-dos-robos" element={<CopaRobosPage />} />
            <Route path="/resultado-do-mes" element={<ResultadoDoMesPage />} />
            <Route path="/cadastro" element={<CadastroClientePage />} />
          </Route>

          {/* Landings de parceiros e ofertas: sem a nav do site */}
          <Route path="/avel" element={<AvelPortfoliosPage />} />
          <Route path="/avel/portfolios/:id" element={<AvelPortfoliosPage />} />
          <Route path="/balanse_03" element={<Balanse03Page />} />
          <Route path="/daytrademodoautomatico" element={<AvelPage />} />
          <Route path="/avel-clientes" element={<AvelClientesPage />} />
        </Routes>
      </Suspense>
    </DataProvider>
  )
}
