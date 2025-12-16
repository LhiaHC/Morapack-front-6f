"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SimulacionPreloadScreen from "@/components/SimulacionPreloadScreen";

export default function CargarPedidosPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [startDate, setStartDate] = useState(new Date());

    useEffect(() => {
        const dateParam = searchParams.get("startDate");
        if (dateParam) {
            setStartDate(new Date(dateParam));
        }
    }, [searchParams]);

    const handlePreloadDone = () => {
        // Redirigir de vuelta a /simulacion después de cargar
        router.push('/simulacion');
    };

    return (
        <SimulacionPreloadScreen
            startDate={startDate}
            onDone={handlePreloadDone}
        />
    );
}