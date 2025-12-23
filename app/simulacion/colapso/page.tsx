"use client";

import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import MapaColapso from "@/components/mapa/MapaColapso";
import SimControlsColapso from "@/components/mapa/SimControlsColapso";
import CancelacionVuelo from "@/components/CancelacionVuelo";
import CancelacionMasivaVuelo from "@/components/CancelacionMasivaVuelo";
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
                console.log(`⚠️ CONFIGURACIÓN: Velocidad inicial ${VELOCIDAD_FIJA_COLAPSO} min/s | Multiplicador 6x | Colapso en ~96 días internos (mostrados como ~576 días / 19.2 meses)`);
                
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
    const VELOCIDAD_FIJA_COLAPSO = 20; // VELOCIDAD FIJA: 20 min/s para estabilidad con WebSocket - NO CAMBIAR durante simulación
    const [simulationInterval, setSimulationInterval] = useState(VELOCIDAD_FIJA_COLAPSO);
    const [playing, setPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingStage, setLoadingStage] = useState("Inicializando...");
    const slowProgressInterval = useRef<NodeJS.Timeout | null>(null);
    const tiempoInicioSimulacion = useRef<Date | null>(null);
    const primeraCargaRecibida = useRef<boolean>(false);
    const [mostrarCancelacion, setMostrarCancelacion] = useState(false);
    const [mostrarCancelacionMasiva, setMostrarCancelacionMasiva] = useState(false);
    const [mostrarListaVuelos, setMostrarListaVuelos] = useState(false);
    const [vueloSeleccionado, setVueloSeleccionado] = useState<string>("");
    const [vuelosCancelados, setVuelosCancelados] = useState<Array<{
        id: number;
        fechaCancelacion: Date;
        motivoCancelacion: string;
        cantPaquetes: number;
    }>>([]);
    const [mostrarListaCancelados, setMostrarListaCancelados] = useState(false);
    const contadorCerosConsecutivos = useRef<number>(0);
    const INTENTOS_MINIMOS_COLAPSO = 15; // Esperar 15 respuestas consecutivas con 0 datos antes de declarar colapso

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        if (cargado && !tiempoInicioSimulacion.current) {
            tiempoInicioSimulacion.current = new Date();
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("⏱️ SIMULACIÓN DE COLAPSO INICIADA");
            console.log(`⚙️ Velocidad INICIAL: ${VELOCIDAD_FIJA_COLAPSO} min/s (recomendada para estabilidad)`);
            console.log("📊 Multiplicador de tiempo: 6x (visualización equilibrada)");
            console.log("⏳ Duración estimada: ~96 días internos (mostrados como ~576 días / 19.2 meses)");
            console.log("🚀 Vuelos durarán máximo 3 días en pantalla");
            console.log("🎯 El colapso se forzará automáticamente al alcanzar este tiempo");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
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

                // Forzar colapso después de 96 días internos (mostrados como 384 días / ~12.8 meses con multiplicador 4x)
                const DIAS_HASTA_COLAPSO = 96;
                if (diasTranscurridos >= DIAS_HASTA_COLAPSO) {
                    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    console.log("⚠️  FORZANDO COLAPSO DEL SISTEMA");
                    console.log(`📅 Han transcurrido ${diasTranscurridos.toFixed(1)} días internos (mostrados como ${(diasTranscurridos * 6).toFixed(1)} días / ${((diasTranscurridos * 6) / 30).toFixed(1)} meses)`);
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
                
                // VALIDACIÓN CRÍTICA: Si data está vacío, significa que ya no hay más paquetes
                // Esto indica que la simulación ha llegado a su fin natural (colapso por agotamiento)
                if (!message.data || (typeof message.data === 'object' && Object.keys(message.data).length === 0)) {
                    // Incrementar contador de respuestas vacías consecutivas
                    contadorCerosConsecutivos.current += 1;
                    
                    console.warn(`⚠️ Respuesta vacía del backend (#${contadorCerosConsecutivos.current}/${INTENTOS_MINIMOS_COLAPSO})`);
                    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    console.log("📊 Estado actual:");
                    console.log(`  - Respuestas vacías consecutivas: ${contadorCerosConsecutivos.current}/${INTENTOS_MINIMOS_COLAPSO}`);
                    console.log("  - Programaciones de vuelo:", programacionVuelos.current.size);
                    console.log("  - Envíos procesados:", envios.current.size);
                    console.log("  - Vuelos disponibles:", vuelos.current.size);
                    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    
                    // VALIDACIÓN: Requiere suficientes datos Y múltiples intentos para evitar falsos positivos
                    const suficientesDatos = envios.current.size >= 10 && programacionVuelos.current.size >= 50;
                    const suficientesIntentos = contadorCerosConsecutivos.current >= INTENTOS_MINIMOS_COLAPSO;
                    
                    if (suficientesDatos && suficientesIntentos) {
                        // Activar el estado de colapso para mostrar el reporte
                        if (!colapso) {
                            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                            console.log("🔴 COLAPSO CONFIRMADO: AGOTAMIENTO SOSTENIDO DE ENVÍOS");
                            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                            console.log("📋 Estado final:");
                            console.log(`  - Respuestas vacías consecutivas: ${contadorCerosConsecutivos.current}`);
                            console.log("  - Programaciones de vuelo:", programacionVuelos.current.size);
                            console.log("  - Envíos procesados:", envios.current.size);
                            console.log("  - Vuelos disponibles:", vuelos.current.size);
                            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                            console.log("🔴 Activando estado de COLAPSO y pausando simulación");
                            setColapso(true);
                            setPlaying(false); // Pausar automáticamente
                        }
                    } else if (!suficientesIntentos) {
                        console.warn(`⏳ Esperando más confirmaciones... (${contadorCerosConsecutivos.current}/${INTENTOS_MINIMOS_COLAPSO} intentos)`);
                        console.warn("   El backend puede estar iniciando la simulación o procesando datos.");
                        console.warn("   Se requieren múltiples respuestas vacías consecutivas para confirmar colapso.");
                    } else {
                        console.warn("⚠️ Datos insuficientes para declarar colapso:");
                        console.warn("  - Envíos:", envios.current.size, "(mínimo: 10)");
                        console.warn("  - Programaciones:", programacionVuelos.current.size, "(mínimo: 50)");
                        console.warn("  - Esperando más datos del backend...");
                    }
                    return; // No procesar data vacío
                } else {
                    // Si recibimos datos, resetear el contador de ceros consecutivos
                    if (contadorCerosConsecutivos.current > 0) {
                        console.log(`✅ Datos recibidos del backend - Reseteando contador de ceros (era ${contadorCerosConsecutivos.current})`);
                        contadorCerosConsecutivos.current = 0;
                    }
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

    const handleCancelarVuelo = async (idVuelo: string) => {
        try {
            // Simulación: cancelar un solo vuelo
            const vueloId = parseInt(idVuelo);
            
            // Buscar el vuelo en programacionVuelos con diferentes formatos de key
            let programacion = programacionVuelos.current.get(idVuelo);
            if (!programacion) {
                programacion = programacionVuelos.current.get(vueloId.toString());
            }
            
            // Verificar que no esté ya cancelado
            const yaCancelado = vuelosCancelados.some(v => v.id === vueloId);
            
            if (yaCancelado) {
                alert(`El vuelo #${vueloId} ya fue cancelado`);
            } else {
                setVuelosCancelados(prev => [...prev, {
                    id: vueloId,
                    fechaCancelacion: new Date(),
                    motivoCancelacion: "Cancelación manual",
                    cantPaquetes: programacion?.cantPaquetes || 0
                }]);
                
                alert(`Vuelo #${vueloId} cancelado exitosamente`);
            }
            
            setVueloSeleccionado("");
        } catch (error) {
            console.error("Error al cancelar vuelo:", error);
            alert("Error al cancelar el vuelo");
        }
    };

    const handleCancelarVuelosMasivo = async (archivo: File) => {
        try {
            // Simulación: leer archivo y cancelar múltiples vuelos
            const text = await archivo.text();
            const lines = text.split('\n').map(line => line.trim()).filter(line => line);
            // Formato: ORIGEN-DESTINO-HORA_SALIDA-HORA_LLEGADA-ID
            const idsVuelos = lines.map(line => {
                const parts = line.split('-');
                return parts.length >= 5 ? parts[4] : line; // El ID es el último campo
            });
            
            let vuelosCanceladosCount = 0;
            let vuelosDuplicados = 0;
            let totalPaquetesAfectados = 0;
            const nuevasCancelaciones: Array<{
                id: number;
                fechaCancelacion: Date;
                motivoCancelacion: string;
                cantPaquetes: number;
            }> = [];
            
            // Set para detectar duplicados dentro del mismo archivo
            const idsUnicos = new Set<number>();
            const idsRepetidosEnArchivo = new Set<number>();
            
            idsVuelos.forEach(id => {
                const vueloId = parseInt(id);
                if (!isNaN(vueloId)) {
                    // Verificar duplicados dentro del archivo
                    if (idsUnicos.has(vueloId)) {
                        idsRepetidosEnArchivo.add(vueloId);
                        return; // Skip duplicado en archivo
                    }
                    idsUnicos.add(vueloId);
                    
                    // Buscar el vuelo en programacionVuelos
                    let programacion = programacionVuelos.current.get(vueloId.toString());
                    if (!programacion) {
                        programacion = programacionVuelos.current.get(vueloId.toString());
                    }
                    
                    // Verificar que no esté ya cancelado
                    const yaCancelado = vuelosCancelados.some(v => v.id === vueloId);
                    
                    if (!yaCancelado) {
                        const cantPaquetes = programacion?.cantPaquetes || 0;
                        totalPaquetesAfectados += cantPaquetes;
                        
                        nuevasCancelaciones.push({
                            id: vueloId,
                            fechaCancelacion: new Date(),
                            motivoCancelacion: `Cancelación masiva - ${archivo.name}`,
                            cantPaquetes: cantPaquetes
                        });
                        vuelosCanceladosCount++;
                    } else {
                        vuelosDuplicados++;
                    }
                }
            });
            
            // Actualizar estado una sola vez con todas las cancelaciones
            if (nuevasCancelaciones.length > 0) {
                setVuelosCancelados(prev => [...prev, ...nuevasCancelaciones]);
            }
            
            // Mensaje detallado
            let mensaje = `✅ Cancelación masiva completada:\n\n`;
            mensaje += `• ${vuelosCanceladosCount} vuelos cancelados\n`;
            mensaje += `• ${totalPaquetesAfectados} paquetes afectados\n`;
            if (vuelosDuplicados > 0) {
                mensaje += `• ${vuelosDuplicados} vuelos ya estaban cancelados previamente\n`;
            }
            if (idsRepetidosEnArchivo.size > 0) {
                mensaje += `• ${idsRepetidosEnArchivo.size} IDs repetidos en el archivo (ignorados)\n`;
            }
            mensaje += `\nArchivo: ${archivo.name}`;
            
            alert(mensaje);
        } catch (error) {
            console.error("Error al cancelar vuelos masivamente:", error);
            alert("Error al procesar el archivo de cancelaciones");
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
            
            // Verificar si el vuelo está cancelado
            const estaCancelado = vuelosCancelados.some(v => v.id === vueloId);
            
            if (!vueloActivo && !estaCancelado && simulationTime) {
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
                    
                    {/* Botón para ver vuelos programados */}
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

                    {/* Botón para ver vuelos cancelados */}
                    <button
                        onClick={() => setMostrarListaCancelados(!mostrarListaCancelados)}
                        className="fixed bottom-8 right-80 z-[85] bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-4 shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                        title="Ver vuelos cancelados"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="font-semibold">Cancelados ({vuelosCancelados.length})</span>
                    </button>

                    {/* Botón para cancelación masiva */}
                    <button
                        onClick={() => setMostrarCancelacionMasiva(true)}
                        className="fixed bottom-24 right-8 z-[85] bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 py-4 shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                        title="Cancelación masiva por archivo"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-semibold">Cancelación Masiva</span>
                    </button>

                    {/* Panel de vuelos programados */}
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

                    {/* Panel de vuelos cancelados */}
                    {mostrarListaCancelados && (
                        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] max-h-[85vh] bg-white shadow-2xl z-[200] flex flex-col rounded-xl border-4 border-red-500">
                            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-lg">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold">Vuelos Cancelados</h2>
                                    <button
                                        onClick={() => setMostrarListaCancelados(false)}
                                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-sm text-red-100 mt-2">
                                    Total: {vuelosCancelados.length} {vuelosCancelados.length === 1 ? 'vuelo' : 'vuelos'}
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {vuelosCancelados.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-center">No hay vuelos cancelados</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {vuelosCancelados.sort((a, b) => b.fechaCancelacion.getTime() - a.fechaCancelacion.getTime()).map((vuelo) => (
                                            <div
                                                key={vuelo.id}
                                                className="bg-red-50 border-2 border-red-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            <span className="text-xs font-semibold text-red-600">CANCELADO</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-gray-600">Vuelo ID:</span>
                                                            <span className="text-lg font-bold text-gray-800">{vuelo.id}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-xs text-gray-600 mb-2 space-y-1">
                                                    <div className="flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span className="font-medium">Cancelado:</span>
                                                        <span>{vuelo.fechaCancelacion.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                        </svg>
                                                        <span className="font-medium">Paquetes afectados:</span>
                                                        <span>{vuelo.cantPaquetes}</span>
                                                    </div>
                                                    <div className="flex items-start gap-1 mt-2">
                                                        <svg className="w-3.5 h-3.5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <div>
                                                            <span className="font-medium">Motivo:</span>
                                                            <p className="text-gray-700 mt-0.5">{vuelo.motivoCancelacion}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3 pt-3 border-t border-red-200">
                                                    <div className="flex items-center gap-2 text-xs text-red-700">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                        <span className="font-semibold">Este vuelo no despegará</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Modal de cancelación individual */}
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

                    {/* Modal de cancelación masiva */}
                    {mostrarCancelacionMasiva && (
                        <CancelacionMasivaVuelo
                            onCancelar={handleCancelarVuelosMasivo}
                            onClose={() => setMostrarCancelacionMasiva(false)}
                        />
                    )}
                    
                    <div ref={bottomRef}></div>
                </div>
            )}
        </>
    );
};

export default Page;