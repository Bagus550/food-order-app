"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  // Baris sakti buat nangkep tableId di Next.js terbaru:
  const resolvedParams = use(params);
  const tableId = resolvedParams.tableId;

  const [name, setName] = useState("");
  const router = useRouter();

  // 1. Tambahin state buat trigger animasi error
  const [isError, setIsError] = useState(false);

  const handleStartOrder = () => {
    if (!name.trim()) {
      // Kalau nama kosong, trigger animasi shake
      setIsError(true);

      // Reset state error setelah animasi selesai (500ms)
      setTimeout(() => setIsError(false), 500);
      return;
    }

    // Kalau oke, lanjut simpan dan pindah halaman
    localStorage.setItem("customerName", name);
    router.push(`/table/${tableId}/menu`);
  };

  return (
    /* Pake 100dvh biar di HP jangkung gak ada bar browser yang nutupin button */
    <main className="min-h-[100dvh] w-full flex flex-col items-center justify-between bg-cover bg-center bg-no-repeat relative overflow-hidden bg-[linear-gradient(to_bottom,rgba(0,0,0,0.4),rgba(0,0,0,0.7)),url('https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=781&auto=format&fit=crop')]">
      {/* Overlay Gradient tambahan biar teks lebih kebaca di segala jenis gambar */}
      <div className="absolute inset-0 bg-black/20 z-0" />

      {/* Konten Atas */}
      <div className="relative z-10 w-full px-6 pt-20 text-center flex-1 flex flex-col justify-center">
        <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Halo, <br /> Selamat Datang!
          </h1>
          <p className="text-gray-100 text-base md:text-lg font-medium opacity-90">
            Kamu sekarang lagi di meja{" "}
            <span className="bg-[#FF6B35] px-3 py-1 rounded-lg font-black text-white shadow-lg">
              {tableId}
            </span>
          </p>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6 pb-12">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/20">
          <label
            className={`block text-sm font-bold mb-3 ml-1 transition-colors duration-300 ${
              isError ? "text-red-400" : "text-white opacity-80"
            }`}
          >
            {isError
              ? "Eh, isi nama dulu dong kak! 🙏"
              : "Bisa kami panggil siapa kak?"}
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (isError) setIsError(false);
            }}
            placeholder="Ketik namamu di sini..."
            className={`w-full block px-6 py-4 rounded-2xl border-2 bg-white outline-none transition-all text-[#2D3142] text-lg font-semibold ${
              isError
                ? "border-red-500 ring-4 ring-red-500/20"
                : "border-transparent focus:ring-4 focus:ring-[#FF6B35]/50"
            }`}
          />

          <button
            onClick={handleStartOrder}
            /* Cek class animate-shake di sini */
            className={`w-full mt-5 text-white font-black py-4 rounded-2xl text-lg shadow-xl transition-all flex items-center justify-center gap-2 
        ${
          isError
            ? "bg-red-500 animate-shake"
            : "bg-[#FF6B35] hover:bg-[#e85a2a] active:scale-[0.97] shadow-orange-900/20"
        }
      `}
          >
            {isError ? "Nama Belum Diisi!" : "Lihat Menu"}
            {!isError && <span className="text-xl">→</span>}
          </button>
        </div>
      </div>
    </main>
  );
}
