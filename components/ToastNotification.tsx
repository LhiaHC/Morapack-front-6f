"use client";
import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaInfoCircle, FaExclamationTriangle, FaTimes, FaBox } from 'react-icons/fa';

export type ToastType = 'success' | 'info' | 'warning' | 'pedido';

interface ToastNotificationProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
  visible?: boolean;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  visible = true,
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsVisible(visible);
    if (visible && !isExiting) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      if (onClose) {
        onClose();
      }
    }, 300);
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="w-6 h-6" />;
      case 'warning':
        return <FaExclamationTriangle className="w-6 h-6" />;
      case 'pedido':
        return <FaBox className="w-6 h-6" />;
      default:
        return <FaInfoCircle className="w-6 h-6" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'pedido':
        return 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-2xl';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div
      className={`fixed top-24 right-6 z-[100] ${getStyles()} rounded-xl shadow-2xl p-4 pr-12 min-w-[300px] max-w-[500px] transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-base leading-tight">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-all"
          aria-label="Cerrar notificación"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>
      
      {/* Barra de progreso */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-30 rounded-b-xl overflow-hidden">
        <div
          className="h-full bg-white transition-all"
          style={{
            animation: `shrink ${duration}ms linear forwards`,
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default ToastNotification;
