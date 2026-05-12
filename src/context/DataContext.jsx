import React, { createContext, useContext, useEffect, useState } from 'react'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [robots, setRobots] = useState([])
  const [portfolios, setPortfolios] = useState([])
  const [mentPortfolios, setMentPortfolios] = useState([])
  const [mentOps, setMentOps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [rRes, pRes, mpRes, moRes] = await Promise.all([
          fetch('/data/robots.json'),
          fetch('/data/portfolios.json'),
          fetch('/data/mentorados-portfolios.json'),
          fetch('/data/mentorados-ops.json'),
        ])
        const [r, p, mp, mo] = await Promise.all([rRes.json(), pRes.json(), mpRes.json(), moRes.json()])
        setRobots(r)
        setPortfolios(p)
        setMentPortfolios(mp)
        setMentOps(mo)
      } catch (e) {
        console.error('DataContext error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getRobot = (id) => robots.find(r => r.id === Number(id)) || null

  return (
    <DataContext.Provider value={{ robots, portfolios, mentPortfolios, mentOps, getRobot, loading }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
