import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const COLORS = ["#0891b2", "#3b82f6", "#06b6d4", "#0ea5e9", "#6366f1", "#14b8a6", "#8b5cf6", "#f59e0b"];

export function CategoryDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución por categoría</CardTitle>
          <CardDescription>Productos agrupados por categoría</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-sm text-slate-400">
          No hay datos suficientes todavía
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución por categoría</CardTitle>
        <CardDescription>Cantidad de productos por categoría</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
              formatter={(value: number) => [`${value} producto(s)`, ""]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function LowStockBarChart({ data }: { data: { name: string; quantity: number; minimumStock: number }[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Productos con stock bajo</CardTitle>
          <CardDescription>Comparado con el mínimo configurado</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-sm text-slate-400">
          🎉 No hay productos con stock bajo
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos con stock bajo</CardTitle>
        <CardDescription>Stock actual vs. mínimo configurado</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="quantity" name="Stock actual" fill="#f59e0b" radius={[0, 6, 6, 0]} />
            <Bar dataKey="minimumStock" name="Mínimo" fill="#e2e8f0" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function MovementTimelineChart({ data }: { data: { date: string; in: number; out: number }[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos de stock (últimos 14 días)</CardTitle>
        <CardDescription>Unidades ingresadas vs. egresadas por día</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={formatted} margin={{ left: -16, right: 8 }}>
            <defs>
              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0891b2" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="in" name="Ingresos" stroke="#0891b2" fill="url(#colorIn)" strokeWidth={2} />
            <Area type="monotone" dataKey="out" name="Egresos" stroke="#f59e0b" fill="url(#colorOut)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
