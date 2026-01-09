// app/page.tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-2xl font-bold text-orange-500">
        Silahkan Scan QR Code di Meja Anda ya Kak! 🍜
      </h1>
      <p className="text-gray-500 mt-2">Atau akses localhost:3000/table/01</p>
    </main>
  );
}