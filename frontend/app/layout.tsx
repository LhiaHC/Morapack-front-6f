import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";

import "./globals.css";
import Sidebar from "@/components/sidebar/Sidebar";
const inter = Inter({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "DP1 RedEx",
    description: "Proyecto del curso DP1",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <title>RedEx</title>
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
