"use client";

import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Mapa from "@/components/mapa/Mapa";
import SimControls from "@/components/mapa/controlsDiario";
import axios from "axios";
import { Vuelo } from "@/types/Vuelo";
import { Aeropuerto } from "@/types/Aeropuerto";
import { conectarAWebsocket, enviarMensaje } from "@/utils/FuncionesWebsocket";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { ProgramacionVuelo } from "@/types/ProgramacionVuelo";
import { procesarData, quitarPaquetesAlmacenados } from "@/utils/FuncionesDatos";
import { Envio } from "@/types/Envio";
import PedidosPreloadScreen from "@/components/PedidosPreloadScreen";
import { useRouter } from "next/navigation";


type MessageData = {
    data: Array<any>;
    metadata: string;
};

const Page = () => {
    const router = useRouter();
    const bottomRef = useRef<HTMLDivElement>(null);
    const apiURL = process.env.NEXT_PUBLIC_MORAPACK_API_URL;
    const vuelos = useRef<Map<number, {
        vuelo: Vuelo;
        pointFeature: any;
        lineFeature: any;
        routeFeature: any;
    }>>(new Map());
    const programacionVuelos = useRef<Map<string, ProgramacionVuelo>>(
        new Map()
    );
    const envios = useRef<Map<string, Envio>>(new Map());
    const aeropuertos = useRef<Map<string, {aeropuerto: Aeropuerto; pointFeature: any}>>(new Map());
    const [cargado, setCargado] = useState(false);
    const [horaInicio, setHoraInicio] = useState(new Date());

    const [preloadDone, setPreloadDone] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

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
                console.log("Conexión abierta con tiempo: ", auxHoraInicio);
                sendMessage(
                    "simulacionSemanal: tiempo: " +
                        auxHoraInicio.toLocaleString("en-US", {
                            timeZone: "America/Lima",
                        }),
                    true
                );
            },
            share: true,
        },
        preloadDone // ✅ SOLO conecta cuando termine la pantalla previa
    );
    const [nuevosVuelos, setNuevosVuelos] = useState<number[]>([]);
    const [semaforo, setSemaforo] = useState(0);
    const [simulationInterval, setSimulationInterval] = useState(4);
    const [playing, setPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingStage, setLoadingStage] = useState("Inicializando...");
    const slowProgressInterval = useRef<NodeJS.Timeout | null>(null);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showMenu && !target.closest('.menu-container')) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [cargado]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);

    // Progreso lento mientras espera datos del WebSocket
    useEffect(() => {
        if (loadingProgress >= 55 && loadingProgress < 80 && !cargado) {
            slowProgressInterval.current = setInterval(() => {
                setLoadingProgress(prev => {
                    if (prev < 75) return prev + 0.5;
                    return prev;
                });
            }, 400);
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
        if (!preloadDone) return; // ⛔ NO ejecutes axios aún
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
                if (prev < 30) return prev + 2;
                if (prev < 50) return prev + 1;
                return prev;
            });
        }, 150);

        axios
            .get(`${apiURL}/aeropuerto`)
            .then((response) => {
                clearInterval(progressInterval);
                if (response.data) {
                    // console.log("Respuesta de aeropuertos: ", response.data);
                    const auxAeropuertos = new Map<string, {aeropuerto: Aeropuerto; pointFeature: any}>();
                    response.data.forEach((aeropuerto: Aeropuerto) => {
                        aeropuerto.paquetes = [];
                        aeropuerto.cantidadActual = 0;
                        auxAeropuertos.set(aeropuerto.codigoOACI, {aeropuerto: aeropuerto, pointFeature: null});
                    });
                    // console.log("Aeropuertos cargados: ", auxAeropuertos);
                    aeropuertos.current = auxAeropuertos;
                    setLoadingProgress(55);
                    setLoadingStage("Datos cargados, ejecutando simulación...");
                    setCampana(campana + 1);
                }
            })
            .catch((error) => {
                clearInterval(progressInterval);
                console.error("Error fetching data from the API: ", error);
            });

        return () => clearInterval(progressInterval);
    }, [preloadDone]);

    useEffect(() => {
        if (campana ==2) {
            console.log("Campana sonando");
            if (cargado) {
                return;
            }
            setLoadingStage("Finalizando carga...");
            setLoadingProgress(95);
            setTimeout(() => {
                setLoadingProgress(100);
                setTimeout(() => {
                    setCargado(true);
                }, 200);
            }, 150);
            console.log("Cargando datos");
            // console.log("Aeropuertos cargados: ", aeropuertos);
            if (typeof window !== "undefined") {
                //Limpiar la URL del query string
                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname
                );
            }
        }
    }, [campana]);

    useEffect(() => {
        if (lastMessage) {
            //console.log("Mensaje recibido: ", lastMessage);
            //Parsear el mensaje recibido
            let message = JSON.parse(lastMessage.data) as MessageData;
            // console.log("Mensaje recibido: ", message);
            const auxNuevosVuelos: number[] = [];

            if (message.metadata.includes("dataVuelos")) {
                console.log("Actualizando vuelos");
                // console.log("Vuelos recibidos: ", message.data);
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
                        auxNuevosVuelos.push(vuelo.id);
                    });
                    console.log("Vuelos luego tamaño: ", vuelos.current.size);
                    quitarPaquetesAlmacenados(auxNuevosVuelos, programacionVuelos, aeropuertos, simulationTime);
                    setNuevosVuelos(auxNuevosVuelos);
                    setSemaforo(semaforo + 1);
                    // console.log("Vuelos actualizados: ", vuelos);
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
                        auxNuevosVuelos.push(vuelo.id);
                    });
                    setLoadingProgress(80);
                    setLoadingStage("Vuelos cargados, esperando rutas optimizadas del servidor...");
                    setCampana(campana + 1);
                    console.log("Vuelos cargados: ", vuelos.current.size);
                }
            }
            if(message.metadata.includes("primeraCarga")) {
                console.log("Mensaje de primera carga");
                console.log("Datos recibidos: ", message.data);
                setLoadingProgress(90);
                setLoadingStage("Procesando rutas de envíos...");
                procesarData(message.data, programacionVuelos, envios, aeropuertos, simulationTime?simulationTime:horaInicio, true, vuelos, true, () => {}); // No detectar colapso en semanal
            }
            if (message.metadata.includes("correrAlgoritmo")) {
                console.log(message.data);
                procesarData(message.data, programacionVuelos, envios, aeropuertos, simulationTime, false, vuelos, true, () => {}); // No detectar colapso en semanal
            }
        }
    }, [lastMessage]);

    
    return (
        <>
        {!preloadDone && (
        <PedidosPreloadScreen
            startDate={horaInicio}
            onDone={() => setPreloadDone(true)}
        />
        )}
            {preloadDone && !cargado && (
                <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
                    <div className="text-center max-w-md px-8">
                        <div className="mb-8">
                            <svg
                                className="w-20 h-20 mx-auto text-primary animate-bounce"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-3">
                            Cargando Simulación en vivo ...
                        </h2>
                        <p className="text-gray-600 mb-8">
                            {loadingStage}
                        </p>

                        {/* Barra de progreso */}
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
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
            {preloadDone && cargado && (
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
                        colapso={false}
                        setColapso={() => {}}
                        setPlaying={setPlaying}
                    />
                    <SimControls
                    />

                    {/* Botón flotante con menú de opciones */}
                    <div className="fixed top-6 right-6 z-50 menu-container">
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all duration-200 shadow-lg active:scale-95"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span className="font-medium">Cargar Datos</span>
                                <svg className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Menú desplegable */}
                            {showMenu && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            router.push('/simulacion/semanal');
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">Cargar archivos</p>
                                                <p className="text-xs text-gray-500">Simulación semanal completa</p>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            // TODO: Implementar navegación a registro pedido por pedido
                                            alert('Funcionalidad de registro pedido por pedido en desarrollo');
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors">
                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">Registro pedido por pedido</p>
                                                <p className="text-xs text-gray-500">Ingreso manual de pedidos</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div ref={bottomRef}></div>
                </div>
            )}
        </>
    );
};

export default Page;
