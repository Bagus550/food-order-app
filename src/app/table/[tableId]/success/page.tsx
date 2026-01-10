"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const router = useRouter();
  const { tableId } = use(params);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("lastTransaction");
    if (saved) setData(JSON.parse(saved));

    // Opsional: Bersihin keranjang setelah sukses biar gak double order
    // localStorage.removeItem("cart");
  }, []);

  if (!data) return null;

  return (
    <div className="min-h-screen bg-orange-500 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[3rem] p-8 text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-500">
        {/* Dekorasi Bulatan Struk */}
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-orange-400 rounded-full opacity-10" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-400 rounded-full opacity-10" />

        <div className="mb-6 inline-flex w-20 h-20 bg-green-100 text-green-500 items-center justify-center rounded-full text-4xl shadow-inner">
          ✅
        </div>

        <h1 className="text-2xl font-black text-gray-800 mb-2 tracking-tight">
          PESANAN DITERIMA!
        </h1>
        <p className="text-gray-500 font-medium mb-8">
          Resto lagi siapin makanan buat{" "}
          <span className="text-orange-600 font-bold">Meja {tableId}</span> nih.
        </p>

        {/* AREA STRUK */}
        <div className="bg-gray-50 rounded-4xl p-6 border-2 border-dashed border-gray-200 relative">
          <div className="space-y-4 text-left">
            {/* Header Struk */}
            <div className="flex justify-between border-b border-gray-200 pb-3">
              <div className="flex flex-col">
                <span className="text-gray-400 font-bold text-[10px] uppercase">
                  Order ID
                </span>
                <span className="text-gray-800 font-black text-sm uppercase">
                  #{data.orderId?.slice(0, 8)}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-gray-400 font-bold text-[10px] uppercase">
                  Metode
                </span>
                <span className="text-gray-800 font-black text-sm uppercase italic">
                  {data.method}
                </span>
              </div>
            </div>

            {/* RINCIAN MENU: Dikasih max-height biar aman kalau menunya banyak */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 no-scrollbar py-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Detail Item:
              </span>
              {data.items?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-start text-sm"
                >
                  <div className="flex flex-col flex-1 pr-4">
                    <span className="font-bold text-gray-700 leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium italic">
                      {item.quantity}x @ Rp {item.price.toLocaleString()}
                    </span>
                  </div>
                  <span className="font-black text-gray-800">
                    Rp {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Section */}
            <div className="pt-4 border-t-2 border-gray-200 border-dotted mt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-black text-xs uppercase tracking-tighter">
                  Total Bayar
                </span>
                <span className="text-xl font-black text-orange-600">
                  Rp {data.total?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Efek Gerigi Struk Bawah */}
          <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-1">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-white rotate-45 border-t-2 border-l-2 border-gray-200"
              />
            ))}
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(50);
            router.push(`/table/${tableId}`);
          }}
          className="w-full mt-10 bg-[#2D3142] text-white py-5 rounded-[2rem] font-black hover:bg-black active:scale-95 transition-all shadow-xl shadow-gray-200"
        >
          SELESAI
        </button>
      </div>
    </div>
  );
}
