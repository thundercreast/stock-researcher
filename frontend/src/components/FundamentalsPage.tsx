import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Building2, CalendarClock, CheckCircle2, Database, Download, RefreshCw } from 'lucide-react'
import { getFundamentals, refreshFundamentals, type FundamentalPayload, type FinancialStatement } from '../services/fundamentals'

type Props = { symbol: string }
const statementTabs = [
  { id: 'income_statement', label: 'Income statement' },
  { id: 'balance_sheet', label: 'Balance sheet' },
  { id: 'cash_flow', label: 'Cash flow' },
]
const numberFmt = (value: number, currency: string | null, unit: string) => {
  if (unit === 'per_share') return `${currency || ''} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`.trim()
  if (unit === 'shares') return value.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 2 })
  if (unit === 'currency') return `${currency || ''} ${Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 2 }).format(value)}`.trim()
  if (unit === '%' || unit === 'x') return `${value.toFixed(2)}${unit}`
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export default function FundamentalsPage({ symbol }: Props) {
  const [periodType, setPeriodType] = useState<'annual' | 'quarterly'>('annual')
  const [activeStatement, setActiveStatement] = useState('income_statement')
  const [payload, setPayload] = useState<FundamentalPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function load(force = false) {
    setLoading(!force)
    setRefreshing(force)
    setError('')
    try {
      const result = force ? await refreshFundamentals(symbol, periodType) : await getFundamentals(symbol, periodType)
      setPayload(result)
    } catch (e: any) {
      setPayload(null)
      setError(e?.response?.data?.detail || 'Financial statements could not be retrieved for this ticker.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load(false) }, [symbol, periodType])

  const statement: FinancialStatement | undefined = payload?.statements?.[activeStatement]
  const periods = useMemo(() => (statement?.periods || []).slice(0, 5), [statement])
  // A company's latest balance-sheet date can be newer than its latest annual
  // income statement date. Select the most recent available value per ratio,
  // and retain that ratio's own period so the cards never imply a false common date.
  const latestRatios = useMemo(() => {
    const byCode = new Map<string, { code: string; label: string; value: number; unit: string; period_end: string }>()
    for (const period of payload?.ratios || []) {
      for (const ratio of period.ratios || []) {
        if (!byCode.has(ratio.code)) byCode.set(ratio.code, { ...ratio, period_end: period.period_end })
      }
    }
    return [...byCode.values()]
  }, [payload])
  const ratioCards = latestRatios.filter(r => ['gross_margin', 'operating_margin', 'net_margin', 'return_on_equity', 'current_ratio', 'debt_to_equity'].includes(r.code))
  const companyClassification = [payload?.company?.sector ? `${payload.company.sector_source?.includes('SEC SIC') ? 'SIC sector' : 'Sector'}: ${payload.company.sector}` : null, payload?.company?.industry ? `${payload.company.industry_source?.includes('SEC') ? 'SIC industry' : 'Industry'}: ${payload.company.industry}` : null].filter(Boolean).join(' · ') || 'Classification not supplied'
  const companySubtitle = [symbol, companyClassification, payload?.company?.exchange, payload?.company?.country, payload?.currency].filter(Boolean).join(' · ')

  function exportCsv() {
    if (!statement || !periods.length) return
    const header = ['code', 'line_item', ...periods.map(p => p.period_end)]
    const rows = statement.line_items.map(item => [item.code, item.label, ...periods.map(p => item.values[p.period_end] ?? '')])
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${symbol}-${activeStatement}-${periodType}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return <section className="fundamentals-page">
    <div className="fundamentals-heading">
      <div><div className="eyebrow">COMPANY FINANCIALS</div><h2>Fundamental analysis</h2><p>Normalized financial statements, financial ratios and source-level data provenance.</p></div>
      <div className="fundamental-actions">
        <div className="segmented"><button className={periodType === 'annual' ? 'active' : ''} onClick={() => setPeriodType('annual')}>ANNUAL</button><button className={periodType === 'quarterly' ? 'active' : ''} onClick={() => setPeriodType('quarterly')}>QUARTERLY</button></div>
        <button className="secondary-button" onClick={() => load(true)} disabled={refreshing || loading}><RefreshCw size={13} className={refreshing ? 'spin-icon' : ''}/>{refreshing ? 'Refreshing' : 'Refresh data'}</button>
      </div>
    </div>

    {loading && <div className="fundamental-state"><span className="loader"/> Retrieving and normalizing financial statements. First retrieval can take a little longer.</div>}
    {error && <div className="fundamental-error"><AlertTriangle size={16}/><div><b>Financial data unavailable</b><span>{error}</span><small>Try refreshing, or verify the ticker. Some Indian companies may have incomplete provider coverage.</small></div></div>}

    {payload && <>
      <div className="fundamental-company panel">
        <div className="fundamental-company-icon"><Building2 size={19}/></div>
        <div className="fundamental-company-name"><b>{payload.company?.name || symbol}</b><span>{companySubtitle}</span></div>
        <div className="source-chip"><CheckCircle2 size={12}/>{payload.metadata?.provider_status === 'regulatory_filing_data' ? 'REGULATORY SOURCE' : 'PROVIDER DATA'}</div>
      </div>

      <div className="fundamental-metrics">
        {ratioCards.length ? ratioCards.map(r => <div className="panel fundamental-metric" key={r.code}><small>{r.label.toUpperCase()}</small><b>{numberFmt(r.value, payload.currency, r.unit)}</b><span>{r.period_end}{r.basis === 'quarterly_period_not_annualized' ? ' · Quarterly, not annualized' : ''}</span></div>) : <div className="panel fundamental-metric empty-metric"><small>FINANCIAL RATIOS</small><b>Not enough data</b><span>Required line items may not be reported.</span></div>}
      </div>

      <div className="panel statement-panel">
        <div className="statement-toolbar">
          <div className="statement-tabs">{statementTabs.map(tab => <button key={tab.id} className={activeStatement === tab.id ? 'active' : ''} onClick={() => setActiveStatement(tab.id)}>{tab.label}</button>)}</div>
          <button className="secondary-button export-button" onClick={exportCsv} disabled={!statement?.line_items?.length}><Download size={13}/> Export CSV</button>
        </div>
        {statement?.line_items?.length ? <>
          {(() => {
            const canonicalItems = statement.line_items.filter(item => !item.code.startsWith('provider_'))
            const providerItems = statement.line_items.filter(item => item.code.startsWith('provider_'))
            const renderRows = (items: FinancialStatement['line_items']) => items.map(item => <tr key={item.code}><td><b>{item.label}</b><small>{item.code}</small></td>{periods.map(p => <td key={p.period_end}>{item.values[p.period_end] == null ? '—' : numberFmt(item.values[p.period_end], payload.currency, item.unit)}</td>)}</tr>)
            return <>
              <div className="statement-table-wrap"><table className="statement-table"><thead><tr><th>Financial line item</th>{periods.map(p => <th key={p.period_end}>{p.period_end.slice(0, 4)}<small>{p.period_end}</small></th>)}</tr></thead><tbody>{renderRows(canonicalItems)}</tbody></table></div>
              {providerItems.length > 0 && <details className="provider-items-details"><summary>Additional provider-reported items ({providerItems.length})</summary><div className="statement-table-wrap"><table className="statement-table"><thead><tr><th>Unmapped provider field</th>{periods.map(p => <th key={p.period_end}>{p.period_end.slice(0, 4)}<small>{p.period_end}</small></th>)}</tr></thead><tbody>{renderRows(providerItems)}</tbody></table></div></details>}
            </>
          })()}
        </> : <div className="fundamental-state">No {activeStatement.replaceAll('_', ' ')} rows were returned for this period.</div>}
        <div className="statement-footnote">Values are shown at source-reported scale. Currency and per-share units are retained separately; no inferred thousands/millions conversion is applied.</div>
      </div>

      <div className="panel provenance-panel">
        <div className="provenance-title"><Database size={15}/><b>Data provenance & quality</b><span className="cache-state">CACHE: {payload.metadata?.cache || 'stored'}</span></div>
        <div className="provenance-grid"><div><small>DATA SOURCE</small><b>{payload.metadata?.source || 'Unknown'}</b></div><div><small>PERIOD</small><b>{periodType}</b></div><div><small>DATA MODEL</small><b>{payload.metadata?.data_model || 'Canonical v1'}</b></div><div><small>LAST FETCHED</small><b>{payload.metadata?.fetched_at ? new Date(payload.metadata.fetched_at).toLocaleString() : 'Just retrieved'}</b></div></div>
        {payload.metadata?.official_filing_reference && <p className="quality-note"><Database size={12}/>Official exchange filing reference: <a href={payload.metadata.official_filing_reference} target="_blank" rel="noreferrer">Open exchange financial results</a></p>}
        {payload.normalization && <p className="quality-note"><CheckCircle2 size={12}/>Normalization v{payload.normalization.schema_version || 'unknown'}: {payload.normalization.mapped_provider_rows ?? 0} mapped source rows; {payload.normalization.unmapped_provider_rows ?? 0} retained as provider-specific fields.</p>}
        {(payload.normalization?.unmapped_provider_labels || []).length > 0 && <p className="quality-note"><AlertTriangle size={12}/>Unmapped provider labels: {payload.normalization?.unmapped_provider_labels?.join(', ')}</p>}
        {(payload.metadata?.limitations || []).map((note, index) => <p className="quality-note" key={index}><AlertTriangle size={12}/>{note}</p>)}
        {payload.metadata?.fallback_errors?.length ? <p className="quality-note"><AlertTriangle size={12}/>Secondary provider notes: {payload.metadata.fallback_errors.join(' | ')}</p> : null}
      </div>
    </>}
    {!payload && !loading && !error && <div className="fundamental-state"><CalendarClock size={16}/> Select a company to retrieve its financial statements.</div>}
  </section>
}
