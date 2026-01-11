"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

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
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    // 1. Ambil data pesanan hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false });

    if (!error && orders) {
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
      setRecentOrders(orders.slice(0, 5)); // Ambil 5 terbaru aja buat ringkasan
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();

    // Realtime update biar dashboard auto-refresh kalo ada pesanan baru
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
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-[#2D3142] tracking-tighter">
              Admin Central
            </h1>
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-1">
              Sistem Kendali Resto v1.0
            </p>
          </div>
          <div className="flex gap-3">
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
                  <tr key={order.id} className="text-sm">
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
