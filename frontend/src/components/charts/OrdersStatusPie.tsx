import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { STATUS_LABELS } from '@/components/common/StatusBadge'
import type { OrdersByStatusRow } from '@/types'

const COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  completed: '#10b981',
  cancelled: '#f43f5e',
}

export function OrdersStatusPie({ data }: { data: OrdersByStatusRow[] }) {
  const chartData = data.map((row) => ({
    name: STATUS_LABELS[row.status],
    value: row.count,
    color: COLORS[row.status],
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
