import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";

import "./globals.css";
import Sidebar from "@/components/sidebar/Sidebar";
const inter = Inter({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "DP1 Morapack",
    description: "Sistema de gestión y monitoreo de envíos",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <title>Morapack</title>
            </head>

            <body className={`${inter.className} bg-[#EFEFEF] w-full h-screen`}>
                <Sidebar />
                <main className="w-full h-screen overflow-auto">
                    {children}
                </main>
            </body>
        </html>
    );
}
