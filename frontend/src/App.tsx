import { useEffect, useMemo, useState } from 'react'
import {
  Activity, BarChart3, Bell, BookOpen, ChevronDown, CircleHelp, Clock3,
  Database, FileText, Globe2, Layers3, LineChart, Newspaper, Search,
  Settings2, ShieldCheck, SlidersHorizontal, Sparkles, TrendingUp,
} from 'lucide-react'
import PriceChart from './components/PriceChart'
import FundamentalsPage from './components/FundamentalsPage'
import { getCompany, getHealth, getTechnicals, searchSymbols, type Bar } from './services/api'

const quickSymbols = ['AAPL', 'MSFT', 'NVDA', 'RELIANCE.NS', 'TCS.NS']

function makeDemoBars(): Bar[] {
  const result: Bar[] = []
  let price = 180
  const now = new Date()
  for (let i = 150; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    const drift = (Math.random() - 0.47) * 4
    const open = price
    const close = Math.max(20, open + drift)
    const high = Math.max(open, close) + Math.random() * 2
    const low = Math.min(open, close) - Math.random() * 2
    price = close
    result.push({
      time: d.toISOString().slice(0, 10),
      open: +open.toFixed(2), high: +high.toFixed(2),
      low: +low.toFixed(2), close: +close.toFixed(2),
      volume: Math.round(1500000 + Math.random() * 3000000),
    })
  }
  return result
}

const nav = [
  { label: 'Overview', icon: BarChart3 },
  { label: 'News', icon: Newspaper },
  { label: 'Technicals', icon: Activity },
  { label: 'Seasonals', icon: Layers3 },
  { label: 'Fundamentals', icon: BookOpen },
  { label: 'Valuation', icon: TrendingUp },
  { label: 'Simulations', icon: LineChart },
  { label: 'Comparisons', icon: SlidersHorizontal },
  { label: 'Research', icon: FileText },
]

export default function App() {
  const [symbol, setSymbol] = useState('AAPL')
  const [query, setQuery] = useState('AAPL')
  const [bars, setBars] = useState<Bar[]>([])
  const [company, setCompany] = useState<any>(null)
  const [period, setPeriod] = useState('1y')
  const [interval, setInterval] = useState('1d')
  const [loading, setLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<'checking'|'online'|'offline'>('checking')
  const [dataSource, setDataSource] = useState('Waiting for market data')
  const [error, setError] = useState('')
  const [activeNav, setActiveNav] = useState('Overview')
  const [suggestions, setSuggestions] = useState<Array<{symbol:string;name:string;exchange?:string}>>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [showSma, setShowSma] = useState(true)
  const [showEma, setShowEma] = useState(false)
  const [showBollinger, setShowBollinger] = useState(false)

  useEffect(() => {
    getHealth().then(() => setApiStatus('online')).catch(() => setApiStatus('offline'))
  }, [])

  async function loadStock(nextSymbol: string, nextPeriod = period, nextInterval = interval) {
    const clean = nextSymbol.trim().toUpperCase()
    if (!clean) return
    setLoading(true)
    setError('')
    setSymbol(clean)
    setQuery(clean)
    setSearchOpen(false)
    try {
      const [historyResult, companyResult] = await Promise.all([
        getTechnicals(clean, nextPeriod, nextInterval),
        getCompany(clean).catch(() => null),
      ])
      setBars(historyResult.bars)
      setDataSource(`${historyResult.source} · ${historyResult.data_status.replaceAll('_', ' ')}`)
      setCompany(companyResult)
      setApiStatus('online')
    } catch (e: any) {
      setBars(makeDemoBars())
      setCompany(null)
      setDataSource('DEMO DATA · Provider unavailable')
      setApiStatus('offline')
      setError(e?.response?.data?.detail || 'Could not load provider data. Showing clearly labelled demo data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStock('AAPL', '1y', '1d') }, [])

  async function handleSearch(value: string) {
    setQuery(value)
    if (value.trim().length < 1) { setSuggestions([]); return }
    try {
      const results = await searchSymbols(value)
      setSuggestions(results.slice(0, 7))
    } catch {
      setSuggestions([{ symbol: value.toUpperCase(), name: 'Search ticker directly' }])
    }
    setSearchOpen(true)
  }

  const latest = bars[bars.length - 1]
  const previous = bars[bars.length - 2]
  const change = latest && previous ? latest.close - previous.close : 0
  const changePct = previous ? (change / previous.close) * 100 : 0
  const currency = company?.currency || (symbol.endsWith('.NS') || symbol.endsWith('.BO') ? 'INR' : 'USD')
  const formatPrice = (v: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(v)
  const companyName = company?.name || symbol
  const isPositive = change >= 0

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><TrendingUp size={19}/></div>
          <div><strong>Stock Researcher</strong><span>RESEARCH TERMINAL</span></div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <div className="nav-list">
          {nav.map(item => {
            const Icon = item.icon
            return <button key={item.label} className={`nav-item ${activeNav === item.label ? 'active' : ''}`}
              onClick={() => setActiveNav(item.label)}>
              <Icon size={16}/><span>{item.label}</span>
              {item.label === 'Overview' && <span className="nav-dot"/>}
            </button>
          })}
        </div>
        <div className="sidebar-bottom">
          <div className="connection-card">
            <div className="connection-title"><Database size={14}/> DATA CONNECTION</div>
            <div className="connection-state"><span className={`status-dot ${apiStatus}`}/>{apiStatus === 'online' ? 'Backend connected' : apiStatus === 'offline' ? 'Backend unavailable' : 'Checking connection'}</div>
            <small>{import.meta.env.DEV ? 'Local API · 127.0.0.1:8000' : 'Cloudflare · Private API'}</small>
          </div>
          <button className="nav-item"><Settings2 size={16}/>Settings</button>
          <button className="nav-item"><CircleHelp size={16}/>Help & documentation</button>
          <div className="profile"><div className="avatar">SR</div><div><b>Local workspace</b><small>Personal research</small></div><ChevronDown size={14}/></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><b>{activeNav}</b></div>
          <div className="top-actions">
            <div className="market-chip"><span className="status-dot online"/><Globe2 size={14}/> US + INDIA</div>
            <button className="icon-button" title="Notifications"><Bell size={17}/></button>
            <button className="icon-button" title="Help"><CircleHelp size={17}/></button>
          </div>
        </header>

        <div className="content">
          <section className="page-heading">
            <div><div className="eyebrow">EQUITY RESEARCH WORKSPACE</div><h1>{activeNav === 'Overview' ? 'Market overview' : activeNav}</h1>
              <p>Market intelligence, technical analysis and fundamental research.</p></div>
            <div className="heading-meta"><span><Clock3 size={14}/> Daily data</span><span><ShieldCheck size={14}/> Local-first</span></div>
          </section>

          <section className="search-row">
            <div className="search-box">
              <Search size={17}/>
              <input value={query} onChange={e => handleSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') loadStock(query); if (e.key === 'Escape') setSearchOpen(false) }}
                onFocus={() => suggestions.length && setSearchOpen(true)}
                placeholder="Search company or ticker (AAPL, RELIANCE.NS...)"/>
              {loading && <span className="loader"/>}
              {searchOpen && suggestions.length > 0 && <div className="suggestions">
                {suggestions.map(item => <button key={item.symbol} onClick={() => loadStock(item.symbol)}>
                  <span className="suggestion-symbol">{item.symbol}</span><span>{item.name}</span><small>{item.exchange || 'Ticker'}</small>
                </button>)}
              </div>}
            </div>
            <button className="primary-button" onClick={() => loadStock(query)}><Search size={15}/> Analyse</button>
          </section>

          <section className="quick-tickers">
            <span>QUICK ACCESS</span>
            {quickSymbols.map(s => <button key={s} className={symbol === s ? 'selected' : ''} onClick={() => loadStock(s)}>{s}</button>)}
          </section>

          {activeNav === 'Fundamentals' ? <FundamentalsPage symbol={symbol}/> : <>
          {error && <div className="notice"><Sparkles size={15}/>{error}</div>}

          <section className="security-header panel">
            <div className="security-identity">
              <div className="ticker-avatar">{symbol.slice(0, 1)}</div>
              <div><div className="company-title">{companyName}</div><div className="company-subtitle">{symbol} <span>·</span> {company?.exchange || 'Exchange lookup pending'} <span>·</span> {currency}</div></div>
            </div>
            <div className="price-block">
              <strong>{latest ? `${currency} ${formatPrice(latest.close)}` : '—'}</strong>
              <span className={isPositive ? 'positive' : 'negative'}>{latest ? `${isPositive ? '+' : ''}${formatPrice(change)} (${changePct.toFixed(2)}%)` : 'No quote'}</span>
            </div>
            <div className="security-tags"><span className="tag">EQUITY</span><span className="tag muted-tag">{company?.sector || 'Sector unavailable'}</span></div>
          </section>

          <section className="chart-panel panel">
            <div className="panel-heading">
              <div><h2>Price action</h2><p>{symbol} · Historical OHLCV</p></div>
              <div className="chart-controls">
                <div className="segmented">
                  {['1mo','3mo','6mo','1y','2y','5y'].map(p => <button key={p} className={period === p ? 'active' : ''} onClick={() => { setPeriod(p); loadStock(symbol, p, interval) }}>{p.toUpperCase()}</button>)}
                </div>
                <select value={interval} onChange={e => { setInterval(e.target.value); loadStock(symbol, period, e.target.value) }}>
                  <option value="1d">1D</option><option value="1wk">1W</option><option value="1mo">1M</option>
                </select>
              </div>
            </div>
            <div className="indicator-toolbar">
              <span>OVERLAYS</span>
              <button className={showSma ? 'enabled' : ''} onClick={() => setShowSma(v => !v)}>SMA 20 / 50</button>
              <button className={showEma ? 'enabled' : ''} onClick={() => setShowEma(v => !v)}>EMA 20 / 50</button>
              <button className={showBollinger ? 'enabled' : ''} onClick={() => setShowBollinger(v => !v)}>Bollinger Bands</button>
            </div>
            <div className="chart-legend"><span className="legend-green"/> Up <span className="legend-red"/> Down <span className="legend-blue"/> Volume</div>
            {bars.length ? <PriceChart bars={bars} showSma={showSma} showEma={showEma} showBollinger={showBollinger}/> : <div className="chart-empty">Load a ticker to view historical prices.</div>}
            <div className="chart-footer"><span>{dataSource}</span><span>{bars.length.toLocaleString()} bars</span></div>
          </section>

          <section className="bottom-grid">
            <div className="panel data-panel">
              <div className="panel-heading"><div><h2>Market data</h2><p>Latest available bar</p></div><Activity size={17}/></div>
              <div className="metric-grid">
                <div><small>OPEN</small><b>{latest ? formatPrice(latest.open) : '—'}</b></div>
                <div><small>HIGH</small><b>{latest ? formatPrice(latest.high) : '—'}</b></div>
                <div><small>LOW</small><b>{latest ? formatPrice(latest.low) : '—'}</b></div>
                <div><small>VOLUME</small><b>{latest ? latest.volume.toLocaleString() : '—'}</b></div>
                <div><small>RSI (14)</small><b>{latest?.rsi14 != null ? latest.rsi14.toFixed(2) : 'Warming up'}</b></div>
              </div>
            </div>
            <div className="panel next-panel">
              <div className="panel-heading"><div><h2>Research modules</h2><p>Development roadmap</p></div><Layers3 size={17}/></div>
              <div className="module-list">
                <div><span className="module-status ready"/>Market data & charting <b>ACTIVE</b></div>
                <div><span className="module-status ready"/>Technical indicators <b>ACTIVE</b></div>
                <div><span className="module-status ready"/>Financial statements & ratios <b>ACTIVE</b></div>
                <div><span className="module-status planned"/>DCF valuation <b>PLANNED</b></div>
                <div><span className="module-status planned"/>Monte Carlo simulations <b>PLANNED</b></div>
              </div>
            </div>
          </section>

          <footer><span>STOCK RESEARCHER · VERSION 0.3.0</span><span>For research and educational use · Not investment advice</span></footer>
          </>}
        </div>
      </main>
    </div>
  )
}
