"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui";

const COLORS = ["#635BFF", "#00C2A8", "#4F46E5", "#22C55E", "#F59E0B", "#EF4444", "#94A3B8", "#0EA5E9"];

export function RevenueChart({ data }: { data: { label: string; value: number; secondary?: number }[] }) {
  return (
    <Card elevated className="h-[340px]">
      <p className="label-caps mb-4">Revenue & Profit</p>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#635BFF" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#635BFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Area type="monotone" dataKey="value" name="Sales (R)" stroke="#635BFF" fill="url(#rev)" strokeWidth={2} />
          <Line type="monotone" dataKey="secondary" name="Profit (R)" stroke="#00C2A8" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function SalesBarChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <Card elevated className="h-[340px]">
      <p className="label-caps mb-4">Sales Trend</p>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" name="Sales (R)" fill="#635BFF" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function CategoryPieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Card elevated className="h-[340px]">
      <p className="label-caps mb-4">Top Categories</p>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function InventoryTrendChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <Card elevated className="h-[340px]">
      <p className="label-caps mb-4">Inventory Trend</p>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" name="Value (R)" stroke="#00C2A8" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
