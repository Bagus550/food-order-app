export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      {/* Lo bisa pasang Sidebar Admin di sini nanti */}
      <nav className="bg-[#2D3142] p-4 text-white font-bold">
        Admin Dashboard Menu
      </nav>

      {children}
    </section>
  );
}
