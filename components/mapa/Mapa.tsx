"use client";
import DatosVuelo from "@/components/mapa/DatosVuelo";
import FinSemanal from "@/components/mapa/FinSemanal";
import PedidosPorDia from "@/components/mapa/PedidosPorDia";
import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import { Map as OLMap } from "ol";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import { LineString, Point } from "ol/geom";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Coordinate } from "ol/coordinate";
import { fromLonLat, toLonLat } from "ol/proj";

import {
    planeStyle,
    airportStyle,
    selectedPlaneStyle,
    invisibleStyle,
    selectedLineStyle,
    dinamicPlaneStyle,
    dinamicSelectedPlaneStle,
    hubAirportStyle,
} from "./EstilosMapa";
import { Vuelo } from "@/types/Vuelo";
import { Aeropuerto } from "@/types/Aeropuerto";
import {
    coordenadasIniciales,
    crearLineaDeVuelo,
    crearPuntoDeVuelo,
    seleccionarVuelo,
    seleccionarAeropuerto,
    updateCoordinates,
    seleccionarElemento,
    desactivarEnvio,
    crearPuntoDeVueloReal,
} from "@/utils/FuncionesMapa";
import { ProgramacionVuelo } from "@/types/ProgramacionVuelo";
import { Envio } from "@/types/Envio";
import { agregarPaquetesAlmacen, agregarPaquetesAlmacenReal, capacidadAlmacenesUsada, contarVuelos, decidirEstiloAeropuerto, limpiarMapasDeDatos } from "@/utils/FuncionesDatos";

type MapaProps = {
    vuelos: React.RefObject<
        Map<
            number,
            {
                vuelo: Vuelo;
                pointFeature: any;
                lineFeature: any;
                routeFeature: any;
            }
        >
    >;
    aeropuertos: React.MutableRefObject<Map<string, { aeropuerto: Aeropuerto; pointFeature: any }>>;
    programacionVuelos: React.MutableRefObject<Map<string, ProgramacionVuelo>>;
    envios: React.MutableRefObject<Map<string, Envio>>;
    simulationInterval: number;
    horaInicio: Date;
    nuevosVuelos: number[];
    semaforo: number;
    setSemaforo: React.Dispatch<React.SetStateAction<number>>;
    sendMessage: (message: string, keep: boolean) => void;
    onSimulationTimeChange: any;
    auxiliarVuelos?: React.MutableRefObject<Map<number, Vuelo>>;
    colapso: boolean;
    setColapso: React.Dispatch<React.SetStateAction<boolean>>;
    setPlaying?: React.Dispatch<React.SetStateAction<boolean>>;
};

const Mapa = ({
    vuelos,
    aeropuertos,
    programacionVuelos,
    envios,
    simulationInterval,
    horaInicio = new Date(),
    nuevosVuelos,
    semaforo,
    setSemaforo,
    sendMessage,
    onSimulationTimeChange,
    auxiliarVuelos,
    colapso, 
    setColapso,
    setPlaying,
}: MapaProps) => {
    const mapRef = useRef<OLMap | null>(null);
    const vectorSourceRef = useRef(new VectorSource());
    const [simulationTime, setSimulationTime] = useState(new Date(horaInicio));
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedVuelo, setSelectedVuelo] = useState<Vuelo | null>(null);
    const [selectedAeropuerto, setSelectedAeropuerto] = useState<Aeropuerto | null>(null);
    const [selectedEnvio, setSelectedEnvio] = useState<Envio | null>(null);
    const selectedFeature = useRef<Feature | null>(null);
    const vistaActual = useRef<View | null>(null);
    const fechaFinSemana = new Date(horaInicio.getTime() + 7 * 24 * 60 * 60 * 1000); //suma 7 dias
    const [vuelosABorrar, setVuelosABorrar] = useState<number[]>([]);
    const [mostrarFinSemanal, setMostrarFinSemanal] = useState(false);
    const aBorrarEnvios = useRef<string[]>([]);
    const vuelosEnElAire = useRef<number>(0);
    const [mostrarInfoSidebar, setMostrarInfoSidebar] = useState(false);
    const [mostrarPedidosPorDia, setMostrarPedidosPorDia] = useState(false);
    const [aeropuertosCongelados, setAeropuertosCongelados] = useState<Map<string, {aeropuerto: Aeropuerto; pointFeature: any}> | null>(null);
    const [simulacionFinalizada, setSimulacionFinalizada] = useState(false);

    useEffect(() => {
        if (!mapRef.current) {
            const initialCoordinates = fromLonLat([0, 0]);
            mapRef.current = new OLMap({
                target: "map",
                layers: [
                    new TileLayer({
                        source: new OSM(),
                    }),
                ],
                view: new View({
                    center: initialCoordinates,
                    zoom: 0,
                }),
            });
            vistaActual.current = mapRef.current.getView();
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined" || !mapRef.current) {
            return;
        }

        let auxLineFeatures: any[] = [];
        vuelos.current?.forEach((item) => {
            const feature = crearLineaDeVuelo(aeropuertos.current, item);
            item.lineFeature = feature;
            auxLineFeatures.push(feature);
        });

        let auxPointFeatures: any[] = [];
        let cuenta=0;
        vuelos.current?.forEach((item) => {
            //const isSelected = selectedFeature != null && selectedFeature.get("vueloId") === item.vuelo.id;
            const objeto:{feature:any, tieneCarga:boolean} =  simulationInterval!==1/60?crearPuntoDeVuelo(
                aeropuertos.current,
                item,
                simulationTime,
                programacionVuelos.current,
                setColapso
            ) : crearPuntoDeVueloReal(
                aeropuertos.current,
                item,
                simulationTime,
                programacionVuelos.current,
                setColapso
            );
            item.pointFeature = objeto.feature;
            auxPointFeatures.push(objeto.feature)
            if(objeto.tieneCarga) cuenta++;
        });
        vuelosEnElAire.current = cuenta;

        const HUBS = ['EBCI', 'SPIM', 'UBBB'];
        const aeropuertoFeatures = Array.from(aeropuertos.current.values()).map(
            (item) => {
                const point = new Point(
                    fromLonLat([item.aeropuerto.longitud, item.aeropuerto.latitud])
                );
                const feature = new Feature({
                    geometry: point,
                });
                feature.set('aeropuertoId', item.aeropuerto.codigoOACI);// era OACI y no id, 1h para darme cuenta
                
                // Aplicar estilo especial para los hubs
                if (HUBS.includes(item.aeropuerto.codigoOACI)) {
                    feature.setStyle(hubAirportStyle);
                }
                
                aeropuertos.current.set(item.aeropuerto.codigoOACI, {...item, pointFeature: feature});
                decidirEstiloAeropuerto(aeropuertos.current.get(item.aeropuerto.codigoOACI));
                return feature;
            }
        );

        console.log(
            "Adding # features: ",
            auxLineFeatures.length,
            auxPointFeatures.length,
            aeropuertoFeatures.length
        );
        vectorSourceRef.current.clear(); // Clear the existing features
        vectorSourceRef.current.addFeatures([
            ...auxLineFeatures,
            ...auxPointFeatures,
            ...aeropuertoFeatures,
        ]);

        const vectorLayer = new VectorLayer({
            source: vectorSourceRef.current,
        });

        mapRef.current.addLayer(vectorLayer);

        if (mapRef.current) {
            const clickHandler = (event: any) => {
                const feature = mapRef.current?.getFeaturesAtPixel(event.pixel)[0];
                // console.log("Feature clicked: ", feature);
                desactivarEnvio(aBorrarEnvios, aeropuertos.current, vuelos);
                if (feature) {
                    const vueloId = feature.get("vueloId");
                    const aeropuertoId = feature.get("aeropuertoId");
                    seleccionarElemento(
                        vueloId,
                        aeropuertoId,
                        setSelectedVuelo,
                        setSelectedAeropuerto,
                        setSelectedEnvio,
                        selectedFeature,
                        vuelos,
                        aeropuertos,
                        feature,
                    );
                }
                else {
                    setSelectedVuelo(null);
                    setSelectedAeropuerto(null);
                    setSelectedEnvio(null);
                    if (selectedFeature.current != null) {
                        if (selectedFeature.current.get("vueloId")) {
                            selectedFeature.current.setStyle(selectedFeature.current.get("estiloAnterior"));
                            vuelos.current?.get(selectedFeature.current.get("vueloId"))?.lineFeature.setStyle(invisibleStyle);
                        } else if (selectedFeature.current.get("aeropuertoId")) {
                            selectedFeature.current.setStyle(selectedFeature.current.get("estiloAnterior"));
        
                        }
                    }
                }
            };
    
            mapRef.current.on("click", clickHandler);
    
            // Cleanup function to remove the event listener when the component is unmounted
            return () => {
                if (mapRef.current) {
                    mapRef.current.un("click", clickHandler);
                }
            };
        }
    }, [mapRef]);

    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date());
        };
        const intervalId = setInterval(updateTime, 1000); // Actualiza cada segundo
        return () => clearInterval(intervalId); // Limpiar el intervalo cuando el componente se desmonte
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setSimulationTime((prevSimulationTime) => {
                const newTime = new Date(
                    prevSimulationTime.getTime() +
                        simulationInterval * 60 * 1000
                );
                
                // Usar el nuevo tiempo para las notificaciones
                onSimulationTimeChange(newTime);
                if (sendMessage) {
                    const limaTime = newTime.toLocaleString("en-US", {
                        timeZone: "America/Lima",
                    });
                    sendMessage("mensaje: tiempo: " + limaTime, true);
                }
                
                return newTime;
            });
        }, 1000);

        // Clean up interval on unmount
        return () => clearInterval(intervalId);
    }, [simulationInterval, sendMessage, onSimulationTimeChange]);

    useEffect(() => {
        if((simulationTime.getTime() > fechaFinSemana.getTime() && simulationInterval!==1/60) || colapso){
            console.log("Fin de simulación detectado");
            
            // Congelar los aeropuertos solo si no es colapso (simulación semanal)
            if (!colapso && !simulacionFinalizada) {
                console.log("Congelando estado de aeropuertos para simulación semanal");
                // Crear una copia profunda de los aeropuertos
                const copiaAeropuertos = new Map<string, {aeropuerto: Aeropuerto; pointFeature: any}>();
                aeropuertos.current.forEach((value, key) => {
                    copiaAeropuertos.set(key, {
                        aeropuerto: { ...value.aeropuerto },
                        pointFeature: value.pointFeature
                    });
                });
                setAeropuertosCongelados(copiaAeropuertos);
                setSimulacionFinalizada(true);
                
                // Pausar la simulación semanal cuando termina
                if (setPlaying) {
                    console.log("Pausando simulación semanal automáticamente");
                    setPlaying(false);
                }
            }
            
            // Delay más largo para asegurar que todos los datos se hayan procesado
            // Especialmente importante cuando hay colapso y a velocidades altas
            const delayTime = colapso ? 1500 : 500;
            setTimeout(() => {
                console.log("Mostrando reporte final después del delay");
                setMostrarFinSemanal(true);
            }, delayTime);
        }
    }, [simulationTime, simulationInterval, colapso, fechaFinSemana, simulacionFinalizada, setPlaying]);

    useEffect(() => {
        // console.log("Updating coordinates con tiempo: ", simulationTime);

        if (vectorSourceRef.current.getFeatures().length > 0) {
            const aBorrar: number[] = updateCoordinates(
                vuelos.current,
                simulationTime
            );
            // console.log("aBorrar: ", aBorrar);
            setVuelosABorrar(aBorrar);
        }
    }, [simulationTime]);

    // useEffect(() => {
    //     const timeoutId = setInterval(() => limpiarMapasDeDatos(programacionVuelos, envios, new Date(simulationTime.getTime())), 360 * 1000); // 360 seconds = 6 minutes
    //     return () => clearInterval(timeoutId); 
    // }, []);

    useEffect(() => {
        function processItem(item: any, idVuelo: number) {
            if (item) {
                vectorSourceRef.current.removeFeature(item.pointFeature);
                vectorSourceRef.current.removeFeature(item.lineFeature);
                item.pointFeature = null;
                item.lineFeature = null;
                item.routeFeature = null;
                let result=false;
                try {
                    if(simulationInterval !=1/60){
                     result = agregarPaquetesAlmacen(idVuelo, programacionVuelos, aeropuertos, simulationTime, envios, vuelos, setColapso) ?? false;
                    }
                    else{
                        result = agregarPaquetesAlmacenReal(idVuelo, programacionVuelos, aeropuertos, simulationTime, envios, vuelos, setColapso) ?? false;
                    }
                } catch (error) {
                    console.error('Promesa rechazada: ', error);
                }
                vuelos.current?.delete(idVuelo);
                return result;
            }
            return false;
        }

        function processItems(aBorrar: number[]) {
            let cuenta=0;
            for (let i = 0; i < aBorrar.length; i++) {
                const idVuelo = aBorrar[i];
                const item = vuelos.current?.get(idVuelo);
                const result= processItem(item, idVuelo);
                if(result) cuenta++;
            }
            // console.log("Restando vuelos en el aire: %d de %d", cuenta, aBorrar.length);
            vuelosEnElAire.current = vuelosEnElAire.current - cuenta;
        }

        if(vuelosABorrar.length > 0){
             processItems(vuelosABorrar);
             for (let key in aeropuertos.current.keys()) {
                decidirEstiloAeropuerto(aeropuertos.current.get(key));
            } 
        }
    } ,[vuelosABorrar]);

    useEffect(() => {
        if (nuevosVuelos.length > 0 && semaforo > 0) {
            // console.log("Nuevos vuelos: ", nuevosVuelos);
            let cuenta=0;
            for (let i = 0; i < nuevosVuelos.length; i++) {
                const idVuelo = nuevosVuelos[i];
                const item = vuelos.current?.get(idVuelo);
                if (item) {
                    item.lineFeature = crearLineaDeVuelo(aeropuertos.current, item);
                    
                    let objeto:{feature:any, tieneCarga:boolean}= simulationInterval!==1/60?crearPuntoDeVuelo(
                        aeropuertos.current,
                        item,
                        simulationTime,
                        programacionVuelos.current,
                        setColapso
                    ) : crearPuntoDeVueloReal(
                        aeropuertos.current,
                        item,
                        simulationTime,
                        programacionVuelos.current,
                        setColapso
                    );
                    item.pointFeature = objeto.feature;
                    if(objeto.tieneCarga) cuenta++;
                    vectorSourceRef.current.addFeature(item.pointFeature);
                    vectorSourceRef.current.addFeature(item.lineFeature);
                }
            }
            // console.log("Sumando vuelos en el aire: %d de %d", cuenta, nuevosVuelos.length);
            vuelosEnElAire.current = vuelosEnElAire.current + cuenta;
            setSemaforo(semaforo - 1);
        }
    }),[nuevosVuelos, semaforo];

    const enviosEnElAire = 1420;

    return (
        <div id="map" style={{ width: "100%", height: "100vh", position: "relative" }}>
            {" "}
            <div>
                <DatosVuelo vuelo={selectedVuelo} aeropuerto={selectedAeropuerto} programacionVuelos={programacionVuelos} simulationTime={simulationTime}
                    envios={envios} aeropuertos={aeropuertos} envio = {selectedEnvio} setEnvio={setSelectedEnvio} setVuelo={setSelectedVuelo} setAeropuerto={setSelectedAeropuerto} selectedFeature={selectedFeature} aBorrarEnvios={aBorrarEnvios} mapRef={mapRef} vuelos = {vuelos} simulation = {simulationInterval!==1/60} auxiliarVuelos={auxiliarVuelos}
                />
                {mostrarFinSemanal && <FinSemanal programacionVuelos={programacionVuelos} vuelos={vuelos} colapso={colapso}/>}

                {/* Botones en esquina superior derecha */}
                <div className="fixed top-20 right-8 z-[60] flex flex-col gap-3">
                    {/* Botón "Más información" - solo visible cuando está cerrado */}
                    {!mostrarInfoSidebar && (
                        <button
                            onClick={() => setMostrarInfoSidebar(true)}
                            className="bg-primary text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary-600 transition-colors duration-200 flex items-center gap-2"
                        >
                            <span className="font-medium">Más información</span>
                            <span className="text-sm">▶</span>
                        </button>
                    )}

                    {/* Botón "Pedidos por día" */}
                    <button
                        onClick={() => setMostrarPedidosPorDia(true)}
                        className="bg-info text-white px-4 py-2 rounded-lg shadow-lg hover:bg-info-dark transition-colors duration-200 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Pedidos por día</span>
                    </button>
                </div>

                {/* Panel de Pedidos por Día */}
                <PedidosPorDia
                    envios={envios}
                    vuelos={vuelos}
                    programacionVuelos={programacionVuelos}
                    simulationTime={simulationTime}
                    startTime={horaInicio}
                    isOpen={mostrarPedidosPorDia}
                    onClose={() => setMostrarPedidosPorDia(false)}
                />

                {/* Sidebar derecho con información del mapa */}
                <div className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-[70] transition-transform duration-300 ease-in-out ${
                    mostrarInfoSidebar ? 'translate-x-0' : 'translate-x-full'
                }`} style={{ width: '380px' }}>
                    <div className="h-full overflow-y-auto">
                        {/* Header */}
                        <div className="bg-primary text-white p-6 sticky top-0 z-10 relative">
                            <button
                                onClick={() => setMostrarInfoSidebar(false)}
                                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors duration-200"
                                aria-label="Cerrar"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <h2 className="text-2xl font-bold">Información</h2>
                            <p className="text-sm text-gray-200 mt-1">Guía de uso del mapa</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Estadísticas */}
                            <div>
                                <h3 className="text-lg font-bold font-sans text-neutral-custom-800 pb-2 border-b-2 border-primary mb-4 text-center">
                                    Estadísticas
                                </h3>
                                <div className="space-y-4">
                                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                                        <p className="text-3xl font-bold text-blue-900">{contarVuelos(vuelos).cuenta}</p>
                                        <p className="text-sm text-gray-700 mt-1">vuelos en tránsito</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-green-50 rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-green-900">{`${(capacidadAlmacenesUsada(aeropuertos) * 100).toFixed(2)}%`}</p>
                                            <p className="text-xs text-gray-700 mt-1">de almacenes usados</p>
                                        </div>
                                        <div className="bg-primary-50 rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-primary-900">{`${Number.isFinite(contarVuelos(vuelos).porcentaje) ? (contarVuelos(vuelos).porcentaje * 100).toFixed(2) : "0.00"}%`}</p>
                                            <p className="text-xs text-gray-700 mt-1">de vuelos usados</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Códigos de color */}
                            <div>
                                <h3 className="text-lg font-bold font-sans text-neutral-custom-800 pb-2 border-b-2 border-primary mb-4 text-center">
                                    Códigos de color
                                </h3>
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-600 mb-3">Los colores indican el nivel de ocupación:</p>

                                    <div className="flex items-center justify-center gap-3 bg-green-50 rounded-lg p-3">
                                        <div className="flex gap-2">
                                            <img src="/logos/avionVerde.png" alt="Avión verde" className="w-6 h-6" />
                                            <img src="/logos/almacenVerde.png" alt="Almacén verde" className="w-6 h-6"/>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-green-800">0-33%</p>
                                            <p className="text-xs text-gray-600">Ocupación baja</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-3 bg-yellow-50 rounded-lg p-3">
                                        <div className="flex gap-2">
                                            <img src="/logos/avionAmarillo.png" alt="Avión amarillo" className="w-6 h-6" />
                                            <img src="/logos/almacenAmarillo.png" alt="Almacén amarillo" className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-yellow-800">33-66%</p>
                                            <p className="text-xs text-gray-600">Ocupación media</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-3 bg-red-50 rounded-lg p-3">
                                        <div className="flex gap-2">
                                            <img src="/logos/avionRojo.png" alt="Avión rojo" className="w-6 h-6" />
                                            <img src="/logos/almacenRojo.png" alt="Almacén rojo" className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-red-800">66-100%</p>
                                            <p className="text-xs text-gray-600">Ocupación alta</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Elementos especiales */}
                            <div>
                                <h3 className="text-lg font-bold font-sans text-neutral-custom-800 pb-2 border-b-2 border-primary mb-4 text-center">
                                    Elementos especiales
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                                        <img src="/logos/vueloEnhancedBlue.png" alt="Vuelo seleccionado" className="w-8 h-8" />
                                        <div>
                                            <p className="font-semibold text-gray-800">Vuelo seleccionado</p>
                                            <p className="text-xs text-gray-600">Aparece en azul al hacer clic</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-red-50 rounded-lg p-3">
                                        <div className="w-8 h-1 bg-red-500 border-t-2 border-dashed border-red-500"></div>
                                        <div>
                                            <p className="font-semibold text-gray-800">Ruta de vuelo</p>
                                            <p className="text-xs text-gray-600">Línea roja punteada</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Top 5 Aeropuertos con mayor ocupación */}
                            <div>
                                <h3 className="text-lg font-bold font-sans text-neutral-custom-800 pb-2 border-b-2 border-primary mb-3 text-center">
                                    Top 5 - Mayor Ocupación
                                </h3>
                                <div className="space-y-2">
                                    {Array.from((aeropuertosCongelados || aeropuertos.current)?.values() || [])
                                        .map(item => item.aeropuerto)
                                        .sort((a, b) => (b.cantidadActual / b.capacidadMaxima) - (a.cantidadActual / a.capacidadMaxima))
                                        .slice(0, 5)
                                        .map((aeropuerto, index) => (
                                            <div key={aeropuerto.codigoOACI} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 text-sm">
                                                <div className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-white text-xs ${
                                                    index === 0 ? 'bg-yellow-500' : 
                                                    index === 1 ? 'bg-gray-400' : 
                                                    index === 2 ? 'bg-orange-400' : 
                                                    'bg-gray-300'
                                                }`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-800 truncate">{aeropuerto.ciudad}</p>
                                                    <p className="text-xs text-gray-500">{aeropuerto.codigoOACI}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold text-sm ${
                                                        (aeropuerto.cantidadActual / aeropuerto.capacidadMaxima) > 0.66 ? 'text-red-600' :
                                                        (aeropuerto.cantidadActual / aeropuerto.capacidadMaxima) > 0.33 ? 'text-yellow-600' :
                                                        'text-green-600'
                                                    }`}>
                                                        {((aeropuerto.cantidadActual / aeropuerto.capacidadMaxima) * 100).toFixed(0)}%
                                                    </p>
                                                    <p className="text-xs text-gray-500">{aeropuerto.cantidadActual}/{aeropuerto.capacidadMaxima}</p>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overlay cuando el sidebar está abierto */}
                {mostrarInfoSidebar && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-30 z-[60]"
                        onClick={() => setMostrarInfoSidebar(false)}
                    />
                )}
            </div>{" "}
        </div>
    );
};

export default Mapa;
