"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", value: 4000 },
  { month: "Fev", value: 3000 },
  { month: "Mar", value: 5000 },
  { month: "Abr", value: 4500 },
  { month: "Mai", value: 6000 },
  { month: "Jun", value: 5500 },
];

export function ChartTest() {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
          <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
