"use client";
import React from "react";
import "@/styles/ComponentesLeyenda.css"
import { tiempoEntre, tiempoNumeroADiasHorasMinutos } from "@/utils/FuncionesTiempo";

interface InfoVuelosProps {
    vuelosEnTransito: {cuenta:number; porcentaje:number};
    capacidadAlmacenes: number;
    fechaHoraActual: string;
    fechaHoraSimulada: Date;
    fechaHoraInicio: Date;
    simulacion?: boolean;
  }
  
  const InfoVuelos: React.FC<InfoVuelosProps> = ({
    vuelosEnTransito,
    capacidadAlmacenes,
    fechaHoraActual,
    fechaHoraSimulada ,
    fechaHoraInicio ,
    simulacion = false
  }) => {
    return (
      <div className="info-vuelos-wrapper">
        <div className="info-vuelos-contenedor visible">
          <div className="info-fecha">
            <div className="fecha-item">
              <span className="fecha-etiqueta">Tiempo real</span>
              <span className="fecha-valor">{simulacion ? fechaHoraActual: fechaHoraSimulada.toLocaleString()}</span>
            </div>
            {simulacion && (
              <>
                <div className="fecha-item">
                  <span className="fecha-etiqueta">Tiempo simulación</span>
                  <span className="fecha-valor">{fechaHoraSimulada.toLocaleString()}</span>
                </div>
                <div className="fecha-item">
                  <span className="fecha-etiqueta">Tiempo transcurrido</span>
                  <span className="fecha-valor">{tiempoNumeroADiasHorasMinutos(tiempoEntre(fechaHoraInicio, fechaHoraSimulada))}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  function formatearCantidad(vuelosEnElAire:number){
    if (vuelosEnElAire < 0){
      return "0";
    }
    else {
      return vuelosEnElAire;
    }
  }

  
  export default InfoVuelos;
