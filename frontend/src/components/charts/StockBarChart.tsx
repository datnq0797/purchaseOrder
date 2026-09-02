import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { StockOverviewRow } from '@/types'

export function StockBarChart({ data }: { data: StockOverviewRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fontSize: 11 }}
          stroke="#94a3b8"
          interval={0}
        />
        <Tooltip />
        <Bar dataKey="stock_quantity" name="Tồn kho" radius={[0, 4, 4, 0]}>
          {data.map((row) => (
            <Cell key={row.id} fill={row.stock_quantity <= row.min_stock ? '#f43f5e' : '#4f46e5'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
