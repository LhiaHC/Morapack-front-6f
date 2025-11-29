"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import RedExIcon from "@/public/icons/LogoRedEx";
import SidebarItem from "./SidebarItem";
import Link from "next/link";
import LogoPlane from "@/public/icons/LogoPlane";
import LogoSimu from "@/public/icons/LogoSimu";
import LogoRegEnv from "@/public/icons/LogoRegEnv";
import { FaBars, FaTimes } from "react-icons/fa";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const sidebarItems = [
    { name: "En vivo", route: "/vuelosEnVivo", Icon: LogoPlane },
    { name: "Simulación", route: "/simulacion", Icon: LogoSimu },
    { name: "Registro de envíos", route: "/registroEnvios", Icon: LogoRegEnv },
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

  return (
    <>
      {/* Toggle Button - Fixed position */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 bg-primary text-white p-3 rounded-lg shadow-lg hover:bg-primary-600 transition-colors duration-200"
        aria-label="Toggle menu"
      >
        {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Overlay - Only visible when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`h-screen w-64 bg-white shadow-2xl flex flex-col fixed left-0 top-0 z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Section */}
        <div className="bg-primary px-6 py-4 mt-16">
          <Link href="/" onClick={closeSidebar}>
            <div className="flex items-center justify-center">
              <RedExIcon className="w-32 h-auto" />
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
