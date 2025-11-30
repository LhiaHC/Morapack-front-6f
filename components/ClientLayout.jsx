"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar/Sidebar";

export default function ClientLayout({ children }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <>
            <Sidebar />
            <main className="w-full h-screen overflow-auto">
                {children}
            </main>
        </>
    );
}
