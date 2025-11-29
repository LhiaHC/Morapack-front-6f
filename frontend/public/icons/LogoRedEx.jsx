import React from 'react';
import logoRedEx from '../logos/logoMorapack.png'; // Importa la ruta de la imagen
import Image from 'next/image';

const LogoRedEx = () => (
  <Image src={logoRedEx} alt="Logo de RedEx" height={50}/>
);

export default LogoRedEx;