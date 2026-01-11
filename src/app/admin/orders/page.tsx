"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FUNGSI BUNYI BEL ---
  const playNotifSound = () => {
    const audio = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
    );
    audio
      .play()
      .catch((err) =>
        console.log("Browser blokir auto-play, perlu interaksi user dulu:", err)
      );
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items(
          *,
          menus(name)
        )
      `
      )
      .order("created_at", { ascending: false });

    if (!error) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("realtime_orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" }, // Fokus pas ada pesanan BARU aja
        (payload) => {
          console.log("Pesanan Masuk!", payload);
          fetchOrders();
          playNotifSound(); // <--- GAS BUNYIIN BELNYA
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        } // Kalo cuma update status gak usah bunyi gapapa
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId); // Mulai loading buat ID ini
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (!error) {
        await fetchOrders();
      } else {
        alert("Gagal update status!");
      }
    } finally {
      setUpdatingId(null); // Beres loading
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center font-bold">
        Lagi narik data pesanan...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-[#2D3142]">
              Pesanan Masuk
            </h1>
            <p className="text-gray-400 font-medium">
              Pantau dapur secara real-time 🔥
            </p>
          </div>
          <div className="bg-orange-100 text-orange-600 px-4 py-2 rounded-2xl font-black text-sm">
            {orders.length} Pesanan Total
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden"
            >
              {/* Status Badge */}
              <div
                className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest ${
                  order.status === "pending"
                    ? "bg-red-100 text-red-500"
                    : order.status === "cooking"
                    ? "bg-orange-100 text-orange-500"
                    : "bg-green-100 text-green-500"
                }`}
              >
                {order.status}
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-black text-[#2D3142]">
                  Meja {order.table_number}
                </h3>
                <p className="text-sm text-gray-400 font-bold uppercase">
                  {order.customer_name}
                </p>
              </div>

              {/* List Items */}
              <div className="flex-1 space-y-3 mb-6">
                {order.order_items?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start border-b border-gray-50 pb-2"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-700 text-sm">
                        {/* Ambil nama dari object menus hasil join tadi */}
                        {item.quantity}x{" "}
                        {item.menus?.name || "Menu tidak dikenal"}
                      </span>
                      {item.notes && (
                        <span className="text-[10px] text-orange-500 italic">
                          “{item.notes}”
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-dashed border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase">
                    Total Bayar
                  </span>
                  <span className="font-black text-lg text-[#2D3142]">
                    Rp {order.total_price?.toLocaleString()}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {order.status === "pending" && (
                    <button
                      onClick={() => updateStatus(order.id, "cooking")}
                      className="bg-orange-500 text-white py-3 rounded-2xl font-black text-xs hover:bg-orange-600 transition-all"
                    >
                      MASAK
                    </button>
                  )}
                  {order.status === "cooking" && (
                    <button
                      onClick={() => updateStatus(order.id, "served")}
                      className="bg-green-500 text-white py-3 rounded-2xl font-black text-xs hover:bg-green-600 transition-all"
                    >
                      ANTAR
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(order.id, "completed")} // <--- Pastiin ini manggil updateStatus
                    className="col-span-2 border-2 border-gray-100 text-gray-400 py-3 rounded-2xl font-black text-xs hover:bg-gray-50 transition-all mt-1"
                  >
                    SELESAI & ARSIP
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
