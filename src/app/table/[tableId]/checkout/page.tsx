"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react"; // Tambah use

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params); // Unwrapping params biar gak error
  const tableId = resolvedParams.tableId;

  const [cart, setCart] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // 1. Mencegah Hydration Error
  useEffect(() => {
    setIsMounted(true);
    const savedCart = localStorage.getItem("cart");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // 2. Logic Update Quantity yang Beneran Kerja
  const updateQuantity = (id: any, delta: number) => {
    const updatedCart = cart
      .map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
      .filter((item) => item.quantity > 0); // Kalau 0, hapus dari keranjang

    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const biayaLain = 0;
  const total = subtotal + biayaLain;

  // Render kosong dulu di server biar gak mismatch
  if (!isMounted) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-[100dvh] bg-white md:bg-gray-50 font-sans flex justify-center">
      <main className="relative w-full flex flex-col bg-white h-[100dvh] md:max-w-2xl md:h-[92vh] md:my-auto md:rounded-[3rem] md:shadow-2xl md:border md:border-gray-100 overflow-hidden">
        {/* HEADER */}
        <div className="flex-none px-6 py-4 flex items-center justify-between border-b border-gray-50 bg-white/80 backdrop-blur-md z-20">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center text-orange-500 active:scale-90 transition-all text-[12px] font-semibold"
          >
            Back
          </button>
          <h1 className="text-lg font-black text-[#2D3142] tracking-tight">
            Check Out
          </h1>
          <div className="w-10" />
        </div>

        {/* LIST ITEM */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar bg-white">
          {cart.length > 0 ? (
            cart.map((item, idx) => (
              <div
                key={item.id || idx}
                className="group flex items-center gap-4 p-2 pr-4 rounded-xl border border-gray-50 bg-white shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex-none shadow-inner">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#2D3142] text-[12px] truncate">
                    {item.name}
                  </h3>
                  <p className="text-orange-500 font-black text-sm pt-1">
                    Rp {item.price.toLocaleString()}
                  </p>

                  {/* Stepper */}
                  <div className="flex items-center mt-3 bg-gray-100 w-fit rounded-xl p-1 gap-4 border border-gray-200/50">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold text-gray-400 active:bg-red-500 active:text-white transition-colors"
                    >
                      -
                    </button>
                    <span className="font-black text-xs text-[#2D3142]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold text-orange-500 active:bg-orange-500 active:text-white transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-[50dvh] flex flex-col items-center justify-center text-center px-10">
              <div className="text-6xl mb-4 opacity-20">🛒</div>
              <p className="text-gray-400 font-bold text-sm">
                Keranjang kamu kosong, yuk jajan!
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex-none p-6 pb-10 md:pb-8 bg-white rounded-t-[3.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.08)] border-t border-gray-50 z-20">
          <div className="space-y-4 mb-8 px-4">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-[#2D3142] text-sm font-black">
                Rp {subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-end pt-4 border-t border-dashed border-gray-200">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  Total Pembayaran
                </p>
                <p className="text-2xl font-black text-orange-600 leading-none mt-1">
                  Rp {total.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => router.push(`/table/${tableId}/payment`)}
            className="group relative w-full bg-[#2D3142] text-white py-5 rounded-4xl font-black text-lg shadow-2xl active:scale-[0.96] transition-all overflow-hidden disabled:opacity-50 disabled:grayscale"
          >
            <div className="absolute inset-0 bg-orange-500 translate-y-full group-active:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10 flex items-center justify-center gap-3">
              BAYAR SEKARANG
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}
