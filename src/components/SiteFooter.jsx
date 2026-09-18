import React from 'react'
import { Link } from 'react-router-dom'

const WHATSAPP = 'https://wa.me/5553999010262'

export default function SiteFooter() {
  return (
    <footer className="ft-foot">
      <div className="ft-foot-in">
        <div className="ft-foot-top">
          <div>
            <div className="ft-foot-brand">Frantiesco <span>Trader</span></div>
            <div className="ft-foot-tag">Estratégias quantitativas em conta real, com o histórico aberto. Método 6015.</div>
          </div>
          <div className="ft-foot-cols">
            <div className="ft-foot-col">
              <div className="h">Resultados</div>
              <Link to="/resultados">Portfólios</Link>
              <Link to="/estrategias">Robôs</Link>
              <Link to="/resultado-do-mes">Resultado do mês</Link>
              <Link to="/copa-dos-robos">Copa dos Robôs</Link>
            </div>
            <div className="ft-foot-col">
              <div className="h">Método 6015</div>
              <Link to="/mentoria_metodo6015">Mentoria</Link>
              <Link to="/mercado-internacional">Mercado internacional</Link>
              <Link to="/avaliacoes">Avaliações</Link>
              <Link to="/historico">Minha história</Link>
            </div>
            <div className="ft-foot-col">
              <div className="h">Contato</div>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <Link to="/cadastro">Cadastro de cliente</Link>
            </div>
          </div>
        </div>
        <div className="ft-foot-risk">
          Resultados passados não garantem retornos futuros. Operar derivativos envolve risco, incluindo a possibilidade de perda do capital investido. Os resultados publicados são de conta real e refletem o último lançamento, não a posição em tempo real do mercado.
        </div>
        <div className="ft-foot-copy">© {new Date().getFullYear()} Frantiesco Trader · Método 6015</div>
      </div>
    </footer>
  )
}
