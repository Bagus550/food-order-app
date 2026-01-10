"use client";

import { use, useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- KOMPONEN SKELETON (Hanya untuk tampilan loading) ---
const SkeletonCard = () => (
  <div className="bg-white border border-gray-100 p-3 rounded-3xl animate-pulse flex md:flex-col gap-4">
    <div className="w-24 h-24 min-w-[6rem] md:w-full md:aspect-square bg-gray-200 rounded-[1.2rem]"></div>
    <div className="flex-1 py-1 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
      <div className="flex justify-between items-center mt-4">
        <div className="h-5 bg-gray-200 rounded w-20"></div>
        <div className="h-9 w-9 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  </div>
);

export default function MenuPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = use(params);
  const router = useRouter();

  const [menus, setMenus] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // <--- State baru

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const dynamicCategories = useMemo(() => {
    const cats = menus.map((m) => m.category).filter(Boolean);
    return ["All", ...Array.from(new Set(cats))];
  }, [menus]);

  useEffect(() => {
    setIsMounted(true);
    const savedName = localStorage.getItem("customerName");
    if (savedName) setCustomerName(savedName);

    const fetchMenus = async () => {
      setIsLoading(true); // <--- Start loading
      const { data, error } = await supabase.from("menus").select("*");
      if (error) console.error("Error Supabase:", error.message);
      if (data) setMenus(data);
      setIsLoading(false); // <--- End loading
    };
    fetchMenus();
  }, []);

  const filteredMenus = useMemo(() => {
    return menus.filter((item) => {
      const matchSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [menus, searchQuery, selectedCategory]);

  const addToCart = (item: any) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setCart((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setCart((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === itemId);
      if (existingItem?.quantity > 1) {
        return prev.map((cartItem) =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prev.filter((cartItem) => cartItem.id !== itemId);
    });
  };

  const handleGoToCheckout = () => {
    localStorage.setItem("cart", JSON.stringify(cart));
    router.push(`/table/${tableId}/checkout`);
  };

  const totalPrice = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (!isMounted) return null;

  return (
    <div className="min-h-[100dvh] bg-white md:bg-gray-50 font-sans flex justify-center">
      <main className="relative w-full flex flex-col bg-white h-[100dvh] md:max-w-2xl md:h-[92vh] md:my-auto md:rounded-4xl md:shadow-2xl md:border md:border-gray-100 overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="p-5 pb-36">
            <header className="mb-8 mt-2">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-[#2D3142] leading-tight">
                    Halo,{" "}
                    <span className="text-orange-500">
                      {customerName || "Sobat"}!
                    </span>
                  </h1>
                  <p className="text-gray-400 text-sm font-semibold mt-1">
                    Lagi pengen makan apa?
                  </p>
                </div>
                <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100 font-black text-orange-600 text-xs tracking-widest uppercase">
                  Meja {tableId}
                </div>
              </div>

              <div className="flex gap-3 mt-6 bg-gray-50 p-3 rounded-3xl items-center border border-gray-100 focus-within:ring-2 focus-within:ring-orange-200 transition-all shadow-inner">
                <span className="pl-2">🔍</span>
                <input
                  className="bg-transparent flex-1 outline-none text-sm font-medium text-gray-700 placeholder:text-gray-400"
                  placeholder="Cari makanan kesukaan"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </header>

            <section className="flex gap-3 overflow-x-auto pb-6 no-scrollbar -mx-5 px-5">
              {/* SKELETON KATEGORI */}
              {isLoading
                ? [1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="px-10 py-5 bg-gray-100 rounded-2xl animate-pulse min-w-[120px]"
                    ></div>
                  ))
                : dynamicCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-8 py-3 rounded-2xl border transition-all text-sm font-bold whitespace-nowrap active:scale-95 ${
                        selectedCategory === cat
                          ? "bg-[#2D3142] text-white border-[#2D3142] shadow-lg shadow-gray-200"
                          : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {isLoading ? (
                /* 4. TAMPILIN SKELETON PAS LOADING */
                [1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)
              ) : filteredMenus.length > 0 ? (
                filteredMenus.map((item) => {
                  const cartItem = cart.find((c) => c.id === item.id);

                  return (
                    <div
                      key={item.id}
                      className="group bg-white border border-gray-100 p-3 rounded-3xl shadow-sm active:scale-[0.98] transition-all duration-200 flex md:flex-col gap-4"
                    >
                      <div className="relative w-24 h-24 min-w-[6rem] md:w-full md:h-auto md:aspect-square bg-gray-100 rounded-[1.2rem] overflow-hidden">
                        <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-black text-orange-600 uppercase tracking-tighter shadow-sm z-10 border border-orange-100">
                          {item.category}
                        </div>
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>

                      <div className="flex flex-col justify-between flex-1 py-1">
                        <div>
                          <h3 className="font-extrabold text-[#2D3142] text-sm md:text-base leading-snug line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="text-[12px] text-gray-400 mt-1 tracking-tight italic">
                            #{item.category}
                          </p>
                        </div>

                        <div className="flex justify-between items-end md:items-center mt-2">
                          <span className="font-black text-orange-600 text-sm md:text-lg">
                            Rp {item.price.toLocaleString()}
                          </span>

                          <div className="flex items-center gap-2">
                            {cartItem && (
                              <>
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="bg-gray-100 text-gray-600 w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shadow-sm active:bg-red-100 transition-colors"
                                >
                                  <span className="text-lg font-bold">-</span>
                                </button>
                                <span className="text-sm font-black text-[#2D3142] min-w-[20px] text-center">
                                  {cartItem.quantity}
                                </span>
                              </>
                            )}

                            <button
                              onClick={() => addToCart(item)}
                              className="bg-[#2D3142] text-white w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shadow-lg active:bg-orange-500 transition-colors"
                            >
                              <span className="text-lg font-bold">+</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                  <span className="text-4xl opacity-50">🍽️</span>
                  <p className="text-gray-400 font-bold mt-4 italic text-sm px-6">
                    Oops! Menu "{searchQuery}" di kategori {selectedCategory}{" "}
                    lagi kosong nih.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>

        {cart.length > 0 && (
          <div className="fixed md:absolute bottom-0 left-0 right-0 p-6 pb-10 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none z-50">
            <button
              onClick={handleGoToCheckout}
              className="pointer-events-auto w-full max-w-md mx-auto bg-[#2D3142] text-white p-5 rounded-[2.5rem] flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.25)] active:scale-[0.98] transition-all border border-white/10"
            >
              <div className="flex items-center gap-4">
                <div className="bg-orange-500 min-w-[30px] h-[30px] rounded-xl flex items-center justify-center font-black text-white shadow-inner animate-bounce">
                  {totalItems}
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase opacity-50 font-black tracking-tighter">
                    Totalan
                  </p>
                  <p className="font-bold text-base text-orange-400">
                    Rp {totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="bg-orange-500 px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-tight shadow-lg flex items-center gap-2">
                Check Out
              </div>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
