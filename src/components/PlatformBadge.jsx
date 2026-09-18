import React from 'react'

/* Selo da plataforma. O site só publica robôs Nelogica (Profit e Black Arrow);
 * qualquer outra plataforma não chega ao site (filtrada no export e no DataContext). */
const LABEL = { profit: 'Profit', blackarrow: 'Black Arrow' }

export default function PlatformBadge({ platform, size = 16 }) {
  const label = LABEL[platform || 'profit'] || 'Profit'
  return (
    <span title={`Plataforma: ${label} (Nelogica)`}
      style={{ display: 'inline-flex', alignItems: 'center', height: size + 4, padding: '0 7px', borderRadius: 999,
        border: '1px solid rgba(255,255,255,.12)', color: '#8A93A0', fontSize: Math.max(9, size - 6),
        letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Geist Mono', monospace", flexShrink: 0 }}>
      {label}
    </span>
  )
}
