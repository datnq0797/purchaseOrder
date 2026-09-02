import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TopProductRow } from '@/types'

export function TopProductsBarChart({ data }: { data: TopProductRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="product_name" tick={{ fontSize: 11 }} stroke="#94a3b8" hide />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" width={36} />
        <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.product_name ?? ''} />
        <Bar dataKey="total_quantity" name="Số lượng bán" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
