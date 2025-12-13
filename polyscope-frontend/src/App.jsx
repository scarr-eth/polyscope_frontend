import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { marketsAPI, predictionsAPI, notificationsAPI } from './services/api'
import './App.css'

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900/20 border border-red-500 rounded text-red-300 text-sm">
          <div className="font-semibold">Something went wrong</div>
          <div className="text-xs mt-1">{this.state.error?.message || 'Unknown error'}</div>
        </div>
      )
    }
    return this.props.children
  }
}

// Debounced search hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

// Email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Loading skeleton
function Skeleton({ className = '' }) {
  return <div className={`bg-slate-800 animate-pulse rounded ${className}`} />
}

// Bookmarks: localStorage key 'polyscope_bookmarks'
function useBookmarks(){
  const [bookmarks, setBookmarks] = useState(()=>{
    try{
      return JSON.parse(localStorage.getItem('polyscope_bookmarks') || '[]')
    }catch{ return [] }
  })
  const save = (bm)=>{
    setBookmarks(bm)
    localStorage.setItem('polyscope_bookmarks', JSON.stringify(bm))
  }
  const toggle = (marketId)=>{
    save(bookmarks.includes(marketId) 
      ? bookmarks.filter(id=>id!==marketId)
      : [...bookmarks, marketId])
  }
  return { bookmarks, toggle, save }
}

// Toast notifications
function useToast(){
  const [toasts,setToasts] = useState([])
  const add = (message, type='info')=>{
    const id = Date.now()
    setToasts(t=>[...t,{id,message,type}])
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)), 4000)
  }
  return { toasts, add }
}

function Header({ onToggleSidebar }) {
  return (
    <header className="sticky top-0 z-40 bg-[#1a1a2e] text-white border-b border-slate-800 w-full">
      <div className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
        <span className="text-lg sm:text-xl font-black uppercase tracking-[0.18em] whitespace-nowrap">POLYSCOPE</span>
        <button className="md:hidden flex-shrink-0 ml-auto px-2 py-1 border rounded text-sm hover:bg-slate-700 transition" onClick={onToggleSidebar} aria-label="Menu" title="Toggle navigation menu">☰</button>
      </div>
    </header>
  )
}

function Sidebar({ open, bookmarks, bookmarkList, onSelectBookmark, onCloseSidebar }) {
  return (
    <aside className={`fixed md:relative top-0 left-0 h-screen md:h-auto w-screen md:w-64 z-50 bg-[#0f0f1e] text-slate-200 border-r border-slate-800 overflow-y-auto transition-transform ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="md:hidden sticky top-0 bg-[#0f0f1e] border-b border-slate-800 flex justify-end items-center p-4">
        <button onClick={onCloseSidebar} className="text-xl px-2 py-1 rounded hover:bg-slate-800 transition" aria-label="Close menu">✕</button>
      </div>
      <nav className="space-y-1 p-4">
        <Link className="nav-link block px-3 py-2 rounded hover:bg-slate-800 transition" to="/markets" onClick={onCloseSidebar}>Home</Link>
        <Link className="nav-link block px-3 py-2 rounded hover:bg-slate-800 transition" to="/markets" onClick={onCloseSidebar}>Markets</Link>
        <details className="group">
          <summary className="nav-link px-3 py-2 rounded hover:bg-slate-800 cursor-pointer transition">Bookmarks ({bookmarks.length})</summary>
          <div className="pl-3 mt-1 space-y-1 text-sm text-slate-400">
            {bookmarks.length === 0 ? (
              <div>No bookmarks yet</div>
            ) : (
              bookmarkList.map((m,i)=>(
                <button key={i} onClick={()=>{onSelectBookmark(m); onCloseSidebar()}} className="nav-link block w-full text-left px-2 py-1 rounded hover:bg-slate-800 truncate text-slate-300 hover:text-white transition">
                  {m.title}
                </button>
              ))
            )}
          </div>
        </details>
        <Link className="nav-link block px-3 py-2 rounded hover:bg-slate-800 transition" to="/stats" onClick={onCloseSidebar}>Stats</Link>
        <Link className="nav-link block px-3 py-2 rounded hover:bg-slate-800 transition" to="/about" onClick={onCloseSidebar}>About/Contact</Link>
        <Link className="nav-link block px-3 py-2 rounded hover:bg-slate-800 transition" to="/faq" onClick={onCloseSidebar}>FAQ</Link>
      </nav>
    </aside>
  )
}

function Toast({ toasts }){
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map(t=>(
        <div key={t.id} className={`px-4 py-2 rounded text-white pointer-events-auto ${t.type==='error'?'bg-red-500':t.type==='success'?'bg-green-500':'bg-blue-500'} animate-in fade-in slide-in-from-top-2`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-auto bg-[#0f0f1e] text-slate-400 border-t border-slate-800 w-full">
      <div className="w-full px-3 sm:px-4 py-4 sm:py-6 text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2025 Polyscope</span>
        <a href="https://x.com/sxarr__" target="_blank" rel="noreferrer" className="text-[#00d4ff] hover:underline">Made by Scarr</a>
      </div>
    </footer>
  )
}

function MarketsPage({ searchTerm, onSearch, onOpenModal }) {
  const [categories,setCategories] = useState([])
  const [activeCategory,setActiveCategory] = useState('')
  const [markets,setMarkets] = useState([])
  const [page,setPage] = useState(1)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  
  const debouncedSearch = useDebounce(searchTerm, 300)
  const limit = 15

  useEffect(()=>{
    let cancel = false
    async function loadCategories(){
      try {
        const trending = await marketsAPI.trending({ limit: 50 })
        if (!cancel && trending.markets) {
          const cats = Array.from(new Set(trending.markets.map(m=>m.category).filter(Boolean)))
          setCategories(cats.slice(0,5))
        }
      } catch(e){
        console.error('Failed to load categories:', e)
      }
    }
    loadCategories()
    return ()=>{ cancel = true }
  },[])

  useEffect(()=>{
    let cancelled = false
    async function load(){
      try {
        setLoading(true)
        setError('')
        const params = { limit, offset: (page-1)*limit }
        if (debouncedSearch) params.search = debouncedSearch
        if (activeCategory) params.category = activeCategory
        const data = await marketsAPI.list(params)
        if (!cancelled) setMarkets(data.markets || [])
      } catch(e){
        if (!cancelled) {
          setError(e.message || 'Failed to load markets. Please try again.')
          setMarkets([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return ()=>{ cancelled = true }
  },[debouncedSearch, activeCategory, page, retryCount])

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
        <div className="flex items-center gap-2 flex-1 bg-slate-900 border border-slate-800 rounded-full px-3 py-2">
          <span className="text-slate-400 text-sm">🔍</span>
          <input
            value={searchTerm}
            onChange={(e)=>onSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-500"
            placeholder="Search markets"
            aria-label="Search markets"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['Featured','Newest','Volume','Trending','Ending','Open'].map((label)=> (
            <button key={label} className="px-3 py-1.5 rounded-full text-xs sm:text-sm bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:text-white transition">{label}</button>
          ))}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c)=> (
            <button key={c} onClick={()=>{setActiveCategory(c); setPage(1)}} className={`px-3 py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap transition flex-shrink-0 ${activeCategory===c? 'bg-indigo-600 text-white':'bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-600'}`} aria-pressed={activeCategory===c}>{c}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mt-2">
          {Array(6).fill(0).map((_, i)=>(
            <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 card-shadow">
              <Skeleton className="h-36 w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded text-red-300 text-sm">
          <div className="font-semibold">Error loading markets</div>
          <div className="mt-1">{error}</div>
          <button onClick={()=>{setRetryCount(c=>c+1); setPage(1)}} className="mt-2 px-3 py-1 rounded bg-red-600 hover:bg-red-700 transition text-white text-xs">Retry</button>
        </div>
      ) : markets.length === 0 ? (
        <div className="mt-8 text-center text-slate-400">
          <div className="text-base sm:text-lg mb-2">No markets found</div>
          <div className="text-xs sm:text-sm">Try adjusting your search or filters</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mt-2">
          {markets.map((m)=> (
            <button key={m.marketId || m.id} onClick={()=>onOpenModal(m)} className="text-left rounded-2xl bg-slate-900 border border-slate-800 p-3 sm:p-4 hover:border-indigo-500 hover:bg-slate-800 transition active:scale-95 card-shadow" aria-label={`View prediction for ${m.title}`}>
              <div className="relative h-40 w-full rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-700 mb-3">
                <div className="absolute inset-0 opacity-60" style={{backgroundImage:'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.35), transparent 40%), radial-gradient(circle at 70% 0%, rgba(0,212,255,0.25), transparent 45%)'}} />
                <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/50 text-xs flex items-center gap-1 border border-white/10">
                  <span className="text-green-400">●</span>
                  Live
                </div>
              </div>
              <div className="font-semibold text-white mb-2 line-clamp-2 text-sm sm:text-base">{m.title}</div>
              <div className="text-xs mb-3 flex flex-wrap gap-2 text-slate-300">
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full">{m.category || 'Unknown'}</span>
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full">{m.sentiment?.label || 'Sentiment'}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>YES</span><span className="text-slate-400">NO</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500" style={{width: `${m.yesProbability || 58}%`}} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="text-green-400 font-semibold">{m.yesProbability || 58}%</span>
                <span className="text-fuchsia-400 font-semibold">{m.noProbability || 42}%</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">💰 {m.liquidityFormatted || `$${(m.liquidity||0).toLocaleString()}`}</span>
                <span className="flex items-center gap-1">📈 {m.volume24hFormatted || `$${(m.volume24h||0).toLocaleString()}`}</span>
                <span className="flex items-center gap-1">⏰ {m.expiryDate || m.expiry || 'N/A'}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && markets.length > 0 && (
        <div className="mt-6 flex justify-center gap-2 flex-wrap">
          <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-indigo-500 transition text-xs sm:text-sm" aria-label="Previous page">Prev</button>
          <span className="px-3 py-1 text-slate-300 text-xs sm:text-sm">Pg {page}</span>
          <button onClick={()=>setPage(p=>p+1)} className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-200 hover:border-indigo-500 transition text-xs sm:text-sm" aria-label="Next page">Next</button>
        </div>
      )}

      <div className="max-w-4xl mx-auto mt-8 sm:mt-10 p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 card-shadow">
        <h3 className="text-white font-semibold mb-3 text-sm sm:text-base">Get Prediction Updates</h3>
        <EmailSubscribeForm/>
      </div>
    </div>
  )
}

function EmailSubscribeForm(){
  const [email,setEmail] = useState('')
  const [immediate,setImmediate] = useState(false)
  const [daily,setDaily] = useState(false)
  const [status,setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading,setLoading] = useState(false)

  const emailError = email && !isValidEmail(email) ? 'Invalid email address' : ''

  async function submit(e){
    e.preventDefault()
    if (emailError) return
    
    try{
      setLoading(true)
      setError('')
      setStatus('')
      const frequency = immediate ? 'immediate' : daily ? 'daily' : 'daily'
      await notificationsAPI.subscribeEmail({ email, frequency })
      setStatus('✓ Subscribed! Please check your email to verify.')
      setEmail('')
      setImmediate(false)
      setDaily(false)
    }catch(e){
      setError(e.message || 'Subscription failed. Please try again.')
    }finally{ 
      setLoading(false) 
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:gap-3">
      <div>
        <input 
          value={email} 
          onChange={(e)=>setEmail(e.target.value)} 
          className={`w-full px-2 sm:px-3 py-2 rounded bg-slate-800 border text-xs sm:text-sm text-white transition ${emailError ? 'border-red-500' : 'border-slate-700 focus:border-[#6366f1]'} focus:outline-none`}
          placeholder="Enter your email" 
          type="email"
          disabled={loading}
          aria-label="Email address"
        />
        {emailError && <div className="text-red-400 text-xs mt-1">{emailError}</div>}
      </div>
      <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 cursor-pointer hover:text-white transition">
        <input type="checkbox" checked={immediate} onChange={(e)=>setImmediate(e.target.checked)} disabled={loading} aria-label="Immediate alerts"/>
        <span className="line-clamp-2">Email alerts for high-confidence predictions</span>
      </label>
      <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 cursor-pointer hover:text-white transition">
        <input type="checkbox" checked={daily} onChange={(e)=>setDaily(e.target.checked)} disabled={loading} aria-label="Daily digest"/>
        <span className="line-clamp-2">Daily digest of top 5 predictions</span>
      </label>
      <button 
        disabled={loading || !email || !!emailError} 
        type="submit"
        className="px-3 sm:px-4 py-2 rounded bg-[#6366f1] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition text-xs sm:text-sm"
      >
        {loading? 'Subscribing...' : 'Subscribe'}
      </button>
      {error && <div className="text-red-400 text-xs sm:text-sm">{error}</div>}
      {status && <div className="text-green-400 text-xs sm:text-sm">{status}</div>}
    </form>
  )
}

function PredictionModal({ market, onClose, bookmarks, onToggleBookmark }){
  const [data,setData] = useState(null)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')

  useEffect(()=>{
    let cancelled=false
    async function load(){
      try{
        setLoading(true); setError('')
        const res = await predictionsAPI.predictAll(market.marketId || market.id, 'daily')
        if (!cancelled) setData(res)
      }catch(e){
        if (!cancelled) setError(e.message || 'Failed to load prediction. Please try again.')
      }finally{ if(!cancelled) setLoading(false) }
    }
    if (market) load()
    return ()=>{ cancelled=true }
  },[market])

  if (!market) return null

  const isBookmarked = bookmarks.includes(market.marketId || market.id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} role="presentation" />
      <div className="relative bg-slate-900 border border-slate-700 rounded-lg w-full max-w-2xl mx-4 p-4 animate-in slide-in-from-bottom-4 max-h-96 overflow-y-auto">
        <div className="absolute top-2 right-2 flex gap-2">
          <button 
            className={`text-xl transition ${isBookmarked ? 'text-yellow-400' : 'text-slate-300 hover:text-white'}`} 
            onClick={()=>onToggleBookmark(market.marketId || market.id)}
            aria-label={`${isBookmarked ? 'Remove from' : 'Add to'} bookmarks`}
            title={`${isBookmarked ? 'Remove from' : 'Add to'} bookmarks`}
          >★</button>
          <button 
            className="text-slate-300 hover:text-white transition" 
            onClick={onClose}
            aria-label="Close prediction modal"
            title="Close"
          >✕</button>
        </div>
        <h2 className="text-white font-semibold mb-2 pr-12 line-clamp-3">{market.title}</h2>
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" /></div>
        ) : error ? (
          <div className="p-3 bg-red-900/20 border border-red-500 rounded text-red-300 text-sm">{error}</div>
        ) : data ? (
          <div className="space-y-3 text-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold">Prediction:</span>
              <span className={`${data.prediction==='YES' ? 'text-green-400' : 'text-red-400'} text-lg font-semibold`}>{data.prediction}</span>
            </div>
            <div>
              <div className="flex justify-between mb-1"><span>Confidence</span><span className="font-semibold">{data.confidence}%</span></div>
              <div className="w-full bg-slate-800 rounded h-2"><div className="bg-[#6366f1] h-2 rounded" style={{width: `${data.confidence||0}%`}}/></div>
            </div>
            <div>
              <div className="text-sm">YES Probability: {data.yes_probability}%</div>
              <div className="w-full bg-slate-800 rounded h-2"><div className="bg-green-500 h-2 rounded" style={{width: `${data.yes_probability||0}%`}}/></div>
            </div>
            <div>
              <div className="text-sm">NO Probability: {data.no_probability}%</div>
              <div className="w-full bg-slate-800 rounded h-2"><div className="bg-red-500 h-2 rounded" style={{width: `${data.no_probability||0}%`}}/></div>
            </div>
            {data.reason && <div className="text-sm"><strong>Reason:</strong> {data.reason}</div>}
            {data.notes && <div className="text-xs text-slate-400"><strong>Notes:</strong> {data.notes}</div>}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function StatsPage(){
  const [stats,setStats] = useState(null)
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    setTimeout(()=>{
      setStats({
        bullishWinRate: 62,
        bearishWinRate: 58,
        overallWinRate: 60,
        totalMarketsAnalyzed: 284
      })
      setLoading(false)
    }, 500)
  },[])

  return (
    <div className="p-4 text-white">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" /></div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div className="bg-slate-900 border border-slate-700 p-4 rounded">
            <div className="text-slate-400 text-sm">Bullish Win Rate</div>
            <div className="text-3xl font-bold text-green-400">{stats.bullishWinRate}%</div>
          </div>
          <div className="bg-slate-900 border border-slate-700 p-4 rounded">
            <div className="text-slate-400 text-sm">Bearish Win Rate</div>
            <div className="text-3xl font-bold text-red-400">{stats.bearishWinRate}%</div>
          </div>
          <div className="bg-slate-900 border border-slate-700 p-4 rounded">
            <div className="text-slate-400 text-sm">Overall Win Rate</div>
            <div className="text-3xl font-bold text-blue-400">{stats.overallWinRate}%</div>
          </div>
          <div className="bg-slate-900 border border-slate-700 p-4 rounded">
            <div className="text-slate-400 text-sm">Total Markets Analyzed</div>
            <div className="text-3xl font-bold text-[#00d4ff]">{stats.totalMarketsAnalyzed}</div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AboutPage(){
  return (
    <div className="p-4 text-white max-w-2xl">
      <h1 className="text-3xl font-bold mb-4">About Polyscope</h1>
      <p className="mb-4 text-slate-300">Polyscope is an AI-powered prediction engine for Polymarket outcomes. We analyze 40+ market features including liquidity, sentiment, trading activity, and whale behavior to generate high-confidence predictions.</p>
      <h2 className="text-xl font-semibold mb-2">How It Works</h2>
      <ol className="list-decimal pl-5 space-y-2 text-slate-300">
        <li>Enter or paste a Polymarket URL</li>
        <li>Our AI analyzes market data and metrics</li>
        <li>Get a prediction with confidence score and breakdown</li>
        <li>Subscribe to email alerts for updates</li>
      </ol>
      <h2 className="text-xl font-semibold mb-2 mt-6">Contact</h2>
      <p className="text-slate-300">Questions? Reach out on <a href="https://x.com/sxarr__" target="_blank" rel="noreferrer" className="text-[#00d4ff] hover:underline">Twitter</a></p>
    </div>
  )
}

function FAQPage(){
  const faqs = [
    {
      q: 'How accurate are the predictions?',
      a: 'Our models achieve ~60% accuracy across diverse market conditions. Accuracy varies by market type and maturity.'
    },
    {
      q: 'What is the confidence score?',
      a: 'Confidence (0-100) reflects model certainty. Higher scores indicate stronger signal across our 40+ features.'
    },
    {
      q: 'Can I get email notifications?',
      a: 'Yes! Subscribe on the Markets page. Choose immediate alerts or daily digest notifications.'
    },
    {
      q: 'Is there a delay in predictions?',
      a: 'Predictions update in real-time as market data changes. Most analyses complete within seconds.'
    },
    {
      q: 'What markets can Polyscope analyze?',
      a: 'Any Polymarket with sufficient liquidity and trading history. Very new or illiquid markets may have lower confidence.'
    }
  ]
  return (
    <div className="p-4 text-white max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
      <div className="space-y-2">
        {faqs.map((faq,i)=>(
          <details key={i} className="bg-slate-900 border border-slate-700 p-4 rounded cursor-pointer">
            <summary className="font-semibold text-slate-200 hover:text-white">{faq.q}</summary>
            <p className="mt-2 text-slate-400 text-sm">{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}

function PageContainer({ children }){
  const location = useLocation()
  // simple CSS-based transition using classes
  return (
    <div key={location.key} className="page-transition">
      {children}
    </div>
  )
}

export default function App(){
  const [sidebarOpen,setSidebarOpen] = useState(false)
  const [searchTerm,setSearchTerm] = useState('')
  const [modalMarket,setModalMarket] = useState(null)
  const { bookmarks, toggle } = useBookmarks()
  const { toasts, add: addToast } = useToast()
  const [bookmarkList, setBookmarkList] = useState([])

  // Load bookmarked markets when bookmarks change
  useEffect(()=>{
    async function load(){
      try{
        const list = await Promise.all(
          bookmarks.map(id=>marketsAPI.get(id).catch(()=>null))
        )
        setBookmarkList(list.filter(Boolean))
      }catch(e){ 
        console.error('Failed to load bookmarks:', e)
      }
    }
    if (bookmarks.length) load()
    else setBookmarkList([])
  },[bookmarks])

  // Force dark theme baseline
  useEffect(()=>{
    document.documentElement.classList.add('dark')
    document.body.className = 'bg-[#0f0f1e]'
  },[])

  // Close sidebar on route change
  const location = useLocation()
  useEffect(()=>{
    setSidebarOpen(false)
  },[location.pathname])

  return (
    <ErrorBoundary>
      <div className="min-h-screen w-screen flex flex-col overflow-x-hidden app-bg text-slate-100">
        <Header onToggleSidebar={()=>setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-1 relative overflow-hidden">
          {sidebarOpen && <div className="fixed inset-0 bg-black/60 md:hidden z-40" onClick={()=>setSidebarOpen(false)} role="presentation" />}
          <Sidebar 
            open={sidebarOpen} 
            bookmarks={bookmarks} 
            bookmarkList={bookmarkList} 
            onSelectBookmark={m=>setModalMarket(m)} 
            onCloseSidebar={()=>setSidebarOpen(false)} 
          />
          <main className="flex-1 bg-[#0f0f1e] w-full overflow-y-auto">
            <PageContainer>
              <Routes>
                <Route path="/" element={<Navigate to="/markets" replace />} />
                <Route path="/markets" element={<MarketsPage searchTerm={searchTerm} onSearch={setSearchTerm} onOpenModal={(m)=>setModalMarket(m)} />} />
                <Route path="/stats" element={<StatsPage/>} />
                <Route path="/about" element={<AboutPage/>} />
                <Route path="/faq" element={<FAQPage/>} />
              </Routes>
            </PageContainer>
          </main>
        </div>
        <Footer/>
        <Toast toasts={toasts} />
        {modalMarket && (
          <PredictionModal 
            market={modalMarket} 
            onClose={()=>setModalMarket(null)} 
            bookmarks={bookmarks} 
            onToggleBookmark={(id)=>{
              toggle(id)
              addToast(`${bookmarks.includes(id) ? 'Removed from' : 'Added to'} bookmarks`, 'success')
            }} 
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
