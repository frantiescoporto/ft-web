import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const s = {
  accent: '#00d4aa', dark: '#080c12', surface: '#0f1520',
  card: '#131b28', border: 'rgba(255,255,255,0.07)',
  text: '#e8edf5', muted: '#6b7a99', warning: '#f5a623',
}

const HISTORICO = [
  {
    ano: 2017,
    titulo: 'O início',
    cor: '#6b7a99',
    tag: 'DESCOBERTA',
    descricao: 'Comecei no mercado aprendendo sobre Tesouro Direto. Foi assistindo uma live da Me Poupe junto a uma corretora que conheci o day trade — ali me apaixonei pelo poder da alavancagem. Comprei um curso que dava acesso a uma sala de calls e educacional. Lembro que falava para minha esposa: "vamos ficar ricos, é uma sala cheia de analistas focados nas melhores recomendações". Triste ilusão. Era iniciante — acredito que todos passam por essa fase.',
    marcos: ['Tesouro Direto', 'Primeira sala de calls', 'Day trade manual', 'Descoberta da alavancagem'],
    aprendizado: null,
  },
  {
    ano: 2018,
    titulo: 'Levando a sério',
    cor: '#4f8ef7',
    tag: 'DEDICAÇÃO',
    descricao: 'Aqui abri mão de alguns trabalhos para poder operar e estudar mais tempo. Decidi que seria trader e não havia plano B. Muito estudo, cursos, treinamentos e madrugadas analisando gráficos.',
    marcos: ['Abandono de empregos', 'Estudo intensivo', 'Cursos e treinamentos', 'Madrugadas analisando'],
    aprendizado: null,
  },
  {
    ano: 2019,
    titulo: 'A virada matemática',
    cor: '#9b7cf4',
    tag: 'EVOLUÇÃO',
    descricao: 'Depois de ganhar, perder, vir cá e ir pra lá, no último trimestre comecei a ser mais objetivo e ter melhores resultados. Entendi que a matemática + estatística iam mudar o jogo para mim.',
    marcos: ['Melhores resultados no Q4', 'Descoberta da estatística', 'Objetividade nas operações'],
    aprendizado: '💡 A matemática e a estatística mudam o jogo.',
  },
  {
    ano: 2020,
    titulo: 'O ano em que o jogo vira',
    cor: '#00d4aa',
    tag: 'CONSISTÊNCIA',
    descricao: 'Definição de plano de trading + diário de trading aliados a uma metodologia objetiva viraram o jogo. Comecei a me tornar consistente tanto nas operações quanto nos resultados.',
    marcos: ['Plano de trading definido', 'Diário de trading', 'Metodologia objetiva', 'Primeiros resultados consistentes'],
    aprendizado: '💡 1º grande aprendizado: confie na estatística.',
  },
  {
    ano: 2021,
    titulo: 'Quase o fim — e o recomeço',
    cor: '#f06060',
    tag: 'RESILIÊNCIA',
    descricao: 'Ano de aprendizado duro. Cometi erros graves na gestão de lotes e alavancagem que quase me levaram a quebrar. Tive que praticamente recomeçar do zero, reduzindo meu tamanho de mão em 70%.',
    marcos: ['Erro na gestão de alavancagem', 'Redução de 70% no tamanho', 'Reconstrução do capital'],
    aprendizado: '💡 2º grande aprendizado: controle a alavancagem.',
  },
  {
    ano: 2022,
    titulo: 'Automatização — uma nova vida',
    cor: '#34d47e',
    tag: 'AUTOMAÇÃO',
    descricao: 'O que era uma estratégia objetiva virou robô. Passei a operar 100% automatizado — mais liberdade, mais tempo, mais estudo. Esse ano vieram os primeiros convites: parceria com o maior escritório da XP no Brasil e o convite da Ontick para ter minhas estratégias dentro da plataforma.',
    marcos: ['Trading 100% automatizado', 'Parceria XP — maior escritório', 'Estratégias na Ontick', 'Liberdade de tempo'],
    aprendizado: null,
  },
  {
    ano: 2023,
    titulo: 'A fábrica de estratégias',
    cor: '#f5a623',
    tag: 'ESCALA',
    descricao: 'Com a automatização, agora eu podia ter mais de 4 a 5 estratégias rodando. Parei de estudar análise técnica e passei a entender desenvolvimento e análise de estratégias e portfólios. Os robôs na Ontick foram muito bem — alguns entre os melhores do ano, com volume de assinantes crescendo mês a mês.',
    marcos: ['10+ estratégias simultâneas', 'Top rankings Ontick', 'Crescimento de assinantes', 'Foco em portfólios'],
    aprendizado: null,
  },
  {
    ano: 2024,
    titulo: 'Um ano de portas abertas',
    cor: '#06b6d4',
    tag: 'EXPOSIÇÃO',
    descricao: 'Tive acesso a um mundo completamente novo e a pessoas incríveis que trouxeram muito conhecimento. Conheci a XP, Nelogica e o TradersClub. Participei de podcasts e foi talvez um dos anos de maior evolução pessoal e profissional.',
    marcos: ['XP, Nelogica e TradersClub', 'Podcasts e entrevistas', 'Maior evolução profissional', 'Novas parcerias'],
    aprendizado: null,
  },
  {
    ano: 2025,
    titulo: 'Ápice — e a parceria dos sonhos',
    cor: '#00d4aa',
    tag: 'CONQUISTA',
    descricao: 'Palestrei em diversos lugares — destaque para uma palestra dentro da B3. Conversei com todas as maiores empresas do mercado financeiro. Fechei uma parceria incrível com o Grupo Avel, um dos maiores escritórios da XP — o maior em renda fixa e já somos o segundo maior em contratos futuros operados. Isso garantiu a mim e a meus clientes condições únicas.',
    marcos: ['Palestra na B3', 'Parceria Grupo Avel', '2º maior em futuros na XP', 'Condições exclusivas para clientes'],
    aprendizado: null,
  },
  {
    ano: 2026,
    titulo: 'O pior mês — e o melhor lançamento',
    cor: '#f5a623',
    tag: 'HOJE',
    descricao: 'Em fevereiro tive o pior mês da minha história como trader. Um mercado volátil e caro mostrou que não posso subestimá-lo. Mas logo ficou claro que foi algo único — as estratégias voltaram à boa performance no mês seguinte.\n\nEsse é também o ano do lançamento da minha mentoria junto à Nelogica — algo surreal para aquele Frantiesco de 2017 que assistia lives da Nelogica para aprender. Agora estou dentro da maior plataforma de trading passando meu conhecimento. Uma honra enorme.',
    marcos: ['Pior mês histórico em fevereiro', 'Recuperação no mês seguinte', 'Lançamento SmartLab com Nelogica', 'Mentoria na maior plataforma do BR'],
    aprendizado: '💡 3º grande aprendizado: não subestime um mercado volátil e caro.',
  },
]

export default function HistoricoPage() {
  const navigate = useNavigate()
  const [expandido, setExpandido] = useState(null)

  return (
    <div style={{ background: s.dark, minHeight: '100vh', color: s.text }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 32px' }}>

        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none',
          color: s.muted, cursor: 'pointer', fontSize: 13, marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Voltar
        </button>

        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 12, color: s.accent, fontWeight: 700,
            letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            Trajetória
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900,
            lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Meu Histórico
          </h1>
          <p style={{ color: s.muted, fontSize: 15, lineHeight: 1.7, maxWidth: 560 }}>
            Uma década de mercado — erros, aprendizados, e a construção de uma metodologia
            que transforma dados em decisões consistentes.
          </p>
        </div>

        {/* Timeline */}
        <div style={{ position: 'relative' }}>
          {/* Linha vertical */}
          <div style={{ position: 'absolute', left: 28, top: 0, bottom: 0,
            width: 2, background: `linear-gradient(to bottom, ${s.accent}, rgba(0,212,170,0.1))` }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {HISTORICO.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, paddingBottom: 32 }}>
                {/* Dot */}
                <div style={{ flexShrink: 0, width: 58, display: 'flex',
                  flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%',
                    background: item.cor, border: `3px solid ${s.dark}`,
                    boxShadow: `0 0 12px ${item.cor}88`, marginTop: 16 }} />
                </div>

                {/* Card */}
                <div style={{ flex: 1 }}>
                  <div onClick={() => setExpandido(expandido === i ? null : i)}
                    style={{ background: s.card, border: `1px solid ${expandido === i ? item.cor + '66' : s.border}`,
                      borderRadius: 12, padding: '20px 24px', cursor: 'pointer',
                      transition: 'all .2s', borderLeft: `3px solid ${item.cor}` }}
                    onMouseEnter={e => e.currentTarget.style.borderLeftColor = item.cor}
                    onMouseLeave={e => {if (expandido !== i) e.currentTarget.style.borderColor = s.border}}>

                    <div style={{ display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color: item.cor,
                          lineHeight: 1 }}>{item.ano}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{item.titulo}</div>
                          {item.resultado && (
                            <span style={{ fontSize: 11, color: '#34d47e',
                              background: 'rgba(52,212,126,0.1)', padding: '1px 8px',
                              borderRadius: 99, marginTop: 3, display: 'inline-block' }}>
                              ✓ Positivo
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{ color: s.muted, fontSize: 16,
                        transform: expandido === i ? 'rotate(180deg)' : 'none',
                        transition: 'transform .2s' }}>▼</span>
                    </div>

                    {expandido === i && (
                      <div style={{ marginTop: 16, paddingTop: 16,
                        borderTop: `1px solid ${s.border}` }}>
                        <p style={{ color: s.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                          {item.descricao}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {item.marcos.map((m, j) => (
                            <span key={j} style={{ fontSize: 12, padding: '4px 12px',
                              background: `${item.cor}15`, border: `1px solid ${item.cor}33`,
                              borderRadius: 99, color: item.cor }}>
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: `linear-gradient(135deg, ${s.accent}18, ${s.card})`,
          border: `1px solid ${s.accent}44`, borderRadius: 16, padding: '32px',
          textAlign: 'center', marginTop: 16 }}>
          <p style={{ color: s.muted, fontSize: 14, marginBottom: 20 }}>
            Quer fazer parte dessa jornada? Entre em contato.
          </p>
          <a href={`https://wa.me/5553999010262?text=${encodeURIComponent('Olá! Vi seu histórico e quero saber mais sobre o Método 6015.')}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
              background: s.accent, color: '#000', padding: '12px 28px',
              borderRadius: 10, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
            💬 Falar no WhatsApp →
          </a>
        </div>
      </div>
    </div>
  )
}
