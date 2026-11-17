import axios from 'axios'

// Local development uses the FastAPI server on localhost. Hosted builds set
// VITE_API_BASE_URL to the protected Cloudflare Worker API origin.
const defaultApiBase = import.meta.env.DEV ? 'http://127.0.0.1:8000' : ''

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultApiBase,
  timeout: 25000,
  // Required when the API is on a separate hostname protected by Cloudflare Access.
  withCredentials: true,
})

export type Bar = {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjusted_close?: number | null
  sma20?: number | null
  sma50?: number | null
  ema20?: number | null
  ema50?: number | null
  rsi14?: number | null
  bb_middle?: number | null
  bb_upper?: number | null
  bb_lower?: number | null
  macd?: number | null
  macd_signal?: number | null
  macd_histogram?: number | null
}

export type HistoryPayload = {
  symbol: string
  currency?: string | null
  exchange?: string | null
  interval: string
  period: string
  source: string
  data_status: string
  bars: Bar[]
  indicators?: Record<string, unknown>
}

export async function getHistory(symbol: string, period: string, interval: string) {
  const { data } = await api.get<HistoryPayload>(`/api/history/${encodeURIComponent(symbol)}`, {
    params: { period, interval },
  })
  return data
}

export async function getTechnicals(symbol: string, period: string, interval: string) {
  const { data } = await api.get<HistoryPayload>(`/api/technicals/${encodeURIComponent(symbol)}`, {
    params: { period, interval },
  })
  return data
}

export async function getCompany(symbol: string) {
  const { data } = await api.get(`/api/company/${encodeURIComponent(symbol)}`)
  return data
}

export async function searchSymbols(q: string) {
  const { data } = await api.get(`/api/search`, { params: { q } })
  return data.results as Array<{symbol:string; name:string; exchange?:string; type?:string}>
}

export async function getHealth() {
  const { data } = await api.get('/api/health')
  return data
}
