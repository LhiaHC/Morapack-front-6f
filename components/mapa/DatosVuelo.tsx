"use client";
import React, { useState, useRef, useEffect } from "react";
import "@/styles/ComponentesDatosVuelo.css";
import { Vuelo } from "@/types/Vuelo";
import { Aeropuerto } from "@/types/Aeropuerto";
import { ProgramacionVuelo } from "@/types/ProgramacionVuelo";
import { Envio } from "@/types/Envio";
import { aHoraMinutos, convertirHoraVuelo, mostrarTiempoEnZonaHoraria, tiempoFaltante, utcStringToZonedDate } from "@/utils/FuncionesTiempo";
import { Paquete } from "@/types/Paquete";
import { FaSearch, FaPlane, FaWarehouse, FaBox, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

type DatosVueloProps = {
  vuelo: Vuelo | null;
  aeropuerto: Aeropuerto | null;
  programacionVuelos: React.RefObject<Map<string, ProgramacionVuelo>>;
  simulationTime: Date;
  envios: React.RefObject<Map<string, Envio>>;
  aeropuertos: React.RefObject<Map<string, {aeropuerto: Aeropuerto; pointFeature: any}>>;
  envio : Envio | null;
  vuelos : React.RefObject<Map<number, {vuelo: Vuelo, pointFeature: any, lineFeature: any, routeFeature: any}>>;
  simulation: boolean;
  auxiliarVuelos?: React.RefObject<Map<number, Vuelo>> | undefined;
};

const DatosVuelo: React.FC<DatosVueloProps> = ({ vuelo, aeropuerto, programacionVuelos, simulationTime, envios, aeropuertos , envio, vuelos, simulation=true, auxiliarVuelos}) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [opcion, setOpcion] = useState<number>(0);
  const [programacionVuelo, setProgramacionVuelo] = useState<ProgramacionVuelo | null>(null);
  const [cargado, setCargado] = useState<boolean>(false);
  const [busqueda, setBusqueda] = useState<string>("");
  const [filtros, setFiltros] = useState<{idPaquete: number, ciudad: string, idEnvio: string}>({idPaquete: 0, ciudad: "", idEnvio: ""});

  // Estados para búsqueda por navbar
  const [searchAlmacen, setSearchAlmacen] = useState<string>("");
  const [searchVuelo, setSearchVuelo] = useState<string>("");
  const [searchEnvio, setSearchEnvio] = useState<string>("");

  const handleSearchAlmacen = () => {
    if (!searchAlmacen.trim()) return;
    const almacen = aeropuertos.current?.get(searchAlmacen.toUpperCase());
    if (almacen) {
      setOpcion(2);
      setVisible(true);
    }
  };

  const handleSearchVuelo = () => {
    if (!searchVuelo.trim()) return;
    const vueloId = parseInt(searchVuelo);
    const vueloData = vuelos.current?.get(vueloId);
    if (vueloData) {
      const claveProgramacion = `${vueloId}-${simulationTime.toISOString().slice(0,10)}`;
      const fechaAyer = new Date(simulationTime);
      fechaAyer.setDate(fechaAyer.getDate() - 1);
      const claveProgramacionManana = `${vueloId}-${fechaAyer.toISOString().slice(0,10)}`;
      setProgramacionVuelo(programacionVuelos.current?.get(claveProgramacion) ?? programacionVuelos.current?.get(claveProgramacionManana) ?? null);
      setOpcion(1);
      setVisible(true);
    }
  };

  const handleSearchEnvio = () => {
    if (!searchEnvio.trim()) return;
    const envioData = envios.current?.get(searchEnvio);
    if (envioData) {
      setOpcion(3);
      setVisible(true);
    }
  };

  useEffect(() => {
    if (!vuelo) return;
    // console.log("Vuelo: ", vuelo);
    const claveProgramacion = `${vuelo.id}-${simulationTime.toISOString().slice(0,10)}`;
    console.log("Programación de vuelo: ", programacionVuelos.current?.get(claveProgramacion) ?? null);
    const fechaAyer = new Date(simulationTime);
    fechaAyer.setDate(fechaAyer.getDate() - 1);
    const claveProgramacionManana = `${vuelo.id}-${fechaAyer.toISOString().slice(0,10)}`;
    setProgramacionVuelo(programacionVuelos.current?.get(claveProgramacion) ?? programacionVuelos.current?.get(claveProgramacionManana) ?? null);
    setVisible(true);
    setOpcion(1);
  }, [vuelo]);

  useEffect(() => {
    if(aeropuerto == null) return;
    setOpcion(2);
    setVisible(true);
  }, [aeropuerto]);

  useEffect(() => {
    if(envio == null) return;
    setOpcion(3);
    setVisible(true);
  }, [envio]);

  function procesarBusqueda() {
    console.log("Buscando: ", busqueda);
    //Si es un nu´mero, se busca por ID de paquete
    if(!isNaN(Number(busqueda))) {
      setFiltros({idPaquete: Number(busqueda), ciudad: "", idEnvio: ""});
    } else {
      //Si no es un número, pero es menor a 4 caracteres, se busca por ciudad
      if(busqueda.length <= 4) {
        setFiltros({idPaquete: 0, ciudad: busqueda, idEnvio: ""});
      } else {
        //Si no es un número y tiene más 4 caracteres, se busca por ID de envío
        setFiltros({idPaquete: 0, ciudad: "", idEnvio: busqueda});
      }
    }
  }

  function wrapperHoraVuelo(idVuelo: number, llegadaOSalida: string) {
    if(auxiliarVuelos && auxiliarVuelos.current) {
      let vueloAConvertir = auxiliarVuelos.current.get(idVuelo);
      if(!vueloAConvertir) return "";
      if(llegadaOSalida=="llegada"){
        // return auxiliarVuelos?.current.get(idVuelo)?.fechaHoraLlegada;
        return convertirHoraVuelo(vueloAConvertir.fechaHoraLlegada, aeropuertos.current?.get(vueloAConvertir.destino ?? "SKBO")?.aeropuerto.gmt ?? 0);
      }
      else{
        return convertirHoraVuelo(vueloAConvertir.fechaHoraSalida, aeropuertos.current?.get(vueloAConvertir.origen ?? "SKBO")?.aeropuerto.gmt ?? 0);
      }
    }
  }

  function construirRuta(paquete: Paquete, nombres: boolean = false) {
    const envio = envios.current?.get(paquete.codigoEnvio);
    let ruta = "";
    if(nombres){
      if(paquete.ruta){
        for (let i = 0; i < paquete.ruta.length; i++) {
          if(i==0){
            ruta = aeropuertos.current?.get(envio?.origen ?? "SKBO")?.aeropuerto.ciudad ?? "NULL";
            ruta+= " (" +wrapperHoraVuelo(paquete.ruta[i], "salida")+ ") "
            ruta += " -> ";
          }
    
          if(i==paquete.ruta.length-1){
            ruta +=  aeropuertos.current?.get(envio?.destino ?? "SKBO")?.aeropuerto.ciudad ?? "NULL";
            ruta+= " (" +wrapperHoraVuelo(paquete.ruta[i], "llegada")+ ") " 
            break;
          }
          let vuelo = vuelos.current?.get(paquete.ruta[i]);
          let destino = vuelo?.vuelo.destino;
    
          ruta += aeropuertos.current?.get(destino ?? "SKBO")?.aeropuerto.ciudad ?? "NULL";   
          ruta+= " (" +wrapperHoraVuelo(paquete.ruta[i], "llegada")+ ") "
          ruta += " -> ";
        }
     }
    }
    else{
      if (paquete.ruta){
        for (let i = 0; i < paquete.ruta.length; i++) {
          if (i === paquete.ruta.length - 1) {
            ruta += paquete.ruta[i];
            break;
          }
          ruta += paquete.ruta[i] + " -> ";
        }
      }
    }
    if (ruta === "") {
      ruta = "Sin planificar";
    }
    return ruta;
  }

  function renderImage(percentage: number, tipo: string) {
    if (percentage < 33) {
      return <img src={`/logos/${tipo}Verde.png`} alt="Producto" className="icono-paquete" />
    } else if (percentage < 66) {
      return <img src={`/logos/${tipo}Amarillo.png`} alt="Producto" className="icono-paquete" />
    }
    else {
      return <img src={`/logos/${tipo}Rojo.png`} alt="Producto" className="icono-paquete" />
    }
  }

  useEffect(() => {
    console.log("Filtros: ", filtros);
  } , [filtros]);


  return (
    <>
      {/* Navbar de búsqueda */}
      <div className="search-navbar">
        <div className="search-input-group">
          <FaWarehouse className="search-icon" />
          <input
            type="text"
            placeholder="ID Almacén"
            value={searchAlmacen}
            onChange={(e) => setSearchAlmacen(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchAlmacen()}
          />
        </div>

        <div className="search-input-group">
          <FaPlane className="search-icon" />
          <input
            type="text"
            placeholder="ID Vuelo"
            value={searchVuelo}
            onChange={(e) => setSearchVuelo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchVuelo()}
          />
        </div>

        <div className="search-input-group">
          <FaBox className="search-icon" />
          <input
            type="text"
            placeholder="ID Grupo de Productos"
            value={searchEnvio}
            onChange={(e) => setSearchEnvio(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchEnvio()}
          />
        </div>

        <button
          onClick={() => {
            handleSearchAlmacen();
            handleSearchVuelo();
            handleSearchEnvio();
          }}
          className="boton-busqueda"
          style={{ 
            borderRadius: '8px', 
            minWidth: '44px', 
            height: '44px', 
            padding: '0 12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <FaSearch size={18} />
        </button>
      </div>

      {/* Panel flotante lateral */}
      <div className="datos-vuelo-wrapper">
        <div
          className={`datos-vuelo-contenedor ${visible ? "visible" : "hidden"}`}
        >
        {vuelo && opcion == 1 ? (
          <>
            <div className="datos-vuelo-header">
              <button
                onClick={() => setVisible(false)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaTimes />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <FaPlane style={{ fontSize: '32px', color: 'white' }} />
                <div>
                  <h2 style={{ color: 'white', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Vuelo {vuelo.id}</h2>
                </div>
              </div>
              <div style={{ color: 'white', fontSize: '14px', lineHeight: '1.6' }}>
                <p style={{ margin: '5px 0' }}>
                  <strong>Salida:</strong> {vuelo.origen} - {utcStringToZonedDate(
                    vuelo.fechaHoraSalida,
                    aeropuertos.current?.get(vuelo.origen)?.aeropuerto.gmt ?? 0
                  )}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Llegada:</strong> {vuelo.destino} - {utcStringToZonedDate(
                    vuelo.fechaHoraLlegada,
                    aeropuertos.current?.get(vuelo.destino)?.aeropuerto.gmt ?? 0
                  )}
                </p>
                <p style={{ margin: '10px 0 0 0' }}>
                  <strong>Carga:</strong> {programacionVuelo?.cantPaquetes ?? 0} / {vuelo.capacidad} productos
                  ({((((programacionVuelo?.cantPaquetes ?? 0) / vuelo.capacidad) * 100)).toFixed(2)}% lleno)
                </p>
              </div>
            </div>
            <div className="datos-vuelo-content">
              <div className="datos-vuelo-busqueda">
                <input
                  type="text"
                  placeholder="Ingrese código producto, ciudad o ID de grupo"
                  className="input-busqueda"
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      procesarBusqueda();
                    }
                  }}
                />
                <button className="boton-busqueda" onClick={procesarBusqueda}>
                  Buscar
                </button>
              </div>
              <div className="datos-vuelo-tabla">
                <table>
                  <thead>
                    <tr>
                      <th>Cód. producto</th>
                      <th>Origen</th>
                      <th>Destino</th>
                      <th>Cód. grupo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programacionVuelo?.paquetes
                      .filter((paquete) => {
                        const envio = envios.current?.get(paquete.codigoEnvio);
                        return (
                          (filtros.idPaquete === 0 &&
                            filtros.ciudad === "" &&
                            filtros.idEnvio === "") ||
                          (filtros.idPaquete !== 0 &&
                            paquete.id === filtros.idPaquete) ||
                          (filtros.ciudad !== "" &&
                            (envio?.origen === filtros.ciudad ||
                              envio?.destino === filtros.ciudad)) ||
                          (filtros.idEnvio !== "" &&
                            paquete.codigoEnvio === filtros.idEnvio)
                        );
                      })
                      .map((paquete, index) => {
                        const envio = envios.current?.get(paquete.codigoEnvio);
                        return (
                          <tr key={index}>
                            <td>{paquete.id}</td>
                            <td>{envio?.origen ?? "NULL"}</td>
                            <td>{envio?.destino ?? "NULL"}</td>
                            <td>{paquete.codigoEnvio}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : aeropuerto && opcion == 2 ? (
          <>
            <div className="datos-vuelo-header">
              <button
                onClick={() => setVisible(false)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaTimes />
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 0' }}>
                <FaWarehouse style={{ fontSize: '48px', color: 'white', marginBottom: '15px' }} />
                <h2 style={{ color: 'white', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
                  {aeropuerto.ciudad}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: '5px 0 0 0', fontSize: '18px' }}>
                  {aeropuerto.codigoOACI}
                </p>
                <div style={{ 
                  marginTop: '20px', 
                  padding: '15px 30px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  width: '100%',
                  maxWidth: '400px'
                }}>
                  <p style={{ color: 'white', fontSize: '14px', margin: '0 0 10px 0' }}>
                    <strong>Hora local:</strong> {mostrarTiempoEnZonaHoraria(simulationTime, aeropuerto.gmt)}
                  </p>
                  {/* Mostrar capacidad solo si no es un hub */}
                  {!['EBCI', 'SPIM', 'UBBB'].includes(aeropuerto.codigoOACI) && (
                    <>
                      <p style={{ color: 'white', fontSize: '14px', margin: '0' }}>
                        <strong>Capacidad:</strong> {aeropuerto.cantidadActual}/{aeropuerto.capacidadMaxima} paquetes
                      </p>
                      <div style={{ 
                        marginTop: '10px',
                        height: '8px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${(aeropuerto.cantidadActual / aeropuerto.capacidadMaxima) * 100}%`,
                          background: (aeropuerto.cantidadActual / aeropuerto.capacidadMaxima) > 0.8 
                            ? '#ef4444' 
                            : (aeropuerto.cantidadActual / aeropuerto.capacidadMaxima) > 0.5 
                            ? '#f59e0b' 
                            : '#10b981',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: '5px 0 0 0', textAlign: 'center' }}>
                        {((aeropuerto.cantidadActual / aeropuerto.capacidadMaxima) * 100).toFixed(1)}% ocupado
                      </p>
                    </>
                  )}
                  {/* Para los hubs, mostrar mensaje especial */}
                  {['EBCI', 'SPIM', 'UBBB'].includes(aeropuerto.codigoOACI) && (
                    <>
                      <p style={{ color: 'white', fontSize: '14px', margin: '0' }}>
                        <strong>Paquetes actuales:</strong> {aeropuerto.cantidadActual}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: '10px 0 0 0', textAlign: 'center', fontStyle: 'italic' }}>
                        ⭐ Hub principal - Capacidad ilimitada
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : envio && opcion == 3 ? (
          <>
            <div className="datos-vuelo-header">
              <button
                onClick={() => setVisible(false)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaTimes />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <FaBox style={{ fontSize: '32px', color: 'white' }} />
                <div>
                  <h2 style={{ color: 'white', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                    Envío {envio.id}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.9)', margin: '5px 0 0 0', fontSize: '16px' }}>
                    {envio.paquetes.length} paquetes
                  </p>
                </div>
              </div>
              <div style={{ color: 'white', fontSize: '14px', lineHeight: '1.6' }}>
                <p style={{ margin: '5px 0' }}>
                  <strong>Recepción:</strong> {new Date(envio.fechaHoraSalida * 1000 + ((5+(aeropuertos.current?.get(envio.origen)?.aeropuerto.gmt ?? 0)) * 3600 * 1000)).toLocaleString()}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Origen:</strong> {envio.origen} ({aeropuertos.current?.get(envio.origen)?.aeropuerto.ciudad})
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Destino:</strong> {envio.destino} ({aeropuertos.current?.get(envio.destino)?.aeropuerto.ciudad})
                </p>
              </div>
            </div>
            <div className="datos-vuelo-content">
              <div className="datos-vuelo-busqueda">
                {/* Detalle de los {envio.paquetes.length} productos */}
              </div>
              <div className="datos-envio-tabla">
                <table>
                  <thead>
                    <tr>
                      <th>Cód. producto</th>
                      <th>Ruta {simulation ? ("(códigos de vuelo)") : ""}</th>

                    </tr>
                  </thead>
                  <tbody>
                    {envio.paquetes.map((paquete, index) => {
                      return (
                        <tr key={index}>
                          <td>{paquete.id}</td>
                          <td>{construirRuta(paquete, !simulation)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="datos-vuelo-header">
              <button
                onClick={() => setVisible(false)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaTimes />
              </button>
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <FaSearch style={{ fontSize: '48px', color: 'white', marginBottom: '15px' }} />
                <h2 style={{ color: 'white', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                  Seleccione un elemento
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '10px', fontSize: '14px' }}>
                  Haga clic en un vuelo, almacén o use la búsqueda
                </p>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </>
  );
};

export default DatosVuelo;
