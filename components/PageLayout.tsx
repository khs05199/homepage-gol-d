import Sidebar from "./Sidebar";

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 min-h-screen">
        {children}
      </div>
    </div>
  );
}
