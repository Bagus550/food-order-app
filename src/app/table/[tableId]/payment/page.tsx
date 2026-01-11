"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js"; // Import Supabase

// Inisialisasi Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PaymentPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const router = useRouter();
  const { tableId } = use(params);

  const [isMounted, setIsMounted] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("gopay");
  const [subtotal, setSubtotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const methods = [
    { id: "gopay", name: "Gopay", icon: "📱", adminFee: 1000 },
    { id: "qris", name: "QRIS", icon: "📸", adminFee: 0 },
    { id: "va", name: "Virtual Account", icon: "🏦", adminFee: 4000 },
    { id: "transfer", name: "Transfer Bank", icon: "💸", adminFee: 2500 },
  ];

  const currentMethod =
    methods.find((m) => m.id === selectedMethod) || methods[0];
  const biayaAdmin = currentMethod.adminFee;
  const total = subtotal + biayaAdmin;

  useEffect(() => {
    setIsMounted(true);
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      const cartData = JSON.parse(savedCart);
      const calculated = cartData.reduce(
        (acc: number, item: any) => acc + item.price * item.quantity,
        0
      );
      setSubtotal(calculated);
    }
  }, []);

  // --- LOGIC UTAMA PUSH KE DATABASE ---
  const handleOrder = async () => {
    if (subtotal === 0) return alert("Keranjang kosong bang!");

    setIsLoading(true);

    try {
      const savedCart = localStorage.getItem("cart");
      const customerName = localStorage.getItem("customerName") || "Sobat";
      const cartItems = savedCart ? JSON.parse(savedCart) : [];

      // 1. Insert ke tabel 'orders' dulu
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_name: customerName,
            table_number: tableId, // Sesuai URL
            total_price: total,
            payment_method: currentMethod.name,
            status: "pending", // Biar Admin tau ada pesanan baru
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Kalau insert order berhasil, gas insert ke 'order_items'
      if (orderData) {
        const orderItemsToInsert = cartItems.map((item: any) => ({
          order_id: orderData.id, // Ambil ID UUID dari hasil insert step 1
          menu_id: item.id,
          quantity: item.quantity,
          price_at_order: item.price,
          notes: item.note || "", // Catatan pedes dll masuk sini
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItemsToInsert);

        if (itemsError) throw itemsError;

        // 3. Simpan ringkasan buat SuccessPage
        const transaction = {
          orderId: orderData.id, // Pake ID asli dari database
          total: total,
          method: currentMethod.name,
          items: cartItems,
          time: new Date().toLocaleTimeString(),
        };

        localStorage.setItem("lastTransaction", JSON.stringify(transaction));

        // 4. Bersihin keranjang & lari ke Success Page
        localStorage.removeItem("cart");
        router.push(`/table/${tableId}/success`);
      }
    } catch (error: any) {
      console.error("Waduh, gagal simpan pesanan:", error.message);
      alert("Gagal kirim pesanan nih bang, coba lagi ya!");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-[100dvh] bg-white md:bg-gray-50 font-sans flex justify-center">
      <main className="w-full max-w-2xl h-[100dvh] md:h-[92vh] md:my-auto bg-white relative flex flex-col shadow-xl md:rounded-[3rem] overflow-hidden">
        {/* Header */}
        <div className="flex-none px-6 py-4 flex items-center border-b border-gray-50 bg-white z-20">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 text-orange-500 active:scale-90 transition-all text-[12px] font-semibold"
          >
            Back
          </button>
          <h1 className="flex-1 text-center text-lg font-black text-[#2D3142] pr-10">
            Pembayaran
          </h1>
        </div>

        {/* List Metode Pembayaran */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 ml-2">
            Pilih Metode
          </h2>
          <div className="space-y-3">
            {methods.map((method) => (
              <div
                key={method.id}
                onClick={() => {
                  if (!isLoading) {
                    setSelectedMethod(method.id);
                    if (navigator.vibrate) navigator.vibrate(30);
                  }
                }}
                className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer ${
                  selectedMethod === method.id
                    ? "border-orange-500 bg-orange-50/30 shadow-md"
                    : "border-gray-50 bg-white"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{method.icon}</span>
                  <div>
                    <p
                      className={`font-bold ${
                        selectedMethod === method.id
                          ? "text-orange-600"
                          : "text-gray-700"
                      }`}
                    >
                      {method.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                      Biaya: Rp {method.adminFee.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === method.id
                      ? "border-orange-500 bg-orange-500"
                      : "border-gray-200"
                  }`}
                >
                  {selectedMethod === method.id && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Billing Details */}
        <div className="flex-none p-8 bg-white rounded-t-[3.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.08)] border-t border-gray-50">
          <div className="space-y-3 mb-8 px-2">
            <div className="flex justify-between text-sm font-bold text-gray-400">
              <span>Pesanan</span>
              <span className="text-[#2D3142]">
                Rp {subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-400">
              <span>Biaya Layanan ({currentMethod.name})</span>
              <span className="text-[#2D3142]">
                Rp {biayaAdmin.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
              <span className="text-base font-black text-gray-400 uppercase">
                Total Bayar
              </span>
              <span className="text-2xl font-black text-orange-600 font-mono tracking-tighter">
                Rp {total.toLocaleString()}
              </span>
            </div>
          </div>

          <button
            onClick={handleOrder}
            disabled={isLoading || subtotal === 0}
            className={`w-full py-5 rounded-[2rem] font-black text-xl shadow-xl transition-all uppercase tracking-widest ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#FF6B35] text-white active:scale-95 shadow-orange-200"
            }`}
          >
            {isLoading ? "Memproses..." : "Bayar Sekarang"}
          </button>
        </div>
      </main>
    </div>
  );
}
