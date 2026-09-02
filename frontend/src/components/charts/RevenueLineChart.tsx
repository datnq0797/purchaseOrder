import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency, formatDateShort } from '@/lib/format'
import type { RevenuePoint } from '@/types'

export function RevenueLineChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis
          tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          tick={{ fontSize: 12 }}
          stroke="#94a3b8"
          width={48}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          labelFormatter={(label) => `Ngày ${formatDateShort(label as string)}`}
        />
        <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={false} name="Doanh số" />
      </LineChart>
    </ResponsiveContainer>
  )
}
