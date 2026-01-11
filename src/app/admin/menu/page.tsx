"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminMenu() {
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    category: "Makanan",
    image_url: "",
    is_available: true,
  });

  const fetchMenus = async () => {
    const { data, error } = await supabase
      .from("menus")
      .select("*")
      .order("id", { ascending: false });
    if (!error) setMenus(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // --- LOGIC UPLOAD GAMBAR KE STORAGE ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("menu-images")
        .getPublicUrl(filePath);
      setFormData({ ...formData, image_url: data.publicUrl });
    } catch (error) {
      alert("Gagal upload gambar!");
    } finally {
      setUploading(false);
    }
  };

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("menus").insert([formData]);
    if (!error) {
      setIsAdding(false);
      setFormData({
        name: "",
        price: 0,
        category: "Makanan",
        image_url: "",
        is_available: true,
      });
      fetchMenus();
    }
  };

  const deleteMenu = async (id: number, name: string) => {
    if (confirm(`Hapus "${name}"?`)) {
      await supabase.from("menus").delete().eq("id", id);
      fetchMenus();
    }
  };

  const toggleAvailability = async (id: number, currentStatus: boolean) => {
    try {
      // 1. Update di database
      const { error } = await supabase
        .from("menus")
        .update({ is_available: !currentStatus })
        .eq("id", id);

      if (error) {
        console.error("Gagal update status menu:", error.message);
        return;
      } // 2. REFRESH DATA (Paling penting biar efeknya langsung keliatan)

      await fetchMenus();

      console.log("Status menu berhasil diubah!");
    } catch (err) {
      console.error("Error sistem:", err);
    }
  };

  if (loading)
    return <div className="p-10 text-center font-black">LOADING...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-[#2D3142]">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black tracking-tighter">Kelola Menu</h1>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-orange-200"
          >
            {isAdding ? "BATAL" : "+ MENU BARU"}
          </button>
        </header>

        {isAdding && (
          <form
            onSubmit={handleAddMenu}
            className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 mb-10 animate-in fade-in slide-in-from-top-4 duration-500"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kolom Kiri: Nama & Harga */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                    Nama Menu
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Menu (Misal: Ayam Bakar Madu)"
                    className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white focus:ring-0 transition-all font-bold placeholder:text-gray-300"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                    Harga Jual
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400 text-sm">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white focus:ring-0 transition-all font-bold"
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Upload Gambar */}
              <div className="space-y-2">
                <div className="flex justify-between items-end ml-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">
                    Foto Produk
                  </label>
                  {/* Toggle Kecil buat milih Mode */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, image_url: "" })
                      } // Reset kalo pindah mode
                      className={`text-[8px] font-bold px-2 py-1 rounded-md transition-all ${
                        !formData.image_url?.startsWith("http") ||
                        formData.image_url === ""
                          ? "bg-white shadow-sm"
                          : "text-gray-400"
                      }`}
                    >
                      FILE
                    </button>
                    <button
                      type="button"
                      className={`text-[8px] font-bold px-2 py-1 rounded-md transition-all ${
                        formData.image_url?.startsWith("http")
                          ? "bg-white shadow-sm"
                          : "text-gray-400"
                      }`}
                    >
                      LINK
                    </button>
                  </div>
                </div>

                <div className="relative h-[calc(100%-1.5rem)] min-h-[180px] space-y-2">
                  {/* MODE 1: INPUT LINK (Kalo lagi pengen copas link) */}
                  <input
                    type="text"
                    placeholder="Paste link gambar di sini... (https://...)"
                    className="w-full p-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-orange-500 text-[10px] font-bold transition-all"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                  />

                  {/* MODE 2: DROPZONE / PREVIEW */}
                  <div className="relative h-32">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="upload-photo"
                    />
                    <label
                      htmlFor="upload-photo"
                      className={`flex flex-col items-center justify-center w-full h-full rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                        formData.image_url
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-gray-50 hover:bg-orange-50"
                      }`}
                    >
                      {formData.image_url ? (
                        <div className="relative w-full h-full group">
                          <img
                            src={formData.image_url}
                            alt="preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://placehold.co/600x400?text=Link+Gambar+Error";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-black text-[10px]">
                              GANTI / UPLOAD 📸
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-2xl mb-1">
                            {uploading ? "⏳" : "📸"}
                          </span>
                          <p className="text-[9px] font-black text-gray-400 uppercase text-center px-4">
                            {uploading
                              ? "LAGI UPLOAD..."
                              : "Upload File atau Paste Link di atas"}
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Baris Bawah: Kategori (Full Width) */}
              <div className="md:col-span-2 space-y-3 pt-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                  Pilih Kategori
                </label>
                <div className="flex flex-wrap gap-3">
                  {["Makanan", "Minuman Es", "Minuman Panas", "Tambahan"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, category: cat })
                      }
                      className={`flex-1 min-w-[100px] px-4 py-3 rounded-2xl font-black text-[11px] transition-all border-2 uppercase tracking-widest ${
                        formData.category === cat
                          ? "bg-[#2D3142] border-[#2D3142] text-white shadow-xl translate-y-[-2px]"
                          : "bg-white border-gray-100 text-gray-400 hover:border-orange-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              disabled={uploading}
              className={`w-full mt-10 py-5 rounded-[2rem] font-black tracking-[0.2em] text-sm transition-all shadow-xl active:scale-95 ${
                uploading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-100"
              }`}
            >
              {uploading ? "PROSES UPLOAD..." : "KONFIRMASI & SIMPAN"}
            </button>
          </form>
        )}

        {/* TABLE MENU */}
        <div className="bg-white rounded-[3.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                <th className="py-6 px-8">Menu</th>
                <th className="py-6 px-4 text-center">Harga</th>
                <th className="py-6 px-4 text-center">Status</th>
                <th className="py-6 px-8 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {menus.map((item) => (
                <tr key={item.id}>
                  <td className="py-6 px-8 flex items-center gap-4">
                    {/* TAMPILIN GAMBAR DI SINI */}
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🍽️
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-black text-lg">{item.name}</p>
                      <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-md font-bold text-gray-400 uppercase">
                        {item.category}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-4 text-center font-bold text-orange-600">
                    Rp {item.price.toLocaleString()}
                  </td>
                  <td className="py-6 px-4 text-center">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                        item.is_available
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-500"
                      }`}
                    >
                      {item.is_available ? "Ready" : "Habis"}
                    </span>
                  </td>
                  <td className="py-6 px-8 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          toggleAvailability(item.id, item.is_available)
                        }
                        className={`text-[10px] font-black px-4 py-2 rounded-xl border-2 transition-all active:scale-90 ${
                          item.is_available
                            ? "border-red-100 text-red-500 hover:bg-red-50"
                            : "border-green-100 text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {item.is_available ? "SET HABIS" : "SET READY"}
                      </button>
                      <button
                        onClick={() => deleteMenu(item.id, item.name)}
                        className="bg-gray-100 p-2 px-3 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
