
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-500 p-4 text-white shadow-md">
        <h1 className="text-xl font-bold text-center">QR Verify</h1>
      </header>
      <main className="max-w-md mx-auto p-4">{children}</main>
      <footer className="p-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} QR Verify App
      </footer>
    </div>
  );
};

export default Layout;
