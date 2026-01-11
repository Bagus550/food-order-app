"use client";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
// --- TAMBAHAN IMPORT UNTUK GRAFIK ---
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    pending: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]); // Buat nyimpen data CSV & Grafik
  const [loading, setLoading] = useState(true);

  // --- LOGIC EKSPOR CSV ---
  const exportToCSV = () => {
    if (allOrders.length === 0)
      return alert("Belum ada data buat diekspor, Bang!");

    const headers = [
      "ID",
      "Waktu",
      "Meja",
      "Pelanggan",
      "Total Harga",
      "Status",
    ];
    const rows = allOrders.map((o) => [
      o.id,
      new Date(o.created_at).toLocaleString("id-ID"),
      o.table_number,
      o.customer_name,
      o.total_price,
      o.status,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Laporan_Resto_${new Date().toLocaleDateString()}.csv`
    );
    link.click();
  };

  // --- LOGIC DATA GRAFIK (Per Jam) ---
  const chartData = useMemo(() => {
    const hourlyData: { [key: string]: number } = {};
    // Inisialisasi jam biar grafik mulai dari jam 08:00 sampe jam sekarang (opsional)
    allOrders.forEach((order) => {
      const hour = new Date(order.created_at).getHours() + ":00";
      hourlyData[hour] = (hourlyData[hour] || 0) + Number(order.total_price);
    });

    return Object.keys(hourlyData)
      .sort((a, b) => parseInt(a) - parseInt(b)) // Urutkan jamnya
      .map((key) => ({
        time: key,
        revenue: hourlyData[key],
      }));
  }, [allOrders]);

  const fetchDashboardData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false });

    if (!error && orders) {
      setAllOrders(orders); // Simpan semua data
      const totalRevenue = orders.reduce(
        (acc, curr) => acc + Number(curr.total_price),
        0
      );
      const pendingOrders = orders.filter((o) => o.status === "pending").length;

      setStats({
        totalOrders: orders.length,
        revenue: totalRevenue,
        pending: pendingOrders,
      });
      setRecentOrders(orders.slice(0, 5));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel("admin_dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading)
    return (
      <div className="p-10 text-center font-black animate-pulse">
        MEMUAT DATA...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-[#2D3142]">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">
              Admin Central
            </h1>
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-1">
              Sistem Kendali Resto v1.0
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* TOMBOL CSV BARU */}
            <button
              onClick={exportToCSV}
              className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center gap-2"
            >
              Ekspor Laporan
            </button>
            <Link
              href="/admin/orders"
              className="bg-[#2D3142] text-white px-6 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all"
            >
              LIHAT SEMUA PESANAN
            </Link>
            <Link
              href="/admin/menu"
              className="bg-white border-2 border-gray-100 text-[#2D3142] px-6 py-3 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all"
            >
              KELOLA MENU
            </Link>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
            <p className="text-gray-400 font-black text-[10px] uppercase mb-2">
              Total Pesanan Hari Ini
            </p>
            <h2 className="text-4xl font-black text-[#2D3142]">
              {stats.totalOrders}
            </h2>
          </div>
          <div className="bg-orange-500 p-8 rounded-[3rem] shadow-xl shadow-orange-100 text-white">
            <p className="text-orange-100 font-black text-[10px] uppercase mb-2">
              Estimasi Pendapatan
            </p>
            <h2 className="text-3xl font-black">
              Rp {stats.revenue.toLocaleString()}
            </h2>
          </div>
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
            <p className="text-gray-400 font-black text-[10px] uppercase mb-2">
              Butuh Dimasak segera
            </p>
            <h2 className="text-4xl font-black text-red-500">
              {stats.pending}{" "}
              <span className="text-sm text-gray-300">Order</span>
            </h2>
          </div>
        </div>

        {/* SECTION GRAFIK PENJUALAN BARU */}
        <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-gray-100 mb-10 overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black">Tren Omzet Hari Ini</h3>
            <span className="text-[10px] font-black bg-orange-50 text-orange-500 px-3 py-1 rounded-full uppercase">
              Real-time
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: "bold", fill: "#9ca3af" }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: "20px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  }}
                  itemStyle={{ color: "#f97316", fontWeight: "bold" }}
                  formatter={(value) => [
                    `Rp ${(value || 0).toLocaleString()}`,
                    "Omzet",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT ACTIVITY TABLE */}
        <div className="bg-white rounded-[3.5rem] p-8 shadow-sm border border-gray-100 overflow-hidden">
          <h3 className="text-xl font-black text-[#2D3142] mb-6">
            Aktivitas Terkini
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                  <th className="pb-4 px-2">Meja</th>
                  <th className="pb-4 px-2">Pelanggan</th>
                  <th className="pb-4 px-2">Total</th>
                  <th className="pb-4 px-2">Status</th>
                  <th className="pb-4 px-2 text-right">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="text-sm hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 px-2 font-black text-orange-600">
                      #{order.table_number}
                    </td>
                    <td className="py-4 px-2 font-bold text-[#2D3142]">
                      {order.customer_name}
                    </td>
                    <td className="py-4 px-2 font-black">
                      Rp {order.total_price.toLocaleString()}
                    </td>
                    <td className="py-4 px-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          order.status === "pending"
                            ? "bg-red-50 text-red-500"
                            : "bg-green-50 text-green-500"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right text-gray-400 font-medium">
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recentOrders.length === 0 && (
            <div className="py-10 text-center text-gray-300 font-bold italic">
              Belum ada pesanan masuk hari ini...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
