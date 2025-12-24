"use client";

import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Mapa from "@/components/mapa/Mapa";
import axios from "axios";
import { Vuelo } from "@/types/Vuelo";
import { Aeropuerto } from "@/types/Aeropuerto";
import { conectarAWebsocket, enviarMensaje } from "@/utils/FuncionesWebsocket";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { ProgramacionVuelo } from "@/types/ProgramacionVuelo";
import { actualizarDataReal, procesarDataReal, quitarPaquetesAlmacenados } from "@/utils/FuncionesDatos";
import { Envio } from "@/types/Envio";
import CancelacionVuelo from "@/components/CancelacionVuelo";
import { X } from "lucide-react";

type MessageData = {
    data: Array<any>;
    metadata: string;
};

const Page = () => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const apiURL = process.env.NEXT_PUBLIC_MORAPACK_API_URL;
    const vuelos = useRef
        Map
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
    const auxiliarVuelos = useRef<Map<number, Vuelo>>(new Map());
    const envios = useRef<Map<string, Envio>>(new Map());
    const aeropuertos = useRef<Map<string, {aeropuerto: Aeropuerto; pointFeature: any}>>(new Map());
    const [cargado, setCargado] = useState(false);
    const [horaInicio, setHoraInicio] = useState(new Date());
    const [campana, setCampana] = useState(0);
    const [simulationTime, setSimulationTime] = useState<Date | null>(null);
    const [colapso, setColapso] = useState(false);
    const [mostrarCancelacion, setMostrarCancelacion] = useState(false);
    
    const { sendMessage, lastMessage } = useWebSocket(
        process.env.NEXT_PUBLIC_MORAPACK_WS_URL + "/socket",
        {
            share: true,
<<<<<<< Updated upstream
        }
=======
        },
        preloadDone
>>>>>>> Stashed changes
    );
    const [nuevosVuelos, setNuevosVuelos] = useState<number[]>([]);
    const [semaforo, setSemaforo] = useState(0);
    const initializedRef = useRef(false);

<<<<<<< Updated upstream
    const handleCancelarVuelo = (idVuelo: string, archivo?: File) => {
        if (archivo) {
            console.log("Procesando archivo de cancelaciones:", archivo.name);
        } else {
            console.log("Cancelando vuelo ID:", idVuelo);
            sendMessage(`cancelarVuelo: ${idVuelo}`);
        }
    };
=======
    // Estados para paneles y botones de cancelación
    const [mostrarListaVuelos, setMostrarListaVuelos] = useState(false);
    const [mostrarListaCancelados, setMostrarListaCancelados] = useState(false);
    const [mostrarCancelacion, setMostrarCancelacion] = useState(false);
    const [mostrarCancelacionMasiva, setMostrarCancelacionMasiva] = useState(false);
    const [vueloSeleccionado, setVueloSeleccionado] = useState<string>("");
    const [vuelosCancelados, setVuelosCancelados] = useState<any[]>([]);

    // Handler para seleccionar un vuelo desde la lista
    const handleSeleccionarVuelo = (idVuelo: string) => {
        setVueloSeleccionado(idVuelo);
        setMostrarCancelacion(true);
        setMostrarListaVuelos(false);
        setMostrarCancelacionMasiva(false);
        setMostrarListaCancelados(false);
    };

    // Handler para cancelar un vuelo individual
    const handleCancelarVuelo = (idVuelo: string, archivo?: File) => {
        if (archivo) {
            console.log("Procesando archivo de cancelaciones:", archivo.name);
            return;
        }

        try {
            const vueloId = parseInt(idVuelo);
            
            // Buscar el vuelo en programacionVuelos
            let programacion = programacionVuelos.current.get(idVuelo);
            if (!programacion) {
                programacion = programacionVuelos.current.get(vueloId.toString());
            }
            
            // Verificar que no esté ya cancelado
            const yaCancelado = vuelosCancelados.some(v => v.id === vueloId);
            
            if (yaCancelado) {
                alert(`El vuelo #${vueloId} ya fue cancelado`);
                setMostrarCancelacion(false);
                setVueloSeleccionado("");
                return;
            }

            const cantPaquetes = programacion?.cantPaquetes || 0;
            
            // Agregar a la lista de cancelados
            setVuelosCancelados(prev => [
                ...prev,
                {
                    id: vueloId,
                    fechaCancelacion: new Date(),
                    motivoCancelacion: "Cancelación manual",
                    cantPaquetes: cantPaquetes
                }
            ]);
            
            // Mostrar mensaje de éxito
            alert(`Vuelo #${vueloId} cancelado exitosamente`);
            
            // Cerrar modal y limpiar selección
            setMostrarCancelacion(false);
            setVueloSeleccionado("");
        } catch (error) {
            console.error("Error al cancelar vuelo:", error);
            alert("Error al cancelar el vuelo");
            setMostrarCancelacion(false);
            setVueloSeleccionado("");
        }
    };

    // Handler para cancelación masiva
    const handleCancelarVuelosMasivo = async (archivo: File) => {
        try {
            const text = await archivo.text();
            const lines = text.split('\n').map(line => line.trim()).filter(line => line);
            
            // Formato: ORIGEN-DESTINO-HORA_SALIDA-HORA_LLEGADA-ID
            const idsVuelos = lines.map(line => {
                const parts = line.split('-');
                return parts.length >= 5 ? parts[4] : line;
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
            
            const idsUnicos = new Set<number>();
            const idsRepetidosEnArchivo = new Set<number>();
            
            idsVuelos.forEach(id => {
                const vueloId = parseInt(id);
                if (!isNaN(vueloId)) {
                    // Verificar duplicados dentro del archivo
                    if (idsUnicos.has(vueloId)) {
                        idsRepetidosEnArchivo.add(vueloId);
                        return;
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
            let mensaje = `Cancelación masiva completada:\n\n`;
            mensaje += `• ${vuelosCanceladosCount} vuelos cancelados\n`;
            mensaje += `• ${totalPaquetesAfectados} paquetes afectados\n`;
            if (vuelosDuplicados > 0) {
                mensaje += `• ${vuelosDuplicados} IDs repetidos en el archivo (ignorados)\n`;
            }
            mensaje += `\nArchivo: ${archivo.name}`;
            
            alert(mensaje);
            setMostrarCancelacionMasiva(false);
        } catch (error) {
            console.error("Error al cancelar vuelos masivamente:", error);
            alert("Error al procesar el archivo de cancelaciones");
        }
    };

    // Implementación real para mostrar vuelos programados igual que en colapso
    const getVuelosProgramados = (): Array<{
        id: number;
        origen: string;
        destino: string;
        fechaSalida: Date;
        cantPaquetes: number;
    }> => {
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
                        origen: `Vuelo ${vueloId}`,
                        destino: "",
                        fechaSalida: fechaSalida,
                        cantPaquetes: programacion.cantPaquetes
                    });
                }
            }
        });
        return vuelosProgramados.sort((a, b) => a.fechaSalida.getTime() - b.fechaSalida.getTime());
    };
>>>>>>> Stashed changes

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [cargado]);

    async function fetchAeropuertos() {
        const response = await axios.get(`${apiURL}/aeropuerto`);
        const auxAeropuertos = new Map<string, { aeropuerto: Aeropuerto; pointFeature: any }>();
        response.data.forEach((aeropuerto: Aeropuerto) => {
            aeropuerto.paquetes = [];
            aeropuerto.cantidadActual = 0;
            auxAeropuertos.set(aeropuerto.codigoOACI, { aeropuerto: aeropuerto, pointFeature: null });
        });
        return auxAeropuertos;
    }
    
    async function fetchVuelos() {
        const response = await axios.get(`${apiURL}/vuelo`);
        const auxVuelos = new Map<number, Vuelo>();
        response.data.forEach((vuelo: Vuelo) => {
            auxVuelos.set(vuelo.id, vuelo);
        });
        return auxVuelos;
    }

    useEffect(() => {
        if (!initializedRef.current) {
            const initializeData = async () => {
                setHoraInicio(new Date());
    
                try {
                    const [auxAeropuertos, vuelos] = await Promise.all([fetchAeropuertos(), fetchVuelos()]);
                    console.log("Aeropuertos cargados: ");
                    aeropuertos.current = auxAeropuertos;
                    console.log("Vuelos auxiliares cargados: ");
                    auxiliarVuelos.current = vuelos;
    
                    setCampana((prev) => prev + 2);
                } catch (error) {
                    console.error("Error cargando datos: ", error);
                }
            };
            initializeData();
            initializedRef.current = true;
        }
    }, []);

    useEffect(() => {
        console.log("Campana: ", campana);
        if(campana ==  2) {
            let auxHoraInicio: Date = new Date();
            sendMessage("vuelosEnVivo: tiempo: " +auxHoraInicio.toLocaleString("en-US", {timeZone: "America/Lima",}),
                    true
            );
            console.log("Enviando mensaje de tiempo con campana 2");
        }
<<<<<<< Updated upstream
        if (campana ==3 ) {
=======

        return () => {
            if (slowProgressInterval.current) {
                clearInterval(slowProgressInterval.current);
            }
        };
    }, [loadingProgress, cargado]);

    useEffect(() => {
        if (!preloadDone) return;
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
                    const auxAeropuertos = new Map<string, {aeropuerto: Aeropuerto; pointFeature: any}>();
                    response.data.forEach((aeropuerto: Aeropuerto) => {
                        aeropuerto.paquetes = [];
                        aeropuerto.cantidadActual = 0;
                        auxAeropuertos.set(aeropuerto.codigoOACI, {aeropuerto: aeropuerto, pointFeature: null});
                    });
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
>>>>>>> Stashed changes
            console.log("Campana sonando");
            if (cargado) {
                return;
            }
            setCargado(true);
            console.log("Cargando datos");
            if (typeof window !== "undefined") {
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
                    setCampana((prev) => prev + 1);
                    console.log("Vuelos cargados: ", vuelos.current.size);
                }
            }
            if(message.metadata.includes("primeraCarga")) {
                console.log("Mensaje de primera carga");
                console.log("Datos recibidos: ", message.data);
<<<<<<< Updated upstream
                procesarDataReal(message.data, programacionVuelos, envios, aeropuertos, simulationTime?simulationTime:horaInicio, true, auxiliarVuelos, setColapso);
=======
                setLoadingProgress(90);
                setLoadingStage("Procesando rutas de envíos...");
                procesarData(message.data, programacionVuelos, envios, aeropuertos, simulationTime?simulationTime:horaInicio, true, vuelos, true, () => {});
>>>>>>> Stashed changes
            }
            if (message.metadata.includes("nuevosEnvios")) {
                console.log(message.data);
<<<<<<< Updated upstream
                procesarDataReal(message.data, programacionVuelos, envios, aeropuertos, simulationTime, false, auxiliarVuelos, setColapso);
            }
            if (message.metadata.includes("enviosEnOperacion")) {
                actualizarDataReal(message.data, programacionVuelos, envios, aeropuertos, simulationTime?simulationTime:horaInicio, false, vuelos);
=======
                procesarData(message.data, programacionVuelos, envios, aeropuertos, simulationTime, false, vuelos, true, () => {});
            }
            if (message.metadata.includes("nuevoPedido")) {
                console.log("Nuevo pedido registrado:", message.data);
                const pedidoInfo = message.data[0];
                setNewOrderNotification({
                    origen: pedidoInfo.origen,
                    destino: pedidoInfo.destino,
                    paquetes: pedidoInfo.cantidadPaquetes
                });
                setToastMessage(`✅ Nuevo pedido registrado: ${pedidoInfo.origen} → ${pedidoInfo.destino} (${pedidoInfo.cantidadPaquetes} paquetes)`);
                setShowToast(true);
                
                setTimeout(() => {
                    setNewOrderNotification(null);
                }, 8000);
>>>>>>> Stashed changes
            }
        }
    }, [lastMessage]);

    
    return (
        <>
<<<<<<< Updated upstream
            {cargado && (
                <>
                    <div className="pb-4">
                        <Mapa
                            vuelos={vuelos}
                            aeropuertos={aeropuertos}
                            programacionVuelos={programacionVuelos}
                            envios={envios}
                            simulationInterval={1/60}
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
=======
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
                    <SimControls />
                    {/* Botones verticales en la esquina inferior izquierda */}
                    <div className="fixed bottom-8 left-8 z-[85] flex flex-col gap-4 items-start">
                        <button
                            onClick={() => {
                                setMostrarCancelacionMasiva(true);
                                setMostrarCancelacion(false);
                                setMostrarListaVuelos(false);
                                setMostrarListaCancelados(false);
                            }}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 py-4 shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                            title="Cancelación masiva por archivo"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-semibold">Cancelación Masiva</span>
                        </button>
                        <button
                            onClick={() => {
                                setMostrarListaVuelos(!mostrarListaVuelos);
                                setMostrarCancelacion(false);
                                setMostrarCancelacionMasiva(false);
                                if (!mostrarListaVuelos) setMostrarListaCancelados(false);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 py-4 shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                            title="Ver vuelos programados"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="font-semibold">Vuelos Programados</span>
                        </button>
                        <button
                            onClick={() => {
                                setMostrarListaCancelados(!mostrarListaCancelados);
                                setMostrarCancelacion(false);
                                setMostrarCancelacionMasiva(false);
                                if (!mostrarListaCancelados) setMostrarListaVuelos(false);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-4 shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                            title="Ver vuelos cancelados"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="font-semibold">Cancelados ({vuelosCancelados.length})</span>
                        </button>
                    </div>
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
                                            <div key={vuelo.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300">
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
                                                        <span>{vuelo.fechaSalida?.toLocaleString?.() ?? ''}</span>
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
                                        {vuelosCancelados.sort((a, b) => (b.fechaCancelacion?.getTime?.() ?? 0) - (a.fechaCancelacion?.getTime?.() ?? 0)).map((vuelo) => (
                                            <div key={vuelo.id} className="bg-red-50 border-2 border-red-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
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
                                                        <span>{vuelo.fechaCancelacion?.toLocaleString?.() ?? ''}</span>
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
                    <BotonRegistroPedido 
                        onPedidoRegistrado={(origen: string, destino: string, paquetes: number) => {
                            setToastMessage(`✅ Pedido registrado exitosamente: ${origen} → ${destino} (${paquetes} paquetes)`);
                            setShowToast(true);
                            setNewOrderNotification({ origen, destino, paquetes });
                            sendMessage(JSON.stringify({
                                tipo: "nuevoPedido",
                                data: { origen, destino, cantidadPaquetes: paquetes }
                            }), false);
                            setTimeout(() => {
                                setNewOrderNotification(null);
                            }, 8000);
                        }}
                    />
                    <PedidosPendientes apiURL={apiURL || ""} />
                    <div ref={bottomRef}></div>
                </div>
            )}
            {showToast && (
                <ToastNotification
                    message={toastMessage}
                    type="pedido"
                    duration={5000}
                    visible={showToast}
                    onClose={() => setShowToast(false)}
                />
            )}
            {newOrderNotification && (
                <NewOrderIndicator
                    origen={newOrderNotification.origen}
                    destino={newOrderNotification.destino}
                    paquetes={newOrderNotification.paquetes}
                />
>>>>>>> Stashed changes
            )}
        </>
    );
};

export default Page;