import { useEffect, useRef } from 'react'
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type UTCTimestamp,
} from 'lightweight-charts'
import type { Bar } from '../services/api'

type Props = {
  bars: Bar[]
  height?: number
  showSma: boolean
  showEma: boolean
  showBollinger: boolean
}

const toLine = (bars: Bar[], key: keyof Bar) => bars
  .filter(b => typeof b[key] === 'number' && Number.isFinite(b[key] as number))
  .map(b => ({ time: b.time as UTCTimestamp, value: b[key] as number }))

export default function PriceChart({ bars, height = 360, showSma, showEma, showBollinger }: Props) {
  const priceHost = useRef<HTMLDivElement>(null)
  const rsiHost = useRef<HTMLDivElement>(null)
  const macdHost = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!priceHost.current || !rsiHost.current || !macdHost.current || !bars.length) return
    const baseOptions = (el: HTMLDivElement, chartHeight: number) => ({
      width: el.clientWidth,
      height: chartHeight,
      layout: { background: { type: ColorType.Solid, color: '#0b111b' }, textColor: '#91a0b5', fontFamily: 'Inter, ui-sans-serif, system-ui' },
      grid: { vertLines: { color: 'rgba(130,150,180,.08)' }, horzLines: { color: 'rgba(130,150,180,.08)' } },
      rightPriceScale: { borderColor: 'rgba(130,150,180,.18)' },
      timeScale: { borderColor: 'rgba(130,150,180,.18)', timeVisible: false },
      crosshair: { mode: 1 },
    })

    const priceChart = createChart(priceHost.current, baseOptions(priceHost.current, height))
    const rsiChart = createChart(rsiHost.current, baseOptions(rsiHost.current, 150))
    const macdChart = createChart(macdHost.current, baseOptions(macdHost.current, 150))

    const valid = bars.filter(b => Number.isFinite(b.open) && Number.isFinite(b.close))
    const candles = priceChart.addSeries(CandlestickSeries, {
      upColor: '#20b889', downColor: '#ef626c', borderUpColor: '#20b889', borderDownColor: '#ef626c', wickUpColor: '#20b889', wickDownColor: '#ef626c',
    })
    candles.setData(valid.map(b => ({ time: b.time as UTCTimestamp, open: b.open, high: b.high, low: b.low, close: b.close })))

    const volume = priceChart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' }, priceScaleId: 'volume', color: '#35506c', lastValueVisible: false, priceLineVisible: false,
    })
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })
    volume.setData(valid.map(b => ({ time: b.time as UTCTimestamp, value: b.volume, color: b.close >= b.open ? 'rgba(32,184,137,.35)' : 'rgba(239,98,108,.35)' })))

    if (showSma) {
      const sma20 = priceChart.addSeries(LineSeries, { color: '#e7b85c', lineWidth: 2, title: 'SMA 20', priceLineVisible: false })
      sma20.setData(toLine(valid, 'sma20'))
      const sma50 = priceChart.addSeries(LineSeries, { color: '#d88c54', lineWidth: 2, title: 'SMA 50', priceLineVisible: false })
      sma50.setData(toLine(valid, 'sma50'))
    }
    if (showEma) {
      const ema20 = priceChart.addSeries(LineSeries, { color: '#58b7e8', lineWidth: 2, title: 'EMA 20', priceLineVisible: false })
      ema20.setData(toLine(valid, 'ema20'))
      const ema50 = priceChart.addSeries(LineSeries, { color: '#9b8be8', lineWidth: 2, title: 'EMA 50', priceLineVisible: false })
      ema50.setData(toLine(valid, 'ema50'))
    }
    if (showBollinger) {
      const upper = priceChart.addSeries(LineSeries, { color: 'rgba(125,153,190,.8)', lineWidth: 1, lineStyle: LineStyle.Dashed, title: 'BB Upper', priceLineVisible: false, lastValueVisible: false })
      const middle = priceChart.addSeries(LineSeries, { color: 'rgba(125,153,190,.65)', lineWidth: 1, title: 'BB Middle', priceLineVisible: false, lastValueVisible: false })
      const lower = priceChart.addSeries(LineSeries, { color: 'rgba(125,153,190,.8)', lineWidth: 1, lineStyle: LineStyle.Dashed, title: 'BB Lower', priceLineVisible: false, lastValueVisible: false })
      upper.setData(toLine(valid, 'bb_upper'))
      middle.setData(toLine(valid, 'bb_middle'))
      lower.setData(toLine(valid, 'bb_lower'))
    }

    const rsi = rsiChart.addSeries(LineSeries, { color: '#b18be8', lineWidth: 2, title: 'RSI 14', priceLineVisible: false })
    rsi.setData(toLine(valid, 'rsi14'))
    rsi.createPriceLine({ price: 70, color: 'rgba(239,98,108,.7)', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '70' })
    rsi.createPriceLine({ price: 30, color: 'rgba(32,184,137,.7)', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '30' })
    rsiChart.priceScale('right').applyOptions({ scaleMargins: { top: .1, bottom: .1 } })

    const macd = macdChart.addSeries(LineSeries, { color: '#58b7e8', lineWidth: 2, title: 'MACD', priceLineVisible: false })
    const signal = macdChart.addSeries(LineSeries, { color: '#e7b85c', lineWidth: 2, title: 'Signal', priceLineVisible: false })
    const histogram = macdChart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false, priceScaleId: 'macd-hist' })
    macd.setData(toLine(valid, 'macd'))
    signal.setData(toLine(valid, 'macd_signal'))
    histogram.setData(valid.filter(b => b.macd_histogram != null).map(b => ({ time: b.time as UTCTimestamp, value: b.macd_histogram as number, color: (b.macd_histogram as number) >= 0 ? 'rgba(32,184,137,.55)' : 'rgba(239,98,108,.55)' })))
    histogram.priceScale().applyOptions({ scaleMargins: { top: .2, bottom: .1 } })

    priceChart.timeScale().fitContent()
    rsiChart.timeScale().fitContent()
    macdChart.timeScale().fitContent()

    const charts = [priceChart, rsiChart, macdChart]
    const elements = [priceHost.current, rsiHost.current, macdHost.current]
    const observer = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const index = elements.indexOf(entry.target as HTMLDivElement)
        if (index >= 0) charts[index].applyOptions({ width: entry.contentRect.width })
      })
    })
    elements.forEach(el => el && observer.observe(el))

    return () => {
      observer.disconnect()
      charts.forEach(chart => chart.remove())
    }
  }, [bars, height, showSma, showEma, showBollinger])

  return <div className="technical-charts">
    <div ref={priceHost} className="price-chart" />
    <div className="indicator-title"><b>RSI · 14</b><span>Overbought guide 70 · Oversold guide 30</span></div>
    <div ref={rsiHost} className="indicator-chart" />
    <div className="indicator-title"><b>MACD · 12, 26, 9</b><span>MACD line · Signal line · Histogram</span></div>
    <div ref={macdHost} className="indicator-chart" />
  </div>
}
