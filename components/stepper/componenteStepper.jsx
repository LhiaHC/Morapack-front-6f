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
  const [isImmediate, setIsImmediate] = React.useState(false);

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

    let envio = {
      origen: ciudadOrigen,
      destino: ciudadDestino,
      cantidadPaquetes: numPaquetes,
      fechaHoraSalida: isImmediate ? null : horaEnvio,
    };
    console.log(envio);
    //Guardar clientes
    console.log("guardando clientes en ", apiURL);

    try{
      //Cursor de carga
      document.body.style.cursor = 'wait';

      await axios.post(`${apiURL}/cliente`, clienteEmisor)
        .then((response) => {
          console.log(response.data);
          envio.emisorID = response.data.id;
        })
        .catch((error) => {
          console.log(error);
        });

      await axios.post(`${apiURL}/cliente`, clienteReceptor)
        .then((response) => {
          console.log(response.data);
          envio.receptorID = response.data.id;
        })
        .catch((error) => {
          console.log(error);
        });

      await axios.post(`${apiURL}/envio`, envio)
        .then((response) => {
          console.log(response.data);
          envio.id = response.data.id;

          //Los codigos llegan en una string separados por espacios
          let codigos;
          if (typeof response.data === 'number') {
            codigos = [response.data];
          } else if (typeof response.data === 'string') {
            codigos = response.data.split(" ");
            codigos = codigos.filter((codigo) => codigo !== "");
          }
          console.log(codigos);
          setCodigosPaquetes(codigos);
        })
        .catch((error) => {
          console.log(error);
        });
      } catch (error) {
        console.log(error);
      } finally {
        //Cursor normal
        document.body.style.cursor = 'default';
      }
  };

  React.useEffect(() => {
    if(codigosPaquetes.length > 0){
      handleOpenModal(); // Abre el modal al hacer clic en 'Finalizar'
    }
  }, [codigosPaquetes]);


  const handleBack = () => {
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

            <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
              {/* Tipo y Número de Documento */}
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Documento de Identidad</h3>
                </div>
                <BasicSelect required value={tipoDocREM} setValue={settipoDocREM} />
                <TextField 
                  required 
                  id="filled-basic" 
                  label="Ingrese número de documento" 
                  variant="outlined" 
                  sx={{ width: '50%' }}
                  value={numDocREM} 
                  onChange={handleChangeNumDocREM} 
                />
              </div>

              {/* Nombres Completos */}
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
                </div>
                <Box display="flex" gap={3} flexWrap="wrap">
                  <Box flex="1" minWidth="200px">
                    <TextField 
                      required 
                      id="apellido" 
                      label="Apellido" 
                      variant="outlined" 
                      fullWidth
                      value={apellidoREM} 
                      onChange={handleChangeApellidoREM} 
                    />
                  </Box>
                  <Box flex="1" minWidth="200px">
                    <TextField 
                      required 
                      id="nombre" 
                      label="Nombre" 
                      variant="outlined" 
                      fullWidth
                      value={nombreREM} 
                      onChange={handleChangeNombreREM} 
                    />
                  </Box>
                  <Box flex="1" minWidth="200px">
                    <TextField 
                      id="segundo-nombre" 
                      label="Segundo nombre (opcional)" 
                      variant="outlined" 
                      fullWidth
                      value={segundonombreREM} 
                      onChange={handleChangeSegundonombreREM} 
                    />
                  </Box>
                </Box>
              </div>

              {/* Contacto */}
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos de Contacto</h3>
                </div>
                <Box display="flex" gap={2} alignItems="flex-end">
                  <Box width="200px">
                    <SelectVariants required numCode={telefonoREM} setnumCode={settelefonoREM} />
                  </Box>
                  <Box flex="1">
                    <TextField 
                      required 
                      id="numero-telefono" 
                      label="Número de teléfono" 
                      variant="outlined" 
                      fullWidth
                      value={numeroREM} 
                      onChange={handleChangeNumeroREM} 
                    />
                  </Box>
                </Box>
                <TextField 
                  required 
                  id="email" 
                  label="correo@ejemplo.com" 
                  variant="outlined" 
                  sx={{ width: '60%' }}
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

            <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
              {/* Ubicaciones */}
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Ubicaciones de Envío</h3>
                </div>
                <Box display="flex" gap={3} flexWrap="wrap">
                  <Box flex="1" minWidth="250px">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad de Origen *
                    </label>
                    <SelectVariantsCity required city={ciudadOrigen} setCity={setciudadOrigen} />
                  </Box>
                  <Box flex="1" minWidth="250px">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad de Destino *
                    </label>
                    <SelectVariantsCity required city={ciudadDestino} setCity={setciudadDestino} />
                  </Box>
                </Box>
              </div>

              {/* Detalles del Envío */}
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles del Envío</h3>
                </div>
                <Box display="flex" flexDirection="column" gap={2} width="50%">
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
                </Box>
                
                <Box display="flex" flexDirection="column" gap={2}>
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha y Hora de Registro *
                  </label>
                  <Box display="flex" flexDirection="row" alignItems="center" gap={2}>
                    <div className="flex items-center border rounded-md bg-gray-50">
                      <DatePicker
                        selected={horaEnvio}
                        onChange={handleDateChange}
                        showTimeSelect
                        dateFormat="dd/MM/yyyy - HH:mm"
                        className="flex-grow p-2 text-left outline-none text-lg bg-transparent"
                        disabled={isImmediate}
                      />
                      <div
                        className="p-2 cursor-pointer flex-shrink-0"
                        onClick={() =>
                          document.querySelector(".react-datepicker-wrapper input").focus()
                        }
                      >
                        <FaCalendarAlt className="text-lg text-gray-600" />
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
                      label="Ahora"
                    />
                  </Box>
                </Box>
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

            <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
              {/* Tipo y Número de Documento */}
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Documento de Identidad</h3>
                </div>
                <BasicSelect required value={tipoDocDES} setValue={settipoDocDES} />
                <TextField 
                  required 
                  id="filled-basic" 
                  label="Ingrese número de documento" 
                  variant="outlined" 
                  sx={{ width: '50%' }}
                  value={numDocDES} 
                  onChange={handleChangeNumDocDES} 
                />
              </div>

              {/* Nombres Completos */}
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
                </div>
                <Box display="flex" gap={3} flexWrap="wrap">
                  <Box flex="1" minWidth="200px">
                    <TextField 
                      required 
                      id="apellido-des" 
                      label="Apellido" 
                      variant="outlined" 
                      fullWidth
                      value={apellidoDES} 
                      onChange={handleChangeApellidoDES} 
                    />
                  </Box>
                  <Box flex="1" minWidth="200px">
                    <TextField 
                      required 
                      id="nombre-des" 
                      label="Nombre" 
                      variant="outlined" 
                      fullWidth
                      value={nombreDES} 
                      onChange={handleChangeNombreDES} 
                    />
                  </Box>
                  <Box flex="1" minWidth="200px">
                    <TextField 
                      id="segundo-nombre-des" 
                      label="Segundo nombre (opcional)" 
                      variant="outlined" 
                      fullWidth
                      value={segundonombreDES} 
                      onChange={handleChangeSegundonombreDES} 
                    />
                  </Box>
                </Box>
              </div>

              {/* Contacto */}
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos de Contacto</h3>
                </div>
                <Box display="flex" gap={2} alignItems="flex-end">
                  <Box width="200px">
                    <SelectVariants required numCode={telefonoDES} setnumCode={settelefonoDES} />
                  </Box>
                  <Box flex="1">
                    <TextField 
                      required 
                      id="numero-telefono-des" 
                      label="Número de teléfono" 
                      variant="outlined" 
                      fullWidth
                      value={numeroDES} 
                      onChange={handleChangeNumeroDES} 
                    />
                  </Box>
                </Box>
                <TextField 
                  required 
                  id="email-des" 
                  label="correo@ejemplo.com" 
                  variant="outlined" 
                  sx={{ width: '60%' }}
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
                    <SelectVariantsCity disabled={true} city={ciudadOrigen} setCity={setciudadOrigen} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Ciudad de Destino</label>
                    <SelectVariantsCity disabled={true} city={ciudadDestino} setCity={setciudadDestino} />
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
            <Typography className="flex flex-col text-3l mb-2 text-[#000000] text-center font-bold" sx={{ mt: 2, mb: 1 }} component="div">
              Tu envío fue registrado con éxito
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button sx={{ color: '#52489C', backgroundColor: "#FFFFFF" }} onClick={handleReset}>Registrar otro envío</Button>
            </Box>
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
              <Button
                sx={{ color: '#52489C', backgroundColor: "#FFFFFF" }}
                variant="contained"
                onClick={async () => {
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
                  width: 500,
                  bgcolor: 'background.paper',
                  border: '2px solid #000',
                  boxShadow: 24,
                  p: 4,
                  overflow: 'auto',
                }}>
                  <h2 className="text-2xl mb-2 text-[#52489C] text-left font-bold">
                    ¡Códigos de rastreo para los paquetes generados!
                  </h2>
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {codigosPaquetes.map((codigo, index) => (
                        <div
                          key={index}
                          id="modal-description"
                          style={{
                            padding: '5px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            backgroundColor: '#f9f9f9',
                            width: '60px',
                            textAlign: 'center',
                          }}
                        >
                          {codigo}
                        </div>
                      ))}
                    </div>
                  </>
                  <Button onClick={handleCloseModal} sx={{ mt: 2, color: '#52489C', backgroundColor: "#FFFFFF" }}>Terminar</Button>
                </Box>
              </Modal>

            </Box>
          </React.Fragment>
        )}
      </div>
    </Box>
  );

  /* 
  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep}>
        {steps.map((label, index) => {
          const stepProps = {};
          const labelProps = {};
          if (isStepOptional(index)) {
            labelProps.optional = (
              <Typography variant="caption">Siguiente paso</Typography>
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
      {activeStep === steps.length ? (
        <React.Fragment>
          <Typography sx={{ mt: 2, mb: 1 }}>
            All steps completed - you&apos;re finished
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button onClick={handleReset}>Reset</Button>
          </Box>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Typography sx={{ mt: 2, mb: 1 }}>Paso {activeStep + 1}</Typography>
          <h2 className="text-3m mb-2 text-[#000000] text-left font-bold">
                    Tipo de documento
          </h2>
          <div className="flex flex-col gap-4">
            <BasicSelect/>
            <h2 className="flex flex-col gap-3 text-3m mb-2 text-[#000000] text-left font-bold">
                    Número de documento
                    <TextField id="filled-basic" label="Ej. 742056989" variant="outlined" sx={{ width: '40%' }}/>
            </h2>
            <h2 className="flex flex-row gap-2 text-3m mb-2 text-[#000000] text-left font-bold">
              <Box
                display="flex"
                justifyContent="space-between"
                width="100%"
                mt={1}
                gap={2}
              >
                <Box display="flex" flexDirection="column" alignItems="left" width="30%">
                  <h2 className="flex flex-col gap-3 text-3m mb-2 text-[#000000] text-left font-bold">
                      Apellido
                  </h2>
                  <TextField id="apellido" label="Ej. Cruzalegui" variant="outlined" fullWidth />
                </Box>
                <Box display="flex" flexDirection="column" alignItems="left" width="30%">
                  <h2 className="flex flex-col gap-3 text-3m mb-2 text-[#000000] text-left font-bold">
                        Nombre
                  </h2>
                  <TextField id="nombre" label="Ej. Miguel" variant="outlined" fullWidth />
                </Box>
                <Box display="flex" flexDirection="column" alignItems="left" width="30%">
                  <h2 className="flex flex-col gap-3 text-3m mb-2 text-[#000000] text-left font-bold">
                        Segundo nombre
                  </h2>
                  <TextField id="segundo-nombre" label="Ej. David" variant="outlined" fullWidth />
                </Box>

              </Box>  
            </h2>
            <h2 className="flex flex-row gap-2 text-3m mb-2 text-[#000000] text-left font-bold">
              <Box
                display="flex"
                justifyContent="flex-start"
                width="100%"
                gap={1}
              >
                <Box display="flex" flexDirection="column" alignItems="left" width="35%">
                  <h2 className="flex flex-col gap-3 text-3m mb-2 text-[#000000] text-left font-bold">
                      Teléfono
                  </h2>
                  <SelectVariants/>
                </Box>
                <Box display="flex" flexDirection="column" alignItems="left" width="30%">
                  <h2 className="flex flex-col text-3m mb-2 text-[#000000] text-left font-bold">
                        Número
                  </h2>
                  <TextField id="nombre" label="Ej. 985632599" variant="outlined" fullWidth />
                </Box>
              </Box>  
            </h2>
          </div>

          
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
          
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 , color: '#84A98C'}}
            >
              Atrás
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {isStepOptional(activeStep) && (
              <Button color="inherit" onClick={handleSkip} sx={{ mr:1, color: '#84A98C' }}>
                Skip
              </Button>
            )}

            <Button 
              onClick={handleNext} 
              sx={{ color: '#52489C' }} 
              variant="contained"
            >
              
              {activeStep === steps.length - 1 ? 'Finish' : 'Siguiente'}
            </Button>
          </Box>
        </React.Fragment>
      )}
    </Box>
  );
  */
}
