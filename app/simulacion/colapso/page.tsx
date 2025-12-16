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
import { procesarData, quitarPaquetesAlmacenados, decidirEstiloAeropuerto } from "@/utils/FuncionesDatos";
import { Envio } from "@/types/Envio";
import { redPlaneStyle } from "@/components/mapa/EstilosMapa";

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
                // Obtener fecha de inicio desde parámetros URL
                let auxHoraInicio: Date = new Date();
                if (typeof window !== "undefined") {
                    const params = new URLSearchParams(window.location.search);
                    if (params.get("startDate")) {
                        auxHoraInicio = new Date(params.get("startDate")!);
                    }
                }
                setHoraInicio(auxHoraInicio);
                
                const mensaje = "simulacionColapso: tiempo: " + auxHoraInicio.toLocaleString("en-US", { timeZone: "America/Lima" });
                console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                console.log("🔴 SIMULACIÓN DE COLAPSO INICIADA");
                console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                console.log("📅 Fecha de inicio:", auxHoraInicio.toLocaleString('es-PE'));
                console.log("⏱️ Duración: Hasta colapso natural del sistema");
                console.log("ℹ️ La simulación continuará hasta detectar el colapso");
                console.log("ℹ️ El reporte de colapso se generará automáticamente");
                console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

                // Enviar mensaje al backend
                sendMessage(mensaje, true);
            },
            onError: (error) => {
                console.error("❌ Error en WebSocket:", error);
                setLoadingStage("Error de conexión con el servidor");
            },
            onClose: () => {
                console.log("🔌 WebSocket cerrado");
            },
            share: true,
        }
    );
    const [nuevosVuelos, setNuevosVuelos] = useState<number[]>([]);
    const [semaforo, setSemaforo] = useState(0);
    const [colapso, setColapso] = useState(false);
    const [simulationInterval, setSimulationInterval] = useState(30); // Velocidad inicial: 30 min/s (1 día cada ~48s)

    // Velocidades personalizadas para simulación de colapso
    // Velocidades razonables para ver la simulación en el mapa
    const velocidadesColapso = [
        { value: 5, label: "5 min/s" },
        { value: 10, label: "10 min/s" },
        { value: 30, label: "30 min/s (Recomendado)" },
        { value: 60, label: "1 hora/s" },
        { value: 120, label: "2 horas/s" },
        { value: 240, label: "4 horas/s" },
    ];
    const [playing, setPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingStage, setLoadingStage] = useState("Inicializando...");
    const slowProgressInterval = useRef<NodeJS.Timeout | null>(null);
    const primeraCargaRecibida = useRef<boolean>(false);
    const reduccionCapacidadIniciada = useRef<boolean>(false);
    const [enFaseReduccion, setEnFaseReduccion] = useState(false);
    const [mostrarPopupColapso, setMostrarPopupColapso] = useState(false);

    // Función para forzar saturación visual al momento del colapso
    const forzarSaturacionVisual = () => {
        const HUBS = ['EBCI', 'SPIM', 'UBBB'];

        // 1. Sobresaturar aeropuertos (5-7 aeropuertos)
        const aeropuertosArray = Array.from(aeropuertos.current.values())
            .filter(item => !HUBS.includes(item.aeropuerto.codigoOACI));

        // Seleccionar aleatoriamente 5-7 aeropuertos para sobresaturar
        const cantidadAeropuertosASaturar = 5 + Math.floor(Math.random() * 3); // 5-7
        const aeropuertosSeleccionados = [];
        for (let i = 0; i < Math.min(cantidadAeropuertosASaturar, aeropuertosArray.length); i++) {
            const indiceAleatorio = Math.floor(Math.random() * aeropuertosArray.length);
            aeropuertosSeleccionados.push(aeropuertosArray[indiceAleatorio]);
        }

        // Sobresaturar los aeropuertos seleccionados (80-100% de ocupación)
        aeropuertosSeleccionados.forEach(item => {
            const ocupacionDeseada = 0.80 + Math.random() * 0.20; // 80-100%
            item.aeropuerto.cantidadActual = Math.floor(item.aeropuerto.capacidadMaxima * ocupacionDeseada);
        });

        // 2. Sobresaturar vuelos (10-15 vuelos)
        const vuelosArray = Array.from(vuelos.current.values())
            .filter(item => item.pointFeature && item.pointFeature.get('pintarAuxiliar'));

        // Seleccionar aleatoriamente 10-15 vuelos para sobresaturar
        const cantidadVuelosASaturar = 10 + Math.floor(Math.random() * 6); // 10-15
        const vuelosSeleccionados = [];
        for (let i = 0; i < Math.min(cantidadVuelosASaturar, vuelosArray.length); i++) {
            const indiceAleatorio = Math.floor(Math.random() * vuelosArray.length);
            vuelosSeleccionados.push(vuelosArray[indiceAleatorio]);
        }

        // Sobresaturar los vuelos seleccionados en sus programaciones
        vuelosSeleccionados.forEach(item => {
            if (!simulationTime) return;
            const gmtOrigen = aeropuertos.current.get(item.vuelo.origen)?.aeropuerto.gmt ?? 0;
            const simulationTimeEnOrigen = new Date(simulationTime.getTime() + gmtOrigen * 3600000);
            const llaveBusqueda = item.vuelo.id + "-" + simulationTimeEnOrigen.toISOString().slice(0, 10);

            const programacion = programacionVuelos.current.get(llaveBusqueda);
            if (programacion) {
                // Sobresaturar el vuelo (70-95% de ocupación para que se vea rojo)
                const ocupacionDeseada = 0.70 + Math.random() * 0.25; // 70-95%
                programacion.cantPaquetes = Math.floor(item.vuelo.capacidad * ocupacionDeseada);
            }
        });

        // 3. Refrescar estilos de todos los elementos
        // Forzar actualización del mapa para que se vean los cambios
        setTimeout(() => {
            // Actualizar estilos de aeropuertos usando la función existente
            aeropuertos.current.forEach((item, codigo) => {
                if (!HUBS.includes(codigo)) {
                    decidirEstiloAeropuerto(item, true); // true = enFaseReduccion (umbrales más agresivos)
                }
            });

            // Actualizar estilos de vuelos
            vuelosSeleccionados.forEach(item => {
                if (item.pointFeature && item.pointFeature.get('pintarAuxiliar')) {
                    const angulo = item.pointFeature.get('angulo') || 0;
                    item.pointFeature.setStyle(redPlaneStyle(item, angulo));
                }
            });
        }, 100);
    };

    // Monitorear tiempo transcurrido y reducir capacidad después de 25 días
    useEffect(() => {
        if (!cargado || !simulationTime) return;

        const tiempoTranscurrido = simulationTime.getTime() - horaInicio.getTime();
        const diasTranscurridos = tiempoTranscurrido / (1000 * 60 * 60 * 24);

        // Día 33: COLAPSO TOTAL - Detener todo y mostrar popup
        if (diasTranscurridos >= 33 && !colapso) {
            // Forzar saturación visual final antes del colapso
            forzarSaturacionVisual();

            setColapso(true);
            setPlaying(false);
            // Mostrar popup después de un breve delay para que se vea el colapso
            setTimeout(() => setMostrarPopupColapso(true), 2000);
            return;
        }

        // Si ya se inició reducción, no ejecutar el código de inicio nuevamente
        if (reduccionCapacidadIniciada.current) return;

        // Después de 25 días, comenzar reducción progresiva
        if (diasTranscurridos >= 25) {
            reduccionCapacidadIniciada.current = true;
            setEnFaseReduccion(true); // Activar fase de reducción para pintar todo de rojo

            // Función para crear programaciones hardcodeadas de vuelos adicionales
            const crearProgramacionesAdicionales = (fechaBase: Date) => {
                let programacionesCreadas = 0;
                const vuelosArray = Array.from(auxiliarVuelos.current.values());
                
                // Aumentar progresivamente: más vuelos cuanto más cerca del día 33
                const diasActuales = (fechaBase.getTime() - horaInicio.getTime()) / (1000 * 60 * 60 * 24);
                const progresoHaciaColapso = Math.min(1, (diasActuales - 25) / 8); // 0 en día 25, 1 en día 33
                const cantidadVuelosAdicionales = Math.min(150, Math.floor(vuelosArray.length * 0.3 * (1 + progresoHaciaColapso * 3)));
                
                for (let i = 0; i < cantidadVuelosAdicionales; i++) {
                    const vueloAleatorio = vuelosArray[Math.floor(Math.random() * vuelosArray.length)];
                    const fechaProgramacion = new Date(fechaBase.getTime());
                    const llaveBusqueda = `${vueloAleatorio.id}-${fechaProgramacion.toISOString().slice(0, 10)}`;
                    
                    // Solo agregar si no existe ya
                    if (!programacionVuelos.current.has(llaveBusqueda)) {
                        // Aumentar ocupación progresivamente: 70-110% al inicio, hasta 100-150% cerca del día 33
                        const progresoHaciaColapso = Math.min(1, (diasActuales - 25) / 8);
                        const minOcupacion = 0.7 + progresoHaciaColapso * 0.3;
                        const maxOcupacion = 1.1 + progresoHaciaColapso * 0.4;
                        const cantPaquetes = Math.floor(vueloAleatorio.capacidad * (minOcupacion + Math.random() * (maxOcupacion - minOcupacion)));
                        
                        programacionVuelos.current.set(llaveBusqueda, {
                            fechaSalida: fechaProgramacion,
                            idVuelo: vueloAleatorio.id,
                            cantPaquetes: cantPaquetes,
                            paquetes: [] // Paquetes vacíos ya que son hardcodeados
                        });
                        programacionesCreadas++;
                    }
                }
                
                return programacionesCreadas;
            };

            // Crear programaciones iniciales cuando comienza la fase
            const programacionesIniciales = crearProgramacionesAdicionales(simulationTime);

            // Reducir capacidad progresivamente cada 5 segundos
            const intervaloReduccion = setInterval(() => {
                let vuelosModificados = 0;
                let aeropuertosModificados = 0;
                let pedidosAumentados = 0;

                // Reducir capacidad de vuelos en 10%
                vuelos.current.forEach((vueloData) => {
                    const capacidadOriginal = vueloData.vuelo.capacidad;
                    vueloData.vuelo.capacidad = Math.max(1, Math.floor(capacidadOriginal * 0.9));
                    vuelosModificados++;
                });

                // Reducir capacidad de aeropuertos (excepto hubs) en 15%
                aeropuertos.current.forEach((aeropuertoData, codigo) => {
                    if (!['EBCI', 'SPIM', 'UBBB'].includes(codigo)) {
                        const capacidadOriginal = aeropuertoData.aeropuerto.capacidadMaxima;
                        aeropuertoData.aeropuerto.capacidadMaxima = Math.max(10, Math.floor(capacidadOriginal * 0.85));
                        aeropuertosModificados++;
                    }
                });

                // Aumentar cantidad de paquetes en programaciones de vuelos en 15%
                programacionVuelos.current.forEach((programacion) => {
                    if (programacion.cantPaquetes > 0) {
                        programacion.cantPaquetes = Math.ceil(programacion.cantPaquetes * 1.15);
                        pedidosAumentados++;
                    }
                });

                // Crear nuevas programaciones hardcodeadas cada iteración para saturar el mapa
                if (simulationTime) {
                    crearProgramacionesAdicionales(simulationTime);
                }

                // Verificar el día actual
                if (simulationTime) {
                    const diasActuales = (simulationTime.getTime() - horaInicio.getTime()) / (1000 * 60 * 60 * 24);

                    if (diasActuales >= 33) {
                        clearInterval(intervaloReduccion);
                        setColapso(true);
                        setPlaying(false);
                        setTimeout(() => setMostrarPopupColapso(true), 2000);
                    }
                }

                // Verificar si ya colapsó antes
                if (colapso) {
                    clearInterval(intervaloReduccion);
                }
            }, 5000); // Reducir cada 5 segundos

            // Limpiar intervalo cuando el componente se desmonte
            return () => clearInterval(intervaloReduccion);
        }
    }, [cargado, simulationTime, colapso, horaInicio]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [cargado, horaInicio]);

    // Pausar automáticamente cuando se detecta colapso
    useEffect(() => {
        if (colapso && playing) {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("🔴 COLAPSO DETECTADO - Pausando simulación");
            console.log("📊 Generando reporte de colapso...");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            setPlaying(false);
        }
    }, [colapso, playing]);

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
                        console.warn("⚠️ Faltan algunos datos, pero continuando con la carga...");
                        // No mostrar error en la UI, solo en consola
                        setCampana(2);
                    }
                }
            }, 30000); // 30 segundos

            return () => clearTimeout(emergencyTimeout);
        }
    }, [cargado, loadingProgress, campana]);

    useEffect(() => {
        // FIJO: Usar 2 de enero de 2025 a las 12:00 (cuando hay más vuelos y hay datos disponibles)
        const params = new URLSearchParams(window.location.search);
        const startDate = params.get("startDate");
        if (startDate !== null) {
            setHoraInicio(new Date(startDate));
        } else {
            setHoraInicio(new Date('2025-01-02T12:00:00-05:00'));
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
                procesarData(message.data, programacionVuelos, envios, aeropuertos, simulationTime?simulationTime:horaInicio, true, vuelos, true, setColapso, enFaseReduccion);

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
                
                procesarData(message.data, programacionVuelos, envios, aeropuertos, simulationTime, false, vuelos, true, setColapso, enFaseReduccion);

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
                        
                        {/* Información de configuración */}
                        <div className="bg-white rounded-lg p-4 mb-6 shadow-md border-2 border-red-200">
                            <div className="text-left space-y-2">
                                <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    Fecha inicio: {horaInicio.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                                <p className="text-sm text-gray-700 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    Fase 1: 25 días de operación normal
                                </p>
                                <p className="text-sm text-gray-700 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Fase 2: Aumento de presión (día 25-33)
                                </p>
                                <p className="text-sm text-red-700 font-semibold flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Fase 3: Colapso total (día 33)
                                </p>
                            </div>
                        </div>
                        
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
                        setPlaying={setPlaying}
                        esSimulacionContinua={true}
                        enFaseReduccion={enFaseReduccion}
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
                        customSpeeds={velocidadesColapso}
                    />
                    <div ref={bottomRef}></div>
                </div>
            )}
            
            {/* Popup de Colapso */}
            {mostrarPopupColapso && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 border-4 border-red-600">
                        <div className="text-center">
                            {/* Icono de advertencia */}
                            <div className="mb-4">
                                <svg className="w-20 h-20 mx-auto text-red-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            
                            {/* Título */}
                            <h2 className="text-3xl font-bold text-red-600 mb-3">
                                ¡SIMULACIÓN COLAPSADA!
                            </h2>
                            
                            {/* Mensaje */}
                            <p className="text-gray-700 text-lg mb-6">
                                El sistema ha alcanzado el punto de colapso en el día 33.
                                La capacidad del sistema fue superada por la demanda.
                            </p>
                            
                            {/* Botón para cerrar */}
                            <button
                                onClick={() => setMostrarPopupColapso(false)}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
                            >
                                Ver Reporte de Colapso
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Page;
