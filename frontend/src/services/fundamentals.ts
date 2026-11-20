import { api } from './api'

export type FinancialPeriod = { period_end: string; period_type: string; fiscal_year?: number | null }
export type FinancialLineItem = { code: string; label: string; unit: string; values: Record<string, number> }
export type FinancialStatement = { periods: FinancialPeriod[]; line_items: FinancialLineItem[] }
export type FundamentalPayload = {
  symbol: string
  currency: string | null
  company: { name?: string; sector?: string | null; industry?: string | null; industry_source?: string | null; profile_source?: string | null; profile_status?: string | null; exchange?: string | null; country?: string | null; website?: string | null; sic_code?: string | null }
  statements: Record<string, FinancialStatement>
  periods: FinancialPeriod[]
  ratios: Array<{ period_end: string; ratios: Array<{ code: string; label: string; value: number; unit: string; basis?: string }> }>
  metadata: { source?: string; provider_status?: string; period_type?: string; cache?: string; fetched_at?: string; retrieved_at?: string; limitations?: string[]; fallback_errors?: string[]; data_model?: string; official_filing_reference?: string; refresh_recommended?: boolean }
  normalization?: { schema_version?: string; mapped_provider_rows?: number; unmapped_provider_rows?: number; unmapped_provider_labels?: string[] }
}

export async function getFundamentals(symbol: string, periodType: 'annual' | 'quarterly', refresh = false) {
  const { data } = await api.get<FundamentalPayload>(`/api/fundamentals/${encodeURIComponent(symbol)}`, {
    params: { period_type: periodType, refresh }, timeout: 60000,
  })
  return data
}

export async function refreshFundamentals(symbol: string, periodType: 'annual' | 'quarterly') {
  const { data } = await api.post<FundamentalPayload>(`/api/fundamentals/${encodeURIComponent(symbol)}/refresh`, null, {
    params: { period_type: periodType }, timeout: 60000,
  })
  return data
}
