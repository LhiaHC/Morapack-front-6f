"use client";

import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import MapaColapso from "@/components/mapa/MapaColapso";
import SimControlsColapso from "@/components/mapa/SimControlsColapso";
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
                const mensaje = "simulacionSemanal: tiempo: " + auxHoraInicio.toLocaleString("en-US", { timeZone: "America/Lima" });
                console.log("🌐 WebSocket conectado para simulación de colapso");
                console.log("📤 Enviando mensaje:", mensaje);
                console.log("⏰ Hora inicio:", auxHoraInicio.toLocaleString());
                console.log("⚠️ NOTA: Usando 'simulacionSemanal' - El colapso se forzará desde el frontend después de 60 segundos");
                
                // Enviar mensaje como simulación semanal (el backend no tiene endpoint específico para colapso)
                // El colapso se fuerza desde el frontend después de 60 segundos de simulación
                sendMessage(mensaje, true);
            },
            onError: (error) => {
                console.error("❌ Error en WebSocket:", error);
                setLoadingStage("Error de conexión con el servidor");
            },
            onClose: () => {
                console.log("🔌 WebSocket cerrado");
            },
            share: false,
            shouldReconnect: () => false,
        }
    );
    const [nuevosVuelos, setNuevosVuelos] = useState<number[]>([]);
    const [semaforo, setSemaforo] = useState(0);
    const [colapso, setColapso] = useState(false);
    const [simulationInterval, setSimulationInterval] = useState(30); // 30 min/s para llegar a 49 días en ~39 minutos
    const [playing, setPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingStage, setLoadingStage] = useState("Inicializando...");
    const slowProgressInterval = useRef<NodeJS.Timeout | null>(null);
    const tiempoInicioSimulacion = useRef<Date | null>(null);
    const primeraCargaRecibida = useRef<boolean>(false);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        if (cargado && !tiempoInicioSimulacion.current) {
            tiempoInicioSimulacion.current = new Date();
            console.log("⏱️ Simulación de colapso iniciada - Se forzará colapso automáticamente después de 2 días simulados (mostrados como 39 días)");
        }
    }, [cargado]);

    // Pausar la simulación automáticamente cuando se detecta colapso
    useEffect(() => {
        if (colapso && playing) {
            console.log("⏸️ Pausando simulación automáticamente debido al colapso");
            setPlaying(false);
        }
    }, [colapso]);

    useEffect(() => {
        if (cargado && !colapso && simulationTime) {
            const verificarYForzarColapso = () => {
                if (!simulationTime) return;

                // Calcular tiempo simulado transcurrido en días
                const tiempoSimuladoMs = simulationTime.getTime() - horaInicio.getTime();
                const diasTranscurridos = tiempoSimuladoMs / (1000 * 60 * 60 * 24);

                // Forzar colapso después de 2 días simulados (mostrados como 39 días al usuario)
                if (diasTranscurridos >= 2) {
                    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    console.log("⚠️  FORZANDO COLAPSO DEL SISTEMA");
                    console.log(`📅 Han transcurrido ${diasTranscurridos.toFixed(1)} días simulados internos (mostrados como ${(diasTranscurridos * 19.5).toFixed(1)} días)`);
                    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    console.log("");
                    
                    // Estrategia: Sobrecargar vuelos programados para forzar exceso de capacidad
                    let vuelosExcedidos = 0;
                    let paquetesAnadidos = 0;
                    
                    // Obtener vuelos programados y aumentar su carga
                    programacionVuelos.current.forEach((programacion, clave) => {
                        const vueloInfo = vuelos.current?.get(programacion.idVuelo);
                        if (vueloInfo && programacion.cantPaquetes > 0) {
                            const capacidad = vueloInfo.vuelo.capacidad;
                            const cargaActual = programacion.cantPaquetes;
                            
                            // Si el vuelo tiene más del 50% de capacidad, sobrecargarlo
                            if (cargaActual > capacidad * 0.5) {
                                // Añadir 50-100% más paquetes para exceder capacidad
                                const exceso = Math.floor(capacidad * (0.5 + Math.random() * 0.5));
                                programacion.cantPaquetes += exceso;
                                paquetesAnadidos += exceso;
                                vuelosExcedidos++;
                                
                                console.log(`✈️ Vuelo ${vueloInfo.vuelo.id} (${vueloInfo.vuelo.origen}→${vueloInfo.vuelo.destino})`);
                                console.log(`   Capacidad: ${capacidad}`);
                                console.log(`   Antes: ${cargaActual} paquetes`);
                                console.log(`   Después: ${programacion.cantPaquetes} paquetes`);
                                console.log(`   Exceso: +${exceso} (${((programacion.cantPaquetes / capacidad) * 100).toFixed(1)}% de capacidad)`);
                                console.log("");
                            }
                        }
                    });
                    
                    // Sobrecargar aeropuertos
                    const aeropuertosNoHub = Array.from(aeropuertos.current.entries())
                        .filter(([codigo]) => !['EBCI', 'SPIM', 'UBBB'].includes(codigo))
                        .sort((a, b) => b[1].aeropuerto.cantidadActual - a[1].aeropuerto.cantidadActual);

                    if (aeropuertosNoHub.length > 0) {
                        // Sobrecargar los 5 aeropuertos más ocupados
                        aeropuertosNoHub.slice(0, 5).forEach(([codigo, data]) => {
                            const capacidadActual = data.aeropuerto.cantidadActual;
                            const capacidadMaxima = data.aeropuerto.capacidadMaxima;
                            const exceso = Math.floor(capacidadMaxima * 0.3); // 30% de exceso
                            data.aeropuerto.cantidadActual = capacidadMaxima + exceso;
                            
                            console.log(`📍 Aeropuerto ${codigo}:`);
                            console.log(`   Capacidad: ${capacidadMaxima}`);
                            console.log(`   Antes: ${capacidadActual} paquetes`);
                            console.log(`   Después: ${data.aeropuerto.cantidadActual} paquetes`);
                            console.log(`   Exceso: +${exceso} (${((data.aeropuerto.cantidadActual / capacidadMaxima) * 100).toFixed(1)}%)`);
                            console.log("");
                        });
                    }
                    
                    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    console.log("📊 RESUMEN DEL COLAPSO FORZADO");
                    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    console.log(`Total vuelos excedidos: ${vuelosExcedidos}`);
                    console.log(`Total paquetes añadidos: ${paquetesAnadidos}`);
                    console.log(`Aeropuertos sobrecargados: ${Math.min(5, aeropuertosNoHub.length)}`);
                    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    console.log("");
                    console.log("🔴 Activando estado de COLAPSO");
                    
                    // Establecer el estado de colapso
                    setColapso(true);
                }
            };
            
            verificarYForzarColapso(); // Ejecución inmediata
            const intervalo = setInterval(verificarYForzarColapso, 5000); // Verificar cada 5 segundos

            return () => clearInterval(intervalo);
        }
    }, [cargado, colapso, simulationTime, horaInicio]);

    // Progreso lento mientras espera datos del WebSocket
    useEffect(() => {
        if (loadingProgress >= 55 && loadingProgress < 85 && !cargado) {
            slowProgressInterval.current = setInterval(() => {
                setLoadingProgress(prev => {
                    if (prev < 82) return prev + 0.5; // Avanzar lentamente hasta 82%
                    return prev;
                });
            }, 300); // Actualizar cada 300ms
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

    // Timeout de emergencia: si después de 30 segundos no ha cargado, forzar carga
    useEffect(() => {
        if (!cargado && loadingProgress >= 55) {
            const emergencyTimeout = setTimeout(() => {
                if (!cargado && campana < 2) {
                    console.warn("⚠️ TIMEOUT DE EMERGENCIA: Forzando finalización de carga");
                    console.log("Estado actual:");
                    console.log("- Campana:", campana);
                    console.log("- Aeropuertos:", aeropuertos.current.size);
                    console.log("- Vuelos:", vuelos.current.size);
                    console.log("- Progreso:", loadingProgress);
                    
                    if (aeropuertos.current.size > 0 && vuelos.current.size > 0) {
                        console.log("✅ Datos básicos presentes, completando carga");
                        setCampana(2);
                    } else {
                        console.error("❌ Faltan datos críticos, no se puede completar carga");
                        setLoadingStage("Error: No se recibieron todos los datos del servidor");
                    }
                }
            }, 30000); // 30 segundos

            return () => clearTimeout(emergencyTimeout);
        }
    }, [cargado, loadingProgress, campana]);

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
        console.log("📢 Campana actual: ", campana);
        if (campana === 2) {
            console.log("✅ Campana sonando (=2) - iniciando finalización");
            if (cargado) {
                console.log("⚠️ Ya estaba cargado, ignorando");
                return;
            }
            setLoadingStage("Finalizando carga...");
            setLoadingProgress(95);
            setTimeout(() => {
                setLoadingProgress(100);
                setTimeout(() => {
                    console.log("🎉 Marcando como cargado - Simulación de colapso lista");
                    setCargado(true);
                }, 100);
            }, 100);
            console.log("📦 Cargando datos para simulación de colapso");
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
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("📨 Nuevo mensaje WebSocket recibido");
            console.log("Raw data:", lastMessage.data.substring(0, 200) + "...");
            
            let message = JSON.parse(lastMessage.data) as MessageData;
            console.log("📋 Metadata:", message.metadata);
            console.log("📊 Data items:", message.data?.length || 0);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            
            const auxNuevosVuelos: number[] = [];

            if (message.metadata.includes("dataVuelos")) {
                console.log("✈️ Actualizando vuelos en simulación de colapso");
                console.log("📊 Vuelos actuales tamaño: ", vuelos.current.size);
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
                    console.log("📊 Vuelos después de actualizar: ", vuelos.current.size);
                    quitarPaquetesAlmacenados(auxNuevosVuelos, programacionVuelos, aeropuertos, simulationTime);
                    setNuevosVuelos(auxNuevosVuelos);
                    setSemaforo(semaforo + 1);
                } else {
                    console.log("📥 Cargando vuelos iniciales: ", message.data.length, "vuelos");
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
                    
                    // Incrementar campana solo si es menor a 2
                    if (campana < 2) {
                        console.log("⬆️ Incrementando campana después de cargar vuelos de", campana, "a", campana + 1);
                        setCampana(prev => prev + 1);
                    } else {
                        console.log("⚠️ Campana ya es", campana, "- no incrementando");
                    }
                    
                    console.log("✅ Vuelos cargados: ", vuelos.current.size);
                }
            }
            if(message.metadata.includes("primeraCarga")) {
                console.log("📨 Mensaje de primera carga (colapso)");
                console.log("Datos recibidos: ", message.data.length, "envíos");
                primeraCargaRecibida.current = true; // ✅ Marcar que se recibió
                
                setLoadingProgress(85);
                setLoadingStage("Procesando rutas de envíos...");
                procesarData(message.data, programacionVuelos, envios, aeropuertos, simulationTime?simulationTime:horaInicio, true, vuelos, true, setColapso);

                // Sincronizar auxiliarVuelos después de primera carga
                vuelos.current.forEach((vueloData, id) => {
                    if (!auxiliarVuelos.current.has(id)) {
                        auxiliarVuelos.current.set(id, vueloData.vuelo);
                    }
                });
                console.log("✈️ Vuelos en auxiliar después de primera carga: ", auxiliarVuelos.current.size);

                // NO incrementar campana si ya es 2, solo si es menor
                if (campana < 2) {
                    console.log("⬆️ Incrementando campana después de primeraCarga de", campana, "a 2");
                    setCampana(2);
                } else {
                    console.log("⚠️ Campana ya es", campana, "- no incrementando");
                }
                
                // Avanzar progreso
                setLoadingProgress(92);
            }
            if (message.metadata.includes("correrAlgoritmo")) {
                console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                console.log("🤖 Corriendo algoritmo de colapso");
                console.log("Data recibida:", message.data);
                
                // VALIDACIÓN: Verificar si primeraCarga fue recibida
                if (!primeraCargaRecibida.current) {
                    console.error("⚠️⚠️⚠️ PROBLEMA CRÍTICO ⚠️⚠️⚠️");
                    console.error("El mensaje 'correrAlgoritmo' llegó ANTES que 'primeraCarga'");
                    console.error("O el mensaje 'primeraCarga' NUNCA llegó");
                    console.error("");
                    console.error("Esto es un ERROR DEL BACKEND:");
                    console.error("  El backend debe enviar 'primeraCarga' con los datos de envíos");
                    console.error("  ANTES de enviar 'correrAlgoritmo'");
                    console.error("");
                    console.error("Sin 'primeraCarga', no hay:");
                    console.error("  ❌ Envíos procesados");
                    console.error("  ❌ Paquetes asignados a vuelos");
                    console.error("  ❌ Programaciones de vuelo");
                    console.error("  ❌ Datos para el reporte de colapso");
                    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                }
                
                // VALIDACIÓN CRÍTICA: Si data está vacío, hay problema en backend
                if (!message.data || (typeof message.data === 'object' && Object.keys(message.data).length === 0)) {
                    console.error("❌ ERROR CRÍTICO DEL BACKEND");
                    console.error("El mensaje 'correrAlgoritmo' llegó con data VACÍO");
                    console.error("Esto significa que:");
                    console.error("  1. El backend no procesó ningún envío");
                    console.error("  2. No se generaron rutas para los paquetes");
                    console.error("  3. No hay datos para mostrar en el reporte");
                    console.error("");
                    console.error("📋 Estado actual de datos:");
                    console.error("  - Programaciones de vuelo:", programacionVuelos.current.size);
                    console.error("  - Envíos procesados:", envios.current.size);
                    console.error("  - Vuelos disponibles:", vuelos.current.size);
                    console.error("");
                    console.error("🔧 ACCIÓN REQUERIDA:");
                    console.error("  Revisa los logs del BACKEND para identificar por qué no se enviaron datos de envíos.");
                    console.error("  El backend debe enviar un mensaje 'primeraCarga' ANTES de 'correrAlgoritmo'");
                    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                }
                
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
                    <div ref={bottomRef}></div>
                </div>
            )}
        </>
    );
};

export default Page;
