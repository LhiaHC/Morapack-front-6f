import React from 'react';

const LogoMorapack = ({ className = "w-32 h-auto" }) => (
  <svg
    viewBox="0 0 200 60"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <text
      x="10"
      y="40"
      fontFamily="Arial, sans-serif"
      fontSize="36"
      fontWeight="bold"
      fill="#52489C"
    >
      Morapack
    </text>
  </svg>
);

export default LogoMorapack;
