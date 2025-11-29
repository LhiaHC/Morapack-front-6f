"use client";
import Leyenda from "@/components/mapa/Leyenda";
import Indicadores from "@/components/mapa/Indicadores";
import DatosVuelo from "@/components/mapa/DatosVuelo";
import FinSemanal from "@/components/mapa/FinSemanal";
import VuelosAlmacen from "@/components/mapa/VuelosAlmacen";
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
import BarraMapa from "./BarraMapa";
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

        const aeropuertoFeatures = Array.from(aeropuertos.current.values()).map(
            (item) => {
                const point = new Point(
                    fromLonLat([item.aeropuerto.longitud, item.aeropuerto.latitud])
                );
                const feature = new Feature({
                    geometry: point,
                });
                feature.set('aeropuertoId', item.aeropuerto.codigoOACI);// era OACI y no id, 1h para darme cuenta
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
            setSimulationTime(
                (prevSimulationTime) =>
                    new Date(
                        prevSimulationTime.getTime() +
                            simulationInterval * 60 * 1000
                    )
            );
            onSimulationTimeChange(simulationTime);
            if (sendMessage) {
                const limaTime = simulationTime.toLocaleString("en-US", {
                    timeZone: "America/Lima",
                });
                sendMessage("mensaje: tiempo: " + limaTime, true);
            }
        }, 1000);

        if((simulationTime.getTime() > fechaFinSemana.getTime() && simulationInterval!==1/60) || colapso){
            clearInterval(intervalId);
            console.log("Fin");
            setMostrarFinSemanal(true);
            //Aquí André activas tus componenetes
        }
        // console.log("Updating coordinates con tiempo: ", simulationTime);

        if (vectorSourceRef.current.getFeatures().length > 0) {
            const aBorrar: number[] = updateCoordinates(
                vuelos.current,
                simulationTime
            );
            // console.log("aBorrar: ", aBorrar);
            setVuelosABorrar(aBorrar);
        }

        // Clean up interval on unmount
        return () => clearInterval(intervalId);
    }, [simulationTime, simulationInterval]);

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
                <BarraMapa
                    setSelectedVuelo={setSelectedVuelo}
                    setSelectedAeropuerto={setSelectedAeropuerto}
                    setSelectedEnvio={setSelectedEnvio}
                    mapRef={mapRef}
                    selectedFeature={selectedFeature}
                    vuelos={vuelos}
                    aeropuertos={aeropuertos.current}
                    programacionVuelos={programacionVuelos.current}
                    envios={envios.current}
                    simulatedTime={simulationTime}
                    aBorrarEnvios={aBorrarEnvios}
                />
                <div className="sidebar-container">
                   <Indicadores
                    vuelosEnTransito={contarVuelos(vuelos)}
                    capacidadAlmacenes={capacidadAlmacenesUsada(aeropuertos)}
                    fechaHoraActual={currentTime.toLocaleString()}
                    fechaHoraSimulada={simulationTime}
                    fechaHoraInicio={horaInicio}
                    simulacion={simulationInterval!==1/60}
                    />
                    <Leyenda />
                </div>

                <DatosVuelo vuelo={selectedVuelo} aeropuerto={selectedAeropuerto} programacionVuelos={programacionVuelos} simulationTime={simulationTime}
                    envios={envios} aeropuertos={aeropuertos} envio = {selectedEnvio} vuelos = {vuelos} simulation = {simulationInterval!==1/60} auxiliarVuelos={auxiliarVuelos}
                />
                {mostrarFinSemanal && <FinSemanal programacionVuelos={programacionVuelos} vuelos={vuelos} colapso={colapso}/>}
                <VuelosAlmacen selectedAeropuerto={selectedAeropuerto} vuelos={vuelos} simulationTime={simulationTime} programacionVuelos={programacionVuelos} aeropuertos={aeropuertos} />

                {/* Botón "Más información" en esquina superior derecha */}
                <button
                    onClick={() => setMostrarInfoSidebar(!mostrarInfoSidebar)}
                    className="fixed top-20 right-8 z-50 bg-[#52489c] text-white px-4 py-2 rounded-lg shadow-lg hover:bg-[#6259b5] transition-colors duration-200 flex items-center gap-2"
                >
                    <span className="font-medium">Más información</span>
                    <span className="text-sm">{mostrarInfoSidebar ? '◀' : '▶'}</span>
                </button>

                {/* Sidebar derecho con información del mapa */}
                <div className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-40 transition-transform duration-300 ease-in-out ${
                    mostrarInfoSidebar ? 'translate-x-0' : 'translate-x-full'
                }`} style={{ width: '380px' }}>
                    <div className="h-full overflow-y-auto">
                        {/* Header */}
                        <div className="bg-[#52489c] text-white p-6 sticky top-0 z-10">
                            <h2 className="text-2xl font-bold">Información</h2>
                            <p className="text-sm text-gray-200 mt-1">Guía de uso del mapa</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Estadísticas */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-[#52489c] to-[#6259b5] p-4">
                                    <h3 className="text-xl font-bold text-white">Estadísticas</h3>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                                        <p className="text-3xl font-bold text-blue-900">{contarVuelos(vuelos).cuenta}</p>
                                        <p className="text-sm text-gray-700 mt-1">vuelos en tránsito</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-green-50 rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-green-900">{`${(capacidadAlmacenesUsada(aeropuertos) * 100).toFixed(2)}%`}</p>
                                            <p className="text-xs text-gray-700 mt-1">de almacenes usados</p>
                                        </div>
                                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-purple-900">{`${Number.isFinite(contarVuelos(vuelos).porcentaje) ? (contarVuelos(vuelos).porcentaje * 100).toFixed(2) : "0.00"}%`}</p>
                                            <p className="text-xs text-gray-700 mt-1">de vuelos usados</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Códigos de color */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-[#52489c] to-[#6259b5] p-4">
                                    <h3 className="text-xl font-bold text-white">Códigos de color</h3>
                                </div>
                                <div className="p-5 space-y-3">
                                    <p className="text-sm text-gray-600 mb-3">Los colores indican el nivel de ocupación:</p>

                                    <div className="flex items-center gap-3 bg-green-50 rounded-lg p-3">
                                        <div className="flex gap-2">
                                            <img src="/logos/avionVerde.png" alt="Avión verde" className="w-6 h-6" />
                                            <img src="/logos/edificioVerde.png" alt="Edificio verde" className="w-6 h-6"/>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-green-800">0-33%</p>
                                            <p className="text-xs text-gray-600">Ocupación baja</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-yellow-50 rounded-lg p-3">
                                        <div className="flex gap-2">
                                            <img src="/logos/avionAmarillo.png" alt="Avión amarillo" className="w-6 h-6" />
                                            <img src="/logos/edificioAmarillo.png" alt="Edificio amarillo" className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-yellow-800">33-66%</p>
                                            <p className="text-xs text-gray-600">Ocupación media</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-red-50 rounded-lg p-3">
                                        <div className="flex gap-2">
                                            <img src="/logos/avionRojo.png" alt="Avión rojo" className="w-6 h-6" />
                                            <img src="/logos/edificioRojo.png" alt="Edificio rojo" className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-red-800">66-100%</p>
                                            <p className="text-xs text-gray-600">Ocupación alta</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Elementos especiales */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-[#52489c] to-[#6259b5] p-4">
                                    <h3 className="text-xl font-bold text-white">Elementos especiales</h3>
                                </div>
                                <div className="p-5 space-y-3">
                                    <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                                        <img src="/logos/vueloEnhancedBlue.png" alt="Vuelo seleccionado" className="w-8 h-8" />
                                        <div>
                                            <p className="font-semibold text-gray-800">Vuelo seleccionado</p>
                                            <p className="text-xs text-gray-600">Aparece en azul al hacer clic</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-orange-50 rounded-lg p-3">
                                        <div className="w-8 h-1 bg-[#FF7F09] border-t-2 border-dashed border-[#FF7F09]"></div>
                                        <div>
                                            <p className="font-semibold text-gray-800">Ruta de vuelo</p>
                                            <p className="text-xs text-gray-600">Línea naranja punteada</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overlay cuando el sidebar está abierto */}
                {mostrarInfoSidebar && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-30 z-30"
                        onClick={() => setMostrarInfoSidebar(false)}
                    />
                )}
            </div>{" "}
        </div>
    );
};

export default Mapa;
