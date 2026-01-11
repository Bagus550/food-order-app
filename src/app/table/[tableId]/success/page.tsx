"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

// ... (bagian import tetep sama)

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
    if (saved) {
      setData(JSON.parse(saved));
    } else {
      // Kalau gak ada data transaksi (misal user iseng akses URL success langsung)
      // Balikin aja ke halaman awal meja
      router.replace(`/table/${tableId}`);
    }
  }, [tableId, router]);

  // Handler buat tombol Selesai biar bersih
  const handleFinish = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    localStorage.removeItem("lastTransaction"); // Bersihin biar fresh
    router.push(`/table/${tableId}`);
  };

  if (!data) return null;

  return (
    <div className="min-h-screen bg-orange-500 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[3rem] p-8 text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-500">
        {/* ... (Header & Icon ✅ tetep sama) ... */}

        {/* AREA STRUK */}
        <div className="bg-gray-50 rounded-4xl p-6 border-2 border-dashed border-gray-200 relative">
          <div className="space-y-4 text-left">
            <div className="flex justify-between border-b border-gray-200 pb-3">
              <div className="flex flex-col">
                <span className="text-gray-400 font-bold text-[10px] uppercase">
                  Order ID
                </span>
                {/* Kita tampilin 8 karakter awal aja biar gak kepanjangan karena UUID */}
                <span className="text-gray-800 font-black text-xs uppercase">
                  #{data.orderId?.slice(0, 8)}...
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

            {/* RINCIAN MENU */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 no-scrollbar py-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Detail Item:
              </span>
              {data.items?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-start text-sm border-b border-gray-100 border-dotted pb-2 last:border-0"
                >
                  <div className="flex flex-col flex-1 pr-4">
                    <span className="font-bold text-gray-700 leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium italic">
                      {item.quantity}x @ Rp {item.price.toLocaleString()}
                    </span>
                    {/* Catatan Per Item */}
                    {item.note && (
                      <span className="text-[10px] text-orange-500 font-bold mt-1 bg-orange-50 px-2 py-0.5 rounded-md w-fit">
                        “{item.note}”
                      </span>
                    )}
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

          {/* Efek Gerigi Struk Bawah (Tetap Sama) */}
        </div>

        {/* Buttons */}
        <button
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(50);
            router.push(`/table/${tableId}/menu`);
          }}
          className="w-full mt-10 bg-[#2D3142] text-white py-5 rounded-[2rem] font-black hover:bg-black active:scale-95 transition-all shadow-xl"
        >
          PESAN LAGI
        </button>
        <button
          onClick={handleFinish}
          className="w-full mt-2 bg-white py-5 rounded-[2rem] font-black border-2 border-gray-100 text-gray-400 active:scale-95 transition-all"
        >
          SELESAI
        </button>
      </div>
    </div>
  );
}
