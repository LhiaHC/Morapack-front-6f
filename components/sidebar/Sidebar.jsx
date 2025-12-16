"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import SidebarItem from "./SidebarItem";
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa";
import FlightTakeoffRoundedIcon from '@mui/icons-material/FlightTakeoffRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sidebarItems = [
    { name: "Operación día a día", route: "/vuelosEnVivo", Icon: FlightTakeoffRoundedIcon },
    //{ name: "Simulación", route: "/simulacion/cargar-pedidos", Icon: TuneRoundedIcon },
    { name: "Simulación", route: "/simulacion/cargar-pedidos", Icon: TuneRoundedIcon },
  ];

  const pathname = usePathname();

  const isActive = (route) => {
    return pathname.startsWith(route) && pathname !== "/";
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  if (!mounted) {
    return (
      <button
        className="fixed top-4 left-4 z-[9999] bg-primary text-white p-3 rounded-lg shadow-lg"
        aria-label="Toggle menu"
        disabled
      >
        <FaBars size={20} />
      </button>
    );
  }

  return (
    <>
      {/* Toggle Button - Fixed position */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-[9999] bg-primary text-white p-3 rounded-lg shadow-lg hover:bg-primary-600 transition-colors duration-200"
        aria-label="Toggle menu"
      >
        {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Overlay - Only visible when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998] transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`h-screen w-64 bg-white shadow-2xl flex flex-col fixed left-0 top-0 z-[9998] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Section */}
        <div className="bg-white px-6 py-4 mt-16 border-4 border-primary rounded-lg mx-4">
          <Link href="/" onClick={closeSidebar}>
            <div className="flex items-center justify-center">
              <Image
                src="/logos/logoMorapack.png"
                alt="Morapack Logo"
                width={128}
                height={64}
                style={{ width: 'auto', height: 'auto' }}
                className="w-32"
              />
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarItems.map((item) => (
              <div key={item.route} onClick={closeSidebar}>
                <SidebarItem
                  name={item.name}
                  route={item.route}
                  icon={item.Icon}
                  isActive={isActive(item.route)}
                />
              </div>
            ))}
          </ul>
        </nav>

        {/* Footer Section */}
        <div className="px-6 py-4 border-t border-neutral-custom-200">
          <p className="text-xs text-neutral-custom-500 text-center font-sans">DP1 - Morapack</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
