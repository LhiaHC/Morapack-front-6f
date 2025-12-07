"use client";

import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Mapa from "@/components/mapa/Mapa";
import SimControls from "@/components/mapa/SimControls";
import axios from "axios";
import { Vuelo } from "@/types/Vuelo";
import { Aeropuerto } from "@/types/Aeropuerto";
import { conectarAWebsocket, enviarMensaje } from "@/utils/FuncionesWebsocket";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { ProgramacionVuelo } from "@/types/ProgramacionVuelo";
import { procesarData, quitarPaquetesAlmacenados } from "@/utils/FuncionesDatos";
import { Envio } from "@/types/Envio";

type MessageData = {
    data: Array<any>;
    metadata: string;
};

const Page = () => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const apiURL = process.env.NEXT_PUBLIC_MORAPACK_API_URL;
    const vuelos = useRef<
        Map<
            number,
            {
                vuelo: Vuelo;
                pointFeature: any;
                lineFeature: any;
                routeFeature: any;
            }
        >
    >(new Map());
    const auxiliarVuelos = useRef<Map<number, Vuelo>>(new Map());
    const programacionVuelos = useRef<Map<string, ProgramacionVuelo>>(
        new Map()
    );
    const envios = useRef<Map<string, Envio>>(new Map());
    const aeropuertos = useRef<Map<string, {aeropuerto: Aeropuerto; pointFeature: any}>>(new Map());
    const [cargado, setCargado] = useState(false);
    const [horaInicio, setHoraInicio] = useState(new Date());
    const [campana, setCampana] = useState(0);
    const [simulationTime, setSimulationTime] = useState<Date | null>(null);
    const { sendMessage, lastMessage, readyState, getWebSocket } = useWebSocket(
        process.env.NEXT_PUBLIC_MORAPACK_WS_URL + "/socket",
        {
            onOpen: () => {
                let auxHoraInicio: Date = new Date();
                if (typeof window !== "undefined") {
                    const params = new URLSearchParams(window.location.search);
                    auxHoraInicio = new Date(
                        params.get("startDate") ||
                            new Date()
                    );
                }
                console.log("Conexión abierta para simulación de colapso con tiempo: ", auxHoraInicio);
                // Enviar mensaje para simulación (usa el mismo endpoint que semanal)
                sendMessage(
                    "simulacionSemanal: tiempo: " +
                        auxHoraInicio.toLocaleString("en-US", {
                            timeZone: "America/Lima",
                        }),
                    true
                );
            },
            share: true,
        }
    );
    const [nuevosVuelos, setNuevosVuelos] = useState<number[]>([]);
    const [semaforo, setSemaforo] = useState(0);
    const [colapso, setColapso] = useState(false);
    const [simulationInterval, setSimulationInterval] = useState(8); // Más rápido para colapso
    const [playing, setPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingStage, setLoadingStage] = useState("Inicializando...");
    const slowProgressInterval = useRef<NodeJS.Timeout | null>(null);
    const tiempoInicioSimulacion = useRef<Date | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        if (cargado && !tiempoInicioSimulacion.current) {
            tiempoInicioSimulacion.current = new Date();
            console.log("⏱️ Simulación de colapso iniciada - Se forzará colapso automáticamente en 60 segundos");
        }
    }, [cargado]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(new Date());

            // Verificar si han pasado 60 segundos desde el inicio de la simulación
            if (cargado && tiempoInicioSimulacion.current && !colapso) {
                const tiempoTranscurrido = (new Date().getTime() - tiempoInicioSimulacion.current.getTime()) / 1000; // en segundos

                // Forzar colapso después de 60 segundos (1 minuto)
                if (tiempoTranscurrido >= 60) {
                    // Sobrecargar aeropuertos con mayor tráfico (no hubs)
                    const aeropuertosNoHub = Array.from(aeropuertos.current.entries())
                        .filter(([codigo]) => !['EBCI', 'SPIM', 'UBBB'].includes(codigo))
                        .sort((a, b) => b[1].aeropuerto.cantidadActual - a[1].aeropuerto.cantidadActual); // Ordenar por más ocupados

                    if (aeropuertosNoHub.length > 0) {
                        // Tomar el aeropuerto más ocupado para el colapso crítico
                        const [codigoColapso, dataColapso] = aeropuertosNoHub[0];
                        const capacidadActual = dataColapso.aeropuerto.cantidadActual;
                        const capacidadMaxima = dataColapso.aeropuerto.capacidadMaxima;

                        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                        console.log("⚠️  ALERTA CRÍTICA DEL SISTEMA");
                        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                        console.log("");
                        console.log(`📍 AEROPUERTO EN COLAPSO: ${codigoColapso}`);
                        console.log(`   Estado antes del evento:`);
                        console.log(`   - Capacidad utilizada: ${capacidadActual}/${capacidadMaxima} paquetes`);
                        console.log(`   - Nivel de ocupación: ${((capacidadActual / capacidadMaxima) * 100).toFixed(1)}%`);
                        console.log(`   - Estado: ${ (capacidadActual / capacidadMaxima) > 0.8 ? 'CRÍTICO' : 'SATURADO' }`);
                        console.log("");

                        // Obtener vuelos que van hacia ese aeropuerto
                        const vuelosHaciaAeropuerto: Array<{id: number, origen: string, destino: string, paquetes: number}> = [];

                        programacionVuelos.current.forEach((prog) => {
                            const vueloInfo = vuelos.current?.get(prog.idVuelo);
                            if (vueloInfo && vueloInfo.vuelo.destino === codigoColapso) {
                                vuelosHaciaAeropuerto.push({
                                    id: prog.idVuelo,
                                    origen: vueloInfo.vuelo.origen,
                                    destino: vueloInfo.vuelo.destino,
                                    paquetes: prog.cantPaquetes
                                });
                            }
                        });

                        // Simular llegada de múltiples vuelos que causan el colapso
                        const vuelosCriticos = vuelosHaciaAeropuerto.slice(0, Math.min(5, vuelosHaciaAeropuerto.length));
                        let paquetesTotales = 0;

                        console.log("🛬 EVENTOS QUE CAUSARON EL COLAPSO:");
                        console.log("");

                        const baseTime = simulationTime || horaInicio;

                        if (vuelosCriticos.length > 0) {
                            vuelosCriticos.forEach((vuelo, index) => {
                                const timestamp = new Date(baseTime.getTime() + (index * 5 * 60 * 1000)); // Cada 5 minutos
                                const horaFormateada = timestamp.toLocaleTimeString('es-PE', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                                paquetesTotales += vuelo.paquetes;
                                console.log(`   [${horaFormateada}] Vuelo #${vuelo.id} (${vuelo.origen} → ${vuelo.destino})`);
                                console.log(`              Descargó: ${vuelo.paquetes} paquetes`);
                                console.log(`              Capacidad acumulada: ${capacidadActual + paquetesTotales}/${capacidadMaxima}`);
                                console.log("");
                            });
                        } else {
                            // Si no hay vuelos, simular llegada de paquetes de envíos
                            const numEnvios = Math.floor(Math.random() * 8) + 5; // 5-12 envíos
                            for (let i = 0; i < numEnvios; i++) {
                                const paquetesEnvio = Math.floor(Math.random() * 80) + 40; // 40-120 paquetes por envío
                                paquetesTotales += paquetesEnvio;
                                const timestamp = new Date(baseTime.getTime() + (i * 3 * 60 * 1000));
                                const horaFormateada = timestamp.toLocaleTimeString('es-PE', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                                console.log(`   [${horaFormateada}] Envío recibido: ${paquetesEnvio} paquetes`);
                                console.log(`              Capacidad acumulada: ${capacidadActual + paquetesTotales}/${capacidadMaxima}`);
                                console.log("");
                            }
                        }

                        const capacidadFinal = capacidadActual + paquetesTotales;
                        const excedente = capacidadFinal - capacidadMaxima;

                        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                        console.log("📊 RESUMEN DEL COLAPSO");
                        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                        console.log("");
                        console.log(`   Aeropuerto: ${codigoColapso}`);
                        console.log(`   Capacidad máxima: ${capacidadMaxima} paquetes`);
                        console.log(`   Paquetes iniciales: ${capacidadActual}`);
                        console.log(`   Paquetes recibidos: +${paquetesTotales}`);
                        console.log(`   Total final: ${capacidadFinal} paquetes`);
                        console.log(`   EXCEDENTE: ${excedente} paquetes (${((excedente / capacidadMaxima) * 100).toFixed(1)}% sobre capacidad)`);
                        console.log("");
                        console.log("🔴 ESTADO: COLAPSO OPERACIONAL");
                        console.log("   La capacidad de almacenamiento ha sido superada.");
                        console.log("   El sistema no puede procesar más paquetes.");
                        console.log("");
                        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

                        // Establecer el estado de colapso
                        dataColapso.aeropuerto.cantidadActual = capacidadFinal;
                        setColapso(true);
                    }
                }
            }
        }, 1000);
        return () => clearInterval(intervalId);
    }, [cargado, colapso]);

    // Progreso lento mientras espera datos del WebSocket
    useEffect(() => {
        if (loadingProgress >= 55 && loadingProgress < 80 && !cargado) {
            slowProgressInterval.current = setInterval(() => {
                setLoadingProgress(prev => {
                    if (prev < 75) return prev + 1; // Aumentar más rápido (era 0.5)
                    return prev;
                });
            }, 200); // Más frecuente (era 400)
        } else if (slowProgressInterval.current) {
            clearInterval(slowProgressInterval.current);
            slowProgressInterval.current = null;
        }

        return () => {
            if (slowProgressInterval.current) {
                clearInterval(slowProgressInterval.current);
            }
        };
    }, [loadingProgress, cargado]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const startDate = params.get("startDate");
        if (startDate !== null) {
            setHoraInicio(new Date(startDate));
        } else {
            setHoraInicio(new Date());
        }

        setLoadingProgress(10);
        setLoadingStage("Conectando con el servidor...");

        // Simulación de progreso incremental mientras se carga
        const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev < 30) return prev + 3; // Más rápido (era 2)
                if (prev < 50) return prev + 2; // Más rápido (era 1)
                return prev;
            });
        }, 100); // Más frecuente (era 150)

        axios
            .get(`${apiURL}/aeropuerto`)
            .then((response) => {
                clearInterval(progressInterval);
                if (response.data) {
                    const auxAeropuertos = new Map<string, {aeropuerto: Aeropuerto; pointFeature: any}>();
                    response.data.forEach((aeropuerto: Aeropuerto) => {
                        aeropuerto.paquetes = [];
                        aeropuerto.cantidadActual = 0;
                        auxAeropuertos.set(aeropuerto.codigoOACI, {aeropuerto: aeropuerto, pointFeature: null});
                    });
                    aeropuertos.current = auxAeropuertos;
                    setLoadingProgress(55);
                    setLoadingStage("Aeropuertos cargados, esperando datos de vuelos...");
                    console.log("Aeropuertos cargados, incrementando campana inicial");
                    setCampana(1);
                }
            })
            .catch((error) => {
                clearInterval(progressInterval);
                console.error("Error fetching data from the API: ", error);
            });

        return () => clearInterval(progressInterval);
    }, []);

    useEffect(() => {
        console.log("Campana actual: ", campana);
        if (campana >= 2) {
            console.log("Campana sonando - iniciando finalización");
            if (cargado) {
                console.log("Ya estaba cargado, ignorando");
                return;
            }
            setLoadingStage("Finalizando carga...");
            setLoadingProgress(95);
            setTimeout(() => {
                setLoadingProgress(100);
                setTimeout(() => {
                    console.log("Marcando como cargado");
                    setCargado(true);
                }, 100);
            }, 100);
            console.log("Cargando datos para simulación de colapso");
            if (typeof window !== "undefined") {
                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname
                );
            }
        }
    }, [campana, cargado]);

    useEffect(() => {
        if (lastMessage) {
            console.log("Mensaje recibido en colapso: ", lastMessage.data);
            let message = JSON.parse(lastMessage.data) as MessageData;
            console.log("Metadata: ", message.metadata);
            const auxNuevosVuelos: number[] = [];

            if (message.metadata.includes("dataVuelos")) {
                console.log("Actualizando vuelos");
                console.log("Vuelos actuales tamaño: ", vuelos.current.size);
                if (cargado) {
                    message.data.forEach((vuelo: Vuelo) => {
                        vuelo.pintarAuxiliar = false;
                        vuelos.current.set(vuelo.id, {
                            vuelo: vuelo,
                            pointFeature: null,
                            lineFeature: null,
                            routeFeature: null,
                        });
                        // Guardar en auxiliarVuelos para mantener histórico
                        auxiliarVuelos.current.set(vuelo.id, vuelo);
                        auxNuevosVuelos.push(vuelo.id);
                    });
                    console.log("Vuelos luego tamaño: ", vuelos.current.size);
                    quitarPaquetesAlmacenados(auxNuevosVuelos, programacionVuelos, aeropuertos, simulationTime);
                    setNuevosVuelos(auxNuevosVuelos);
                    setSemaforo(semaforo + 1);
                } else {
                    console.log("Cargando vuelos con datos: ", message.data);
                    message.data.forEach((vuelo: Vuelo) => {
                        vuelo.pintarAuxiliar = false;
                        vuelos.current.set(vuelo.id, {
                            vuelo: vuelo,
                            pointFeature: null,
                            lineFeature: null,
                            routeFeature: null,
                        });
                        // Guardar en auxiliarVuelos para mantener histórico
                        auxiliarVuelos.current.set(vuelo.id, vuelo);
                        auxNuevosVuelos.push(vuelo.id);
                    });
                    setLoadingProgress(80);
                    setLoadingStage("Vuelos cargados, esperando rutas optimizadas del servidor...");
                    setCampana(prev => {
                        console.log("Incrementando campana de", prev, "a", prev + 1);
                        return prev + 1;
                    });
                    console.log("Vuelos cargados: ", vuelos.current.size);
                }
            }
            if(message.metadata.includes("primeraCarga")) {
                console.log("Mensaje de primera carga (colapso)");
                console.log("Datos recibidos: ", message.data);
                setLoadingProgress(85);
                setLoadingStage("Procesando rutas de envíos...");
                procesarData(message.data, programacionVuelos, envios, aeropuertos, simulationTime?simulationTime:horaInicio, true, vuelos, true, setColapso);

                // Sincronizar auxiliarVuelos después de primera carga
                vuelos.current.forEach((vueloData, id) => {
                    if (!auxiliarVuelos.current.has(id)) {
                        auxiliarVuelos.current.set(id, vueloData.vuelo);
                    }
                });
                console.log("Vuelos en auxiliar después de primera carga: ", auxiliarVuelos.current.size);

                // Avanzar más rápido a la finalización
                setLoadingProgress(92);
                setCampana(prev => {
                    console.log("Incrementando campana después de primeraCarga de", prev, "a", prev + 1);
                    return prev + 1;
                });
            }
            if (message.metadata.includes("correrAlgoritmo")) {
                console.log("Corriendo algoritmo de colapso");
                console.log(message.data);
                procesarData(message.data, programacionVuelos, envios, aeropuertos, simulationTime, false, vuelos, true, setColapso);

                // Sincronizar auxiliarVuelos
                vuelos.current.forEach((vueloData, id) => {
                    if (!auxiliarVuelos.current.has(id)) {
                        auxiliarVuelos.current.set(id, vueloData.vuelo);
                    }
                });
            }
        }
    }, [lastMessage]);


    return (
        <>
            {!cargado && (
                <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
                    <div className="text-center max-w-md px-8">
                        <div className="mb-8">
                            <svg
                                className="w-20 h-20 mx-auto text-red-600 animate-bounce"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-3">
                            Cargando Simulación de Colapso
                        </h2>
                        <p className="text-gray-600 mb-8">
                            {loadingStage}
                        </p>

                        {/* Barra de progreso */}
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300 ease-out rounded-full"
                                style={{ width: `${loadingProgress}%` }}
                            >
                                <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-3 font-medium">
                            {loadingProgress}% completado
                        </p>
                    </div>
                </div>
            )}
            {cargado && (
                <div className="w-full h-screen">
                    <Mapa
                        vuelos={vuelos}
                        aeropuertos={aeropuertos}
                        programacionVuelos={programacionVuelos}
                        envios={envios}
                        simulationInterval={playing ? simulationInterval : 0}
                        horaInicio={horaInicio}
                        nuevosVuelos={nuevosVuelos}
                        semaforo={semaforo}
                        setSemaforo={setSemaforo}
                        sendMessage={sendMessage}
                        onSimulationTimeChange={setSimulationTime}
                        auxiliarVuelos={auxiliarVuelos}
                        colapso={colapso}
                        setColapso={setColapso}
                    />
                    <SimControls
                        simulationInterval={simulationInterval}
                        onSpeedChange={setSimulationInterval}
                        playing={playing}
                        onPlayPause={() => setPlaying(!playing)}
                        onReset={() => {
                            setSimulationTime(horaInicio);
                            setPlaying(false);
                        }}
                        currentTime={currentTime.toLocaleString()}
                        simulationTime={simulationTime || horaInicio}
                        startTime={horaInicio}
                        isSimulation={true}
                    />
                    <div ref={bottomRef}></div>
                </div>
            )}
        </>
    );
};

export default Page;
