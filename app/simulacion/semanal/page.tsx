"use client";

import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Mapa from "@/components/mapa/Mapa";
import SimControls from "@/components/mapa/SimControls";
import CancelacionVuelo from "@/components/CancelacionVuelo";
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
                console.log("Conexión abierta con tiempo: ", auxHoraInicio);
                sendMessage(
                    "simulacionSemanal: tiempo: " +
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
    const [mostrarCancelacion, setMostrarCancelacion] = useState(false);
    const [mostrarListaVuelos, setMostrarListaVuelos] = useState(false);
    const [vueloSeleccionado, setVueloSeleccionado] = useState<string>("");

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
                    setLoadingStage("Aeropuertos cargados, esperando datos de vuelos...");
                    setCampana(campana + 1);
                }
            })
            .catch((error) => {
                clearInterval(progressInterval);
                console.error("Error fetching data from the API: ", error);
            });

        return () => clearInterval(progressInterval);
    }, []);

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

    const handleCancelarVuelo = async (idVuelo: string, archivoAlternativo?: File) => {
        try {
            if (archivoAlternativo) {
                const formData = new FormData();
                formData.append("file", archivoAlternativo);
                
                const response = await axios.post(`${apiURL}/vuelo/cancelar-batch`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                
                console.log("Vuelos cancelados por archivo:", response.data);
            } else {
                const response = await axios.post(`${apiURL}/vuelo/cancelar/${idVuelo}`);
                console.log("Vuelo cancelado:", response.data);
            }
            
            sendMessage("actualizarVuelos");
            setVueloSeleccionado("");
        } catch (error) {
            console.error("Error al cancelar vuelo:", error);
            alert("Error al cancelar el vuelo. Por favor intenta nuevamente.");
        }
    };

    const handleSeleccionarVuelo = (idVuelo: string) => {
        setVueloSeleccionado(idVuelo);
        setMostrarCancelacion(true);
        setMostrarListaVuelos(false);
    };

    const getVuelosProgramados = () => {
        const vuelosProgramados: Array<{
            id: number;
            origen: string;
            destino: string;
            fechaSalida: Date;
            cantPaquetes: number;
        }> = [];

        programacionVuelos.current.forEach((programacion) => {
            const vueloId = programacion.idVuelo;
            const vueloActivo = vuelos.current.get(vueloId);
            
            if (!vueloActivo && simulationTime) {
                const fechaSalida = new Date(programacion.fechaSalida);
                if (fechaSalida > simulationTime) {
                    vuelosProgramados.push({
                        id: vueloId,
                        origen: "Vuelo " + vueloId,
                        destino: "",
                        fechaSalida: fechaSalida,
                        cantPaquetes: programacion.cantPaquetes
                    });
                }
            }
        });

        return vuelosProgramados.sort((a, b) => a.fechaSalida.getTime() - b.fechaSalida.getTime());
    };

    
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
                            Cargando Simulación
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
                        colapso={false}
                        setColapso={() => {}}
                        setPlaying={setPlaying}
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
                    
                    <button
                        onClick={() => setMostrarListaVuelos(!mostrarListaVuelos)}
                        className="fixed bottom-8 right-8 z-[85] bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 py-4 shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                        title="Ver vuelos programados"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="font-semibold">Vuelos Programados</span>
                    </button>

                    {mostrarListaVuelos && (
                        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-[90] flex flex-col">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold">Vuelos Programados</h2>
                                    <button
                                        onClick={() => setMostrarListaVuelos(false)}
                                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-sm text-blue-100 mt-2">Vuelos que aún no han despegado</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {getVuelosProgramados().length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <p className="text-center">No hay vuelos programados<br/>por despegar</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {getVuelosProgramados().map((vuelo) => (
                                            <div
                                                key={vuelo.id}
                                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-semibold text-gray-500">ID del Vuelo:</span>
                                                            <span className="text-lg font-bold text-gray-800">{vuelo.id}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-xs text-gray-500 mb-3">
                                                    <div className="flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span>{vuelo.fechaSalida.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                        </svg>
                                                        <span>{vuelo.cantPaquetes} paquetes</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleSeleccionarVuelo(vuelo.id.toString())}
                                                    className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Cancelar este vuelo
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {mostrarCancelacion && (
                        <CancelacionVuelo
                            onCancelar={handleCancelarVuelo}
                            onClose={() => {
                                setMostrarCancelacion(false);
                                setVueloSeleccionado("");
                            }}
                            vueloPreseleccionado={vueloSeleccionado}
                        />
                    )}
                    
                    <div ref={bottomRef}></div>
                </div>
            )}
        </>
    );
};

export default Page;
