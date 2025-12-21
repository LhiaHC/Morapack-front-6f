"use client";

import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import MapaColapso from "@/components/mapa/MapaColapso";
import SimControlsColapso from "@/components/mapa/SimControlsColapso";
import axios from "axios";
import { Vuelo } from "@/types/Vuelo";
import { Aeropuerto } from "@/types/Aeropuerto";
import useWebSocket from "react-use-websocket";
import { ProgramacionVuelo } from "@/types/ProgramacionVuelo";
import { procesarData, quitarPaquetesAlmacenados } from "@/utils/FuncionesDatos";
import { Envio } from "@/types/Envio";
import CancelacionVuelo from "@/components/CancelacionVuelo";
import { X } from "lucide-react";

type MessageData = {
    data: Array<any>;
    metadata: string;
};

type VueloMapValue = {
    vuelo: Vuelo;
    pointFeature: any;
    lineFeature: any;
    routeFeature: any;
};

type AeropuertoMapValue = {
    aeropuerto: Aeropuerto;
    pointFeature: any;
};

const Page = () => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const apiURL = process.env.NEXT_PUBLIC_MORAPACK_API_URL;
    
    const vuelos = useRef(new Map<number, VueloMapValue>()) as React.MutableRefObject<Map<number, VueloMapValue>>;
    const programacionVuelos = useRef(new Map<string, ProgramacionVuelo>()) as React.MutableRefObject<Map<string, ProgramacionVuelo>>;
    const envios = useRef(new Map<string, Envio>()) as React.MutableRefObject<Map<string, Envio>>;
    const aeropuertos = useRef(new Map<string, AeropuertoMapValue>()) as React.MutableRefObject<Map<string, AeropuertoMapValue>>;
    const auxiliarVuelos = useRef(new Map<number, Vuelo>()) as React.MutableRefObject<Map<number, Vuelo>>;
    
    const [cargado, setCargado] = useState(false);
    const [horaInicio, setHoraInicio] = useState(new Date());
    const [campana, setCampana] = useState(0);
    const [simulationTime, setSimulationTime] = useState<Date | null>(null);
    const [mostrarCancelacion, setMostrarCancelacion] = useState(false);
    const [colapso, setColapso] = useState(false);
    
    const { sendMessage, lastMessage } = useWebSocket(
        process.env.NEXT_PUBLIC_MORAPACK_WS_URL + "/socket",
        {
            onOpen: () => {
                let auxHoraInicio: Date = new Date();
                if (typeof window !== "undefined") {
                    const params = new URLSearchParams(window.location.search);
                    auxHoraInicio = new Date(
                        params.get("startDate") || new Date()
                    );
                }
                console.log("Conexión abierta con tiempo: ", auxHoraInicio);
                sendMessage(
                    "simulacionColapso: tiempo: " +
                        auxHoraInicio.toLocaleString("en-US", {
                            timeZone: "America/Lima",
                        }),
                    true
                );
            },
            share: false,
            shouldReconnect: () => false,
        }
    );
    
    const [nuevosVuelos, setNuevosVuelos] = useState<number[]>([]);
    const [semaforo, setSemaforo] = useState(0);
    const [simulationInterval, setSimulationInterval] = useState(4);
    const [playing, setPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingStage, setLoadingStage] = useState("Inicializando...");
    const slowProgressInterval = useRef<NodeJS.Timeout | null>(null);

    const handleCancelarVuelo = (idVuelo: string, archivo?: File) => {
        if (archivo) {
            console.log("Procesando archivo de cancelaciones:", archivo.name);
        } else {
            console.log("Cancelando vuelo ID:", idVuelo);
            sendMessage(`cancelarVuelo: ${idVuelo}`);
        }
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [cargado]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);

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
        const params = new URLSearchParams(window.location.search);
        const startDate = params.get("startDate");
        if (startDate !== null) {
            setHoraInicio(new Date(startDate));
        } else {
            setHoraInicio(new Date());
        }

        setLoadingProgress(10);
        setLoadingStage("Conectando con el servidor...");

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
                    const auxAeropuertos = new Map<string, AeropuertoMapValue>();
                    response.data.forEach((aeropuerto: Aeropuerto) => {
                        aeropuerto.paquetes = [];
                        aeropuerto.cantidadActual = 0;
                        auxAeropuertos.set(aeropuerto.codigoOACI, {aeropuerto: aeropuerto, pointFeature: null});
                    });
                    aeropuertos.current = auxAeropuertos;
                    setLoadingProgress(55);
                    setLoadingStage("Aeropuertos cargados, esperando datos de vuelos...");
                    setCampana(campana + 1);
                }
            })
            .catch((error) => {
                clearInterval(progressInterval);
                console.error("Error fetching data from the API: ", error);
            });

        return () => clearInterval(progressInterval);
    }, [apiURL, campana]);

    useEffect(() => {
        if (campana === 2) {
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
            let message = JSON.parse(lastMessage.data) as MessageData;
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
                procesarData(message.data, programacionVuelos, envios, aeropuertos, simulationTime?simulationTime:horaInicio, true, vuelos, true, setColapso);
            }
            if (message.metadata.includes("correrAlgoritmo")) {
                console.log(message.data);
                procesarData(message.data, programacionVuelos, envios, aeropuertos, simulationTime, false, vuelos, true, setColapso);
            }
        }
    }, [lastMessage, cargado, vuelos, programacionVuelos, envios, aeropuertos, simulationTime, horaInicio, semaforo, campana, setColapso]);

    
    return (
        <>
            {!cargado && (
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
                            Cargando Simulación de Colapso
                        </h2>
                        <p className="text-gray-600 mb-8">
                            {loadingStage}
                        </p>

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
            {cargado && (
                <>
                    <div className="w-full h-screen">
                        <MapaColapso
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
                            setPlaying={setPlaying}
                        />
                        <SimControlsColapso
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
                        
                        <button
                            onClick={() => setMostrarCancelacion(true)}
                            className="fixed bottom-24 right-6 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-red-600 transition-all hover:scale-105 flex items-center gap-2 z-40"
                        >
                            <X className="w-5 h-5" />
                            Cancelar Vuelo
                        </button>

                        {mostrarCancelacion && (
                            <CancelacionVuelo
                                onCancelar={handleCancelarVuelo}
                                onClose={() => setMostrarCancelacion(false)}
                            />
                        )}
                        
                        <div ref={bottomRef}></div>
                    </div>
                </>
            )}
        </>
    );
};

export default Page;