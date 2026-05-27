'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UsageRow {
  id: number
  channel: string
  step: string
  provider: string
  model: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  created_at: string
}

interface DaySummary {
  date: string
  cost: number
  calls: number
  input_tokens: number
  output_tokens: number
}

interface StepSummary {
  step: string
  model: string
  cost: number
  calls: number
}

export default function AdminPage() {
  const [rows, setRows] = useState<UsageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    const since = new Date(Date.now() - days * 86400_000).toISOString()
    supabase
      .from('llm_usage')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5000)
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else setRows((data as UsageRow[]) ?? [])
        setLoading(false)
      })
  }, [days])

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-500">Failed to load: {error}</div>
  if (rows.length === 0) return <div className="p-8 text-center text-muted-foreground">No usage data yet. Data will appear after the next pipeline run.</div>

  // Aggregate by day
  const byDay = new Map<string, DaySummary>()
  for (const r of rows) {
    const date = r.created_at.slice(0, 10)
    const prev = byDay.get(date) ?? { date, cost: 0, calls: 0, input_tokens: 0, output_tokens: 0 }
    prev.cost += Number(r.cost_usd)
    prev.calls += 1
    prev.input_tokens += r.input_tokens
    prev.output_tokens += r.output_tokens
    byDay.set(date, prev)
  }
  const dailyData = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date))
  const totalCost = rows.reduce((s, r) => s + Number(r.cost_usd), 0)
  const totalCalls = rows.length

  // Aggregate by step × model
  const byStep = new Map<string, StepSummary>()
  for (const r of rows) {
    const key = `${r.step}|${r.model}`
    const prev = byStep.get(key) ?? { step: r.step, model: r.model, cost: 0, calls: 0 }
    prev.cost += Number(r.cost_usd)
    prev.calls += 1
    byStep.set(key, prev)
  }
  const stepData = [...byStep.values()].sort((a, b) => b.cost - a.cost)

  const maxDayCost = Math.max(...dailyData.map(d => d.cost), 0.001)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pipeline Cost Dashboard</h1>
        <select
          value={days}
          onChange={(e) => { setDays(Number(e.target.value)); setLoading(true) }}
          className="border rounded px-2 py-1 text-sm bg-background"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card label="Total Cost" value={`$${totalCost.toFixed(4)}`} />
        <Card label="API Calls" value={totalCalls.toString()} />
        <Card label="Avg / Day" value={`$${(totalCost / Math.max(dailyData.length, 1)).toFixed(4)}`} />
      </div>

      {/* Daily cost chart (ASCII bar chart) */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Daily Cost</h2>
        <div className="space-y-1 font-mono text-sm">
          {dailyData.map(d => (
            <div key={d.date} className="flex items-center gap-2">
              <span className="w-20 text-muted-foreground shrink-0">{d.date.slice(5)}</span>
              <div className="flex-1 flex items-center gap-2">
                <div
                  className="h-5 bg-blue-500/80 rounded-sm"
                  style={{ width: `${(d.cost / maxDayCost) * 100}%`, minWidth: d.cost > 0 ? '2px' : 0 }}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  ${d.cost.toFixed(4)} · {d.calls} calls
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown by step × model */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Cost by Step × Model</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2">Step</th>
              <th>Model</th>
              <th className="text-right">Calls</th>
              <th className="text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {stepData.map(s => (
              <tr key={`${s.step}-${s.model}`} className="border-b border-border/50">
                <td className="py-1.5">{s.step}</td>
                <td className="text-muted-foreground">{s.model.replace('claude-', '').replace('-20251001', '')}</td>
                <td className="text-right">{s.calls}</td>
                <td className="text-right font-mono">${s.cost.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent calls */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Calls (last 20)</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2">Time</th>
              <th>Step</th>
              <th>Model</th>
              <th className="text-right">In</th>
              <th className="text-right">Out</th>
              <th className="text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 20).map(r => (
              <tr key={r.id} className="border-b border-border/50">
                <td className="py-1 text-muted-foreground">{new Date(r.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                <td>{r.step}</td>
                <td className="text-muted-foreground">{r.model.replace('claude-', '').replace('-20251001', '')}</td>
                <td className="text-right font-mono">{r.input_tokens.toLocaleString()}</td>
                <td className="text-right font-mono">{r.output_tokens.toLocaleString()}</td>
                <td className="text-right font-mono">${Number(r.cost_usd).toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}
