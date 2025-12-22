"use client";

import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Modal from '@mui/material/Modal';
import BasicSelect from "@/components/select/select.jsx";
import SelectVariants from "@/components/select/selectNumCode.jsx";
import SelectVariantsCity from "@/components/select/selectCity.jsx"
import axios from 'axios';
import { Checkbox, FormControlLabel, Radio } from '@mui/material';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from "react-icons/fa";


const steps = ['Datos del cliente', 'Destino y paquetes', 'Datos del receptor', 'Confirmar envío'];

export default function HorizontalLinearStepper() {
  const [value, setValue] = React.useState('');
  const [city, setCity] = React.useState('');
  const [numCode, setnumCode] = React.useState('');
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set());
  const [openModal, setOpenModal] = React.useState(false);

  const [numDocREM, setnumDocREM] = React.useState('');
  const [tipoDocREM, settipoDocREM] = React.useState('');
  const [apellidoREM, setapellidoREM] = React.useState('');
  const [nombreREM, setnombreREM] = React.useState('');
  const [segundonombreREM, setsegundonombreREM] = React.useState('');
  const [telefonoREM, settelefonoREM] = React.useState('');
  const [numeroREM, setnumeroREM] = React.useState('');
  const [emailREM, setemailREM] = React.useState('');

  const [ciudadOrigen, setciudadOrigen] = React.useState('');
  const [ciudadDestino, setciudadDestino] = React.useState('');
  const [numPaquetes, setnumPaquetes] = React.useState('');
  const [horaEnvio, sethoraEnvio] = React.useState('');

  const [numDocDES, setnumDocDES] = React.useState('');
  const [tipoDocDES, settipoDocDES] = React.useState('');
  const [apellidoDES, setapellidoDES] = React.useState('');
  const [nombreDES, setnombreDES] = React.useState('');
  const [segundonombreDES, setsegundonombreDES] = React.useState('');
  const [telefonoDES, settelefonoDES] = React.useState('');
  const [numeroDES, setnumeroDES] = React.useState('');
  const [emailDES, setemailDES] = React.useState('');

  const apiURL = process.env.NEXT_PUBLIC_MORAPACK_API_URL;
  const [codigosPaquetes, setCodigosPaquetes] = React.useState([]);
  const [showLoading, setShowLoading] = React.useState(false);
  const [isImmediate, setIsImmediate] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const [codigoEnvioMemState, setCodigoEnvioMemState] = React.useState(null);
  const [cadenaEnvioState, setCadenaEnvioState] = React.useState(null);
  const [fechaBaseState, setFechaBaseState] = React.useState(null);


  // Función de validación
  const validateStep = (step) => {
    setErrorMessage('');
    
    switch (step) {
      case 0: // Paso 1: Datos del remitente
        if (!tipoDocREM) return 'Por favor seleccione el tipo de documento del remitente';
        if (!numDocREM) return 'Por favor ingrese el número de documento del remitente';
        if (!apellidoREM) return 'Por favor ingrese el apellido del remitente';
        if (!nombreREM) return 'Por favor ingrese el nombre del remitente';
        if (!telefonoREM) return 'Por favor seleccione el código de país del remitente';
        if (!numeroREM) return 'Por favor ingrese el número de teléfono del remitente';
        if (!emailREM) return 'Por favor ingrese el correo electrónico del remitente';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailREM)) return 'Por favor ingrese un correo electrónico válido del remitente';
        break;
      
      case 1: // Paso 2: Destino y paquetes
        if (!ciudadOrigen) return 'Por favor seleccione la ciudad de origen';
        if (!ciudadDestino) return 'Por favor seleccione la ciudad de destino';
        if (!numPaquetes || numPaquetes <= 0) return 'Por favor ingrese una cantidad válida de paquetes';
        if (!isImmediate && !horaEnvio) return 'Por favor seleccione la fecha y hora de envío o marque "Ahora"';
        break;
      
      case 2: // Paso 3: Datos del receptor
        if (!tipoDocDES) return 'Por favor seleccione el tipo de documento del receptor';
        if (!numDocDES) return 'Por favor ingrese el número de documento del receptor';
        if (!apellidoDES) return 'Por favor ingrese el apellido del receptor';
        if (!nombreDES) return 'Por favor ingrese el nombre del receptor';
        if (!telefonoDES) return 'Por favor seleccione el código de país del receptor';
        if (!numeroDES) return 'Por favor ingrese el número de teléfono del receptor';
        if (!emailDES) return 'Por favor ingrese el correo electrónico del receptor';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDES)) return 'Por favor ingrese un correo electrónico válido del receptor';
        break;
      
      default:
        break;
    }
    
    return null;
  };

  // Funciones handleChange
  const handleChangeNumDocREM = (e) =>{
    //Solo permite ingresar números
    const re = /^[0-9\b]+$/;
    if (e.target.value === '' || re.test(e.target.value)) {
     setnumDocREM(e.target.value);
    }
  }
  const handleChangeTipoDocREM = (e) => settipoDocREM(e.target.value);
  const handleChangeApellidoREM = (e) => setapellidoREM(e.target.value);
  const handleChangeNombreREM = (e) => setnombreREM(e.target.value);
  const handleChangeSegundonombreREM = (e) => setsegundonombreREM(e.target.value);
  const handleChangeTelefonoREM = (e) => settelefonoREM(e.target.value);
  const handleChangeNumeroREM = (e) => {
    //Solo permite ingresar números
    const re = /^[0-9\b]+$/;
    if (e.target.value === '' || re.test(e.target.value)) {
      setnumeroREM(e.target.value);
    }
  }

  const handleChangeEmailREM = (e) => setemailREM(e.target.value);

  const handleChangeCiudadOrigen = (e) => setciudadOrigen(e.target.value);
  const handleChangeCiudadDestino = (e) => setciudadDestino(e.target.value);
  const handleChangeNumPaquetes = (e) =>{
    //Solo permite ingresar números
    const re = /^[0-9\b]+$/;
    if (e.target.value === '' || re.test(e.target.value)) {
    setnumPaquetes(e.target.value);
  }}

  const handleDateChange = (newDate) => {
    sethoraEnvio(newDate);
  };

  const handleCheckboxChange = (event) => {
    setIsImmediate(event.target.checked);
    if (event.target.checked) {
      sethoraEnvio(new Date());
    }
  };

  const handleChangeNumDocDES = (e) => {
    //Solo permite ingresar números
    const re = /^[0-9\b]+$/;
    if (e.target.value === '' || re.test(e.target.value)) {
    setnumDocDES(e.target.value);
  }}

  const handleChangeTipoDocDES = (e) => settipoDocDES(e.target.value);
  const handleChangeApellidoDES = (e) => setapellidoDES(e.target.value);
  const handleChangeNombreDES = (e) => setnombreDES(e.target.value);
  const handleChangeSegundonombreDES = (e) => setsegundonombreDES(e.target.value);
  const handleChangeTelefonoDES = (e) => settelefonoDES(e.target.value);
  const handleChangeNumeroDES = (e) => {
    //Solo permite ingresar números
    const re = /^[0-9\b]+$/;
    if (e.target.value === '' || re.test(e.target.value)) {
    setnumeroDES(e.target.value);
  }}
  const handleChangeEmailDES = (e) => setemailDES(e.target.value);

  const isStepOptional = (step) => {
    return step === 1;
  };

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };


  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    handleNext();
  };

  const handleFinish = async () => {
    setShowLoading(true);
    let loadingTimeout;
    let loadingMinTimeout;
    let finished = false;
    // Garantiza al menos 3s de carga, máximo 5s
    const minLoadingPromise = new Promise((resolve) => {
      loadingMinTimeout = setTimeout(resolve, 3000);
    });
    const maxLoadingPromise = new Promise((resolve) => {
      loadingTimeout = setTimeout(() => {
        if (!finished) {
          setShowLoading(false);
          finished = true;
        }
        resolve();
      }, 5000);
    });
    //Guardar datos en clientes
    let clienteEmisor = {
      username: emailREM,
      password: numDocREM,
      email: emailREM,
      numeroDocumento: numDocREM,
      tipoDocumento: tipoDocREM,
      nombre: nombreREM,
      apellido: apellidoREM,
      segundoNombre: segundonombreREM,
      codigoPais: telefonoREM,
      telefono: numeroREM
    };

    let clienteReceptor = {
      username: emailDES,
      password: numDocDES,
      email: emailDES,
      numeroDocumento: numDocDES,
      tipoDocumento: tipoDocDES,
      nombre: nombreDES,
      apellido: apellidoDES,
      segundoNombre: segundonombreDES,
      codigoPais: telefonoDES,
      telefono: numeroDES
    };

    // Convertir la fecha a formato ISO manteniendo la zona horaria de Perú (America/Lima = UTC-5)
    let fechaHoraSalidaISO = null;
    if (!isImmediate && horaEnvio) {
      // Crear una fecha en formato ISO con la zona horaria de Perú
      const year = horaEnvio.getFullYear();
      const month = String(horaEnvio.getMonth() + 1).padStart(2, '0');
      const day = String(horaEnvio.getDate()).padStart(2, '0');
      const hours = String(horaEnvio.getHours()).padStart(2, '0');
      const minutes = String(horaEnvio.getMinutes()).padStart(2, '0');
      const seconds = String(horaEnvio.getSeconds()).padStart(2, '0');
      // Formato ISO con zona horaria de Perú (UTC-5)
      fechaHoraSalidaISO = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-05:00`;
    }

    let envio = {
      origen: ciudadOrigen,
      destino: ciudadDestino,
      cantidadPaquetes: numPaquetes,
      fechaHoraSalida: fechaHoraSalidaISO,
    };
    console.log("Envio con fecha en zona horaria de Perú:", envio);
    //Guardar clientes
    console.log("guardando clientes en ", apiURL);

    try{
      //Cursor de carga
      document.body.style.cursor = 'wait';

      // Registrar cliente emisor
      console.log("Registrando cliente emisor:", clienteEmisor);
      const responseEmisor = await axios.post(`${apiURL}/cliente`, clienteEmisor);
      console.log("Respuesta emisor:", responseEmisor.data);
      envio.emisorID = responseEmisor.data.id;

      // Registrar cliente receptor
      console.log("Registrando cliente receptor:", clienteReceptor);
      const responseReceptor = await axios.post(`${apiURL}/cliente`, clienteReceptor);
      console.log("Respuesta receptor:", responseReceptor.data);
      envio.receptorID = responseReceptor.data.id;

      // Verificar que ambos IDs estén presentes antes de crear el envío
      if (!envio.emisorID || !envio.receptorID) {
        throw new Error("No se pudieron registrar ambos clientes correctamente");
      }

      console.log("Registrando envío con datos:", envio);
      // Registrar envío
      const responseEnvio = await axios.post(`${apiURL}/envio`, envio);
      
      console.log("Respuesta envío:", responseEnvio.data);
      envio.id = responseEnvio.data.id;

      //Nueva Sección
      const fechaBase = isImmediate ? new Date() : horaEnvio;
      const pad = (n) => String(n).padStart(2, '0');
      const fechaCompacta =
        `${fechaBase.getFullYear()}` +
        `${pad(fechaBase.getMonth() + 1)}` +
        `${pad(fechaBase.getDate())}`;
      const horaMinuto =
        `${pad(fechaBase.getHours())}${pad(fechaBase.getMinutes())}`;
      const codPaquete = `${horaMinuto}`;
      const cadenaEnvio =
        `${ciudadOrigen}-` +
        `${codPaquete}-` +
        `${fechaCompacta}-` +
        `${pad(fechaBase.getHours())}:${pad(fechaBase.getMinutes())}:00-` +
        `${ciudadDestino}:` +
        `${numPaquetes}`;
      console.log("Cadena de envío:", cadenaEnvio);

      // Inicializar codigoEnvioMem antes de usarlo
      let codigoEnvioMem = `${ciudadOrigen}${codPaquete}${fechaCompacta}`;
      setCodigoEnvioMemState(codigoEnvioMem);
      setCadenaEnvioState(cadenaEnvio);
      setFechaBaseState(fechaBase);

      let idEnvioMem = null;
      try {
        await axios.post(`${apiURL}/tracking/cadena`, {
          cadena: cadenaEnvio
        });
        // Obtener el envío recién insertado para mostrar el idEnvio
        const responseEnvioMem = await axios.get(`${apiURL}/tracking/envio/${codigoEnvioMem}`);
        if (responseEnvioMem.data && responseEnvioMem.data.idEnvio !== undefined) {
          idEnvioMem = responseEnvioMem.data.idEnvio;
          console.log("idEnvio asignado en memoria:", idEnvioMem);
        } else {
          console.log("No se pudo obtener el idEnvio asignado en memoria");
        }
      } catch (e) {
        console.warn("No se pudo registrar la cadena:", e);
      }

      //Los codigos llegan en una string separados por espacios
      let codigos;
      if (typeof responseEnvio.data === 'number') {
        codigos = [responseEnvio.data];
      } else if (typeof responseEnvio.data === 'string') {
        codigos = responseEnvio.data.split(" ");
        codigos = codigos.filter((codigo) => codigo !== "");
      }
      console.log("Códigos de paquetes:", codigos);
      // Guardar el idEnvio en memoria para mostrarlo en el modal
      setCodigosPaquetes(codigos);
      await minLoadingPromise;
      if (!finished) {
        setShowLoading(false);
        finished = true;
      }
      clearTimeout(loadingTimeout);
    } catch (error) {
      setShowLoading(false);
      clearTimeout(loadingTimeout);
      console.error("Error al registrar el envío:", error);
      setErrorMessage(
        error.response?.data?.message ||
        error.message ||
        "Error al registrar el envío. Por favor intente nuevamente."
      );
    } finally {
      clearTimeout(loadingMinTimeout);
      //Cursor normal
      document.body.style.cursor = 'default';
    }
  };

  React.useEffect(() => {
    if (codigosPaquetes.length > 0) {
      setTimeout(() => {
        handleOpenModal();
      }, 600);
    }
  }, [codigosPaquetes]);

  const handleBack = () => {
    setErrorMessage('');
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      // You probably want to guard against something like this,
      // it should never occur unless someone's actively trying to break something.
      throw new Error("You can't skip a step that isn't optional.");
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <React.Fragment>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm mb-6">
              <Typography sx={{ mb: 2 }} component="div" className="text-gray-600 font-medium">
                Paso {activeStep + 1} de {steps.length}
              </Typography>
              <h2 className="text-3xl mb-2 text-primary font-bold">
                📋 Datos del Cliente Remitente
              </h2>
              <p className="text-gray-600 text-sm">Complete la información de quien envía el paquete</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 space-y-8">
              {/* Tipo y Número de Documento */}
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Documento de Identidad</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <BasicSelect required value={tipoDocREM} setValue={settipoDocREM} />
                  </div>
                  <div>
                    <TextField 
                      required 
                      id="filled-basic" 
                      label="Ingrese número de documento" 
                      variant="outlined" 
                      fullWidth
                      value={numDocREM} 
                      onChange={handleChangeNumDocREM} 
                    />
                  </div>
                </div>
              </div>

              {/* Nombres Completos */}
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Información Personal</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField 
                    required 
                    id="apellido" 
                    label="Apellido" 
                    variant="outlined" 
                    fullWidth
                    value={apellidoREM} 
                    onChange={handleChangeApellidoREM} 
                  />
                  <TextField 
                    required 
                    id="nombre" 
                    label="Nombre" 
                    variant="outlined" 
                    fullWidth
                    value={nombreREM} 
                    onChange={handleChangeNombreREM} 
                  />
                  <TextField 
                    id="segundo-nombre" 
                    label="Segundo nombre (opcional)" 
                    variant="outlined" 
                    fullWidth
                    value={segundonombreREM} 
                    onChange={handleChangeSegundonombreREM} 
                  />
                </div>
              </div>

              {/* Contacto */}
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Datos de Contacto</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <SelectVariants required numCode={telefonoREM} setnumCode={settelefonoREM} />
                  </div>
                  <div className="md:col-span-2">
                    <TextField 
                      required 
                      id="numero-telefono" 
                      label="Número de teléfono" 
                      variant="outlined" 
                      fullWidth
                      value={numeroREM} 
                      onChange={handleChangeNumeroREM} 
                    />
                  </div>
                </div>
                <TextField 
                  required 
                  id="email" 
                  label="Correo electrónico" 
                  variant="outlined" 
                  fullWidth
                  placeholder="correo@ejemplo.com"
                  value={emailREM} 
                  onChange={handleChangeEmailREM} 
                />
              </div>
            </div>
          </React.Fragment>
        )
      case 1:
        return (
          <React.Fragment>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm mb-6">
              <Typography sx={{ mb: 2 }} component="div" className="text-gray-600 font-medium">
                Paso {activeStep + 1} de {steps.length}
              </Typography>
              <h2 className="text-3xl mb-2 text-primary font-bold">
                📦 Destino y Paquetes
              </h2>
              <p className="text-gray-600 text-sm">Indique el origen, destino y cantidad de paquetes a enviar</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 space-y-8">
              {/* Ubicaciones */}
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Ubicaciones de Envío</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad de Origen *
                    </label>
                    <SelectVariantsCity required city={ciudadOrigen} setCity={setciudadOrigen} isOrigin={true} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad de Destino *
                    </label>
                    <SelectVariantsCity required city={ciudadDestino} setCity={setciudadDestino} isDestination={true} />
                  </div>
                </div>
              </div>

              {/* Detalles del Envío */}
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Detalles del Envío</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField 
                    required 
                    id="num-paquetes" 
                    label="Cantidad de paquetes" 
                    variant="outlined" 
                    fullWidth
                    type="number"
                    value={numPaquetes} 
                    onChange={handleChangeNumPaquetes} 
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha y Hora de Registro *
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-300 rounded-md bg-white flex-1 hover:border-primary transition-colors relative">
                        <DatePicker
                          selected={horaEnvio}
                          onChange={handleDateChange}
                          showTimeSelect
                          timeFormat="HH:mm"
                          timeIntervals={15}
                          dateFormat="dd/MM/yyyy - HH:mm"
                          className="flex-grow p-3 text-left outline-none bg-transparent w-full rounded-l-md"
                          disabled={isImmediate}
                          placeholderText="Seleccione fecha y hora"
                          wrapperClassName="w-full"
                          id="date-picker-input"
                        />
                        <button
                          type="button"
                          className="p-3 cursor-pointer flex-shrink-0 hover:bg-gray-100 rounded-r-md transition-colors"
                          onClick={() => {
                            if (!isImmediate) {
                              const input = document.getElementById('date-picker-input');
                              if (input) {
                                input.click();
                              }
                            }
                          }}
                          disabled={isImmediate}
                        >
                          <FaCalendarAlt className={isImmediate ? "text-gray-400" : "text-primary"} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isImmediate}
                      onChange={handleCheckboxChange}
                      name="checkbox-demo"
                      inputProps={{ 'aria-label': 'Al momento de registrar' }}
                    />
                  }
                  label="Registrar ahora (usar fecha y hora actual)"
                />
              </div>
            </div>
          </React.Fragment>
        );
      case 2:
        return (
          <React.Fragment>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm mb-6">
              <Typography sx={{ mb: 2 }} component="div" className="text-gray-600 font-medium">
                Paso {activeStep + 1} de {steps.length}
              </Typography>
              <h2 className="text-3xl mb-2 text-primary font-bold">
                👤 Datos del Receptor
              </h2>
              <p className="text-gray-600 text-sm">Complete la información de quien recibe el paquete</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 space-y-8">
              {/* Tipo y Número de Documento */}
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Documento de Identidad</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <BasicSelect required value={tipoDocDES} setValue={settipoDocDES} />
                  </div>
                  <div>
                    <TextField 
                      required 
                      id="filled-basic" 
                      label="Ingrese número de documento" 
                      variant="outlined" 
                      fullWidth
                      value={numDocDES} 
                      onChange={handleChangeNumDocDES} 
                    />
                  </div>
                </div>
              </div>

              {/* Nombres Completos */}
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Información Personal</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField 
                    required 
                    id="apellido-des" 
                    label="Apellido" 
                    variant="outlined" 
                    fullWidth
                    value={apellidoDES} 
                    onChange={handleChangeApellidoDES} 
                  />
                  <TextField 
                    required 
                    id="nombre-des" 
                    label="Nombre" 
                    variant="outlined" 
                    fullWidth
                    value={nombreDES} 
                    onChange={handleChangeNombreDES} 
                  />
                  <TextField 
                    id="segundo-nombre-des" 
                    label="Segundo nombre (opcional)" 
                    variant="outlined" 
                    fullWidth
                    value={segundonombreDES} 
                    onChange={handleChangeSegundonombreDES} 
                  />
                </div>
              </div>

              {/* Contacto */}
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Datos de Contacto</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <SelectVariants required numCode={telefonoDES} setnumCode={settelefonoDES} />
                  </div>
                  <div className="md:col-span-2">
                    <TextField 
                      required 
                      id="numero-telefono-des" 
                      label="Número de teléfono" 
                      variant="outlined" 
                      fullWidth
                      value={numeroDES} 
                      onChange={handleChangeNumeroDES} 
                    />
                  </div>
                </div>
                <TextField 
                  required 
                  id="email-des" 
                  label="Correo electrónico" 
                  variant="outlined" 
                  fullWidth
                  placeholder="correo@ejemplo.com"
                  value={emailDES} 
                  onChange={handleChangeEmailDES} 
                />
              </div>
            </div>
          </React.Fragment>
        );
      case 3:
        return (
          <div>
            <React.Fragment>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 shadow-sm mb-6">
                <Typography sx={{ mb: 2 }} component="div" className="text-gray-600 font-medium">
                  Paso {activeStep + 1} de {steps.length}
                </Typography>
                <h2 className="text-3xl mb-2 text-primary font-bold">
                  ✓ Confirmar Envío
                </h2>
                <p className="text-gray-600 text-sm">Revise que todos los datos sean correctos antes de confirmar</p>
              </div>

              {/* Card Remitente */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-4">
                <div className="flex items-center gap-2 mb-4 border-b pb-3">
                  <span className="text-2xl">📤</span>
                  <h3 className="text-xl font-bold text-gray-800">Datos del Remitente</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tipo de Documento</label>
                    <BasicSelect disabled={true} value={tipoDocREM} setValue={settipoDocREM} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Número de Documento</label>
                    <TextField 
                      disabled 
                      id="num-doc-rem-confirm" 
                      variant="outlined" 
                      fullWidth
                      value={numDocREM} 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Apellido</label>
                    <TextField 
                      disabled 
                      id="apellido-rem-confirm" 
                      variant="outlined" 
                      fullWidth
                      value={apellidoREM} 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nombre</label>
                    <TextField 
                      disabled 
                      id="nombre-rem-confirm" 
                      variant="outlined" 
                      fullWidth
                      value={nombreREM} 
                    />
                  </div>
                  {segundonombreREM && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Segundo Nombre</label>
                      <TextField 
                        disabled 
                        id="segundo-nombre-rem-confirm" 
                        variant="outlined" 
                        fullWidth
                        value={segundonombreREM} 
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Teléfono</label>
                    <Box display="flex" gap={1}>
                      <SelectVariants disabled={true} numCode={telefonoREM} setnumCode={settelefonoREM} />
                      <TextField 
                        disabled 
                        id="numero-rem-confirm" 
                        variant="outlined" 
                        fullWidth
                        value={numeroREM} 
                      />
                    </Box>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Correo Electrónico</label>
                    <TextField 
                      disabled 
                      id="email-rem-confirm" 
                      variant="outlined" 
                      fullWidth
                      value={emailREM} 
                    />
                  </div>
                </div>
              </div>

              {/* Card Envío */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-4">
                <div className="flex items-center gap-2 mb-4 border-b pb-3">
                  <span className="text-2xl">🌍</span>
                  <h3 className="text-xl font-bold text-gray-800">Detalles del Envío</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Ciudad de Origen</label>
                    <SelectVariantsCity disabled={true} city={ciudadOrigen} setCity={setciudadOrigen} isOrigin={true} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Ciudad de Destino</label>
                    <SelectVariantsCity disabled={true} city={ciudadDestino} setCity={setciudadDestino} isDestination={true} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Número de Paquetes</label>
                    <TextField 
                      disabled 
                      id="num-paquetes-confirm" 
                      variant="outlined" 
                      fullWidth
                      value={numPaquetes} 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Fecha y Hora de Registro</label>
                    <Box display="flex" alignItems="center" gap={2}>
                      <div className="flex items-center border rounded-md flex-1 bg-gray-100">
                        <DatePicker
                          selected={horaEnvio}
                          onChange={handleDateChange}
                          showTimeSelect
                          dateFormat="dd/MM/yyyy - HH:mm"
                          className="flex-grow p-2 text-left outline-none text-sm bg-transparent"
                          disabled={true}
                        />
                        <div className="p-2 flex-shrink-0">
                          <FaCalendarAlt className="text-sm text-gray-500" />
                        </div>
                      </div>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isImmediate}
                            disabled={true}
                          />
                        }
                        label="Ahora"
                      />
                    </Box>
                  </div>
                </div>
              </div>

              {/* Card Receptor */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-2 mb-4 border-b pb-3">
                  <span className="text-2xl">📥</span>
                  <h3 className="text-xl font-bold text-gray-800">Datos del Receptor</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tipo de Documento</label>
                    <BasicSelect disabled={true} value={tipoDocDES} setValue={settipoDocDES} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Número de Documento</label>
                    <TextField 
                      disabled 
                      id="num-doc-des-confirm" 
                      variant="outlined" 
                      fullWidth
                      value={numDocDES} 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Apellido</label>
                    <TextField 
                      disabled 
                      id="apellido-des-confirm" 
                      variant="outlined" 
                      fullWidth
                      value={apellidoDES} 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nombre</label>
                    <TextField 
                      disabled 
                      id="nombre-des-confirm" 
                      variant="outlined" 
                      fullWidth
                      value={nombreDES} 
                    />
                  </div>
                  {segundonombreDES && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Segundo Nombre</label>
                      <TextField 
                        disabled 
                        id="segundo-nombre-des-confirm" 
                        variant="outlined" 
                        fullWidth
                        value={segundonombreDES} 
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Teléfono</label>
                    <Box display="flex" gap={1}>
                      <SelectVariants disabled={true} numCode={telefonoDES} setnumCode={settelefonoDES} />
                      <TextField 
                        disabled 
                        id="numero-des-confirm" 
                        variant="outlined" 
                        fullWidth
                        value={numeroDES} 
                      />
                    </Box>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Correo Electrónico</label>
                    <TextField 
                      disabled 
                      id="email-des-confirm" 
                      variant="outlined" 
                      fullWidth
                      value={emailDES} 
                    />
                  </div>
                </div>
              </div>
            </React.Fragment>
          </div>
        );
      default:
        return 'Paso desconocido';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep}>
        {steps.map((label, index) => {
          const stepProps = {};
          const labelProps = {};
          if (isStepOptional(index)) {
            labelProps.optional = (
              <Typography variant="caption" component="div"></Typography>
            );
          }
          if (isStepSkipped(index)) {
            stepProps.completed = false;
          }
          return (
            <Step key={label} {...stepProps}>
              <StepLabel {...labelProps}>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>
      <div>
        {activeStep === steps.length ? (
          <React.Fragment>
            {showLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-6"></div>
                  <h2 className="text-2xl font-bold text-primary mb-2">Agregando pedido...</h2>
                  <p className="text-gray-600 text-base mb-4">Por favor espera mientras procesamos tu envío.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[300px]">
                <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center">
                  <span className="bg-primary text-white rounded-full p-2 text-3xl mb-4">✅</span>
                  <h2 className="text-2xl font-bold text-primary mb-2">¡Pedido registrado!</h2>
                  <p className="text-gray-600 text-base mb-4">Tu envío fue registrado con éxito.</p>
                  <Button sx={{ color: '#52489C', backgroundColor: "#FFFFFF" }} onClick={handleReset}>Registrar otro envío</Button>
                </div>
              </div>
            )}
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Typography sx={{ mt: 2, mb: 1 }} component="div">{getStepContent(activeStep)}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1, color: '#84A98C' }}
              >
                Atrás
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 mr-3 rounded">
                  <p className="text-sm text-red-700 font-medium">⚠️ {errorMessage}</p>
                </div>
              )}
              <Button
                sx={{ color: '#52489C', backgroundColor: "#FFFFFF" }}
                variant="contained"
                onClick={async () => {
                  const error = validateStep(activeStep);
                  if (error) {
                    setErrorMessage(error);
                    return;
                  }
                  setErrorMessage('');
                  if (activeStep === steps.length - 1) {
                    await handleFinish();
                  } else {
                    await handleNext();
                  }
                }}>
                {activeStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
              </Button>
              <Modal
                open={openModal}
                onClose={handleCloseModal}
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
              >
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: { xs: '90%', sm: 600 },
                  maxHeight: '80vh',
                  bgcolor: 'background.paper',
                  borderRadius: '16px',
                  boxShadow: 24,
                  p: 4,
                  overflow: 'auto',
                }}>
                  <div className="mb-6 flex items-center gap-3">
                    <span className="bg-primary text-white rounded-full p-2 text-2xl">✅</span>
                    <h2 className="text-2xl font-bold text-primary">
                      ¡Pedido registrado!
                    </h2>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-200 rounded-xl p-5 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      Resumen del Envío
                    </h3>
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <span className="text-gray-500">Código único</span>
                      <span className="font-mono font-semibold text-primary">{codigoEnvioMemState}</span>
                      <span className="text-gray-500">Origen</span>
                      <span className="font-semibold">{ciudadOrigen}</span>
                      <span className="text-gray-500">Destino</span>
                      <span className="font-semibold">{ciudadDestino}</span>
                      <span className="text-gray-500">Fecha y hora</span>
                      <span className="font-semibold">
                        {fechaBaseState && fechaBaseState.toLocaleDateString()} {fechaBaseState && fechaBaseState.toLocaleTimeString().slice(0,5)}
                      </span>
                      <span className="text-gray-500">Cantidad de paquetes</span>
                      <span className="font-semibold">{numPaquetes}</span>
                    </div>
                  </div>                 
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Códigos de Rastreo ({codigosPaquetes.length} paquetes)
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {codigosPaquetes.map((codigo, index) => (
                        <div
                          key={index}
                          className="bg-white border-2 border-primary rounded-lg p-3 text-center font-mono font-bold text-primary hover:bg-primary hover:text-white transition-all duration-200 cursor-pointer shadow-sm"
                          title={`Código ${index + 1}: ${codigo}`}
                        >
                          {codigo}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Importante:</strong> Guarda estos códigos. Los clientes podrán usar estos números para rastrear sus paquetes.
                    </p>
                  </div>
                  <Button 
                    onClick={handleCloseModal} 
                    variant="contained"
                    fullWidth
                    sx={{ 
                      mt: 2, 
                      py: 1.5,
                      backgroundColor: '#00897B',
                      '&:hover': {
                        backgroundColor: '#00796B',
                      },
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Terminar
                  </Button>
                </Box>
              </Modal>
            </Box>
          </React.Fragment>
        )}
      </div>
    </Box>
  );
}
