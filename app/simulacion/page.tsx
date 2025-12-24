"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt, FaTimes, FaCog } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface ConfiguracionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function ConfiguracionModal({ isOpen, onClose }: ConfiguracionModalProps) {
    const router = useRouter();
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [activeTab, setActiveTab] = useState<"semanal" | "colapso">("semanal");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setStartDate(new Date());
        setMounted(true);
    }, []);

    if (!mounted || !isOpen) {
        return null;
    }

    const buttonText =
        activeTab === "semanal"
            ? "Iniciar Simulación Semanal"
            : "Iniciar Simulación hasta el Colapso";

    const handleStartSimulation = () => {
        // ✅ Ir DIRECTAMENTE a la simulación (sin pasar por carga de archivos)
        router.push(`/simulacion/${activeTab}?startDate=${startDate?.toISOString()}`);
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl relative">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="Cerrar"
                    >
                        <FaTimes size={24} />
                    </button>

                    {/* Modal Content */}
                    <div className="p-8">
                        <h2 className="text-3xl mb-2 text-[#161616] font-bold">
                            Configuración de Simulación
                        </h2>
                        <p className="mb-6 text-[#525252]">
                            Elige el tipo de simulación y los parámetros
                        </p>

                        {/* Tabs dentro del modal */}
                        <div className="flex gap-2 mb-6 border-b-2 border-gray-200">
                            <button
                                className={`py-2 px-4 font-semibold transition-all ${
                                    activeTab === "semanal"
                                        ? "border-b-4 border-primary text-primary"
                                        : "text-gray-600 hover:text-gray-800"
                                }`}
                                onClick={() => setActiveTab("semanal")}
                            >
                                Simulación semanal
                            </button>
                            <button
                                className={`py-2 px-4 font-semibold transition-all ${
                                    activeTab === "colapso"
                                        ? "border-b-4 border-primary text-primary"
                                        : "text-gray-600 hover:text-gray-800"
                                }`}
                                onClick={() => setActiveTab("colapso")}
                            >
                                Hasta el colapso
                            </button>
                        </div>

                        {/* Date Picker */}
                        <div className="border rounded-md p-4 mb-6 bg-gray-50">
                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                Fecha de inicio (dd/mm/yyyy - hh:mm:ss)
                            </label>
                            <div className="flex items-center border rounded-md bg-white">
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date: Date | null) => setStartDate(date)}
                                    showTimeSelect
                                    dateFormat="dd/MM/yyyy - HH:mm:ss"
                                    className="flex-grow p-3 text-left outline-none bg-transparent"
                                />
                                <div
                                    className="p-3 cursor-pointer flex-shrink-0 text-gray-500 hover:text-gray-700"
                                    onClick={() => {
                                        const input = document.querySelector<HTMLInputElement>(
                                            ".react-datepicker-wrapper input"
                                        );
                                        input?.focus();
                                    }}
                                >
                                    <FaCalendarAlt className="text-lg" />
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-md text-lg font-medium hover:bg-gray-300 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleStartSimulation}
                                className="flex-1 bg-primary text-white py-3 rounded-md text-lg font-medium hover:bg-primary-600 transition-colors"
                            >
                                {buttonText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function SimulacionPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <div className="w-full h-screen relative">
            {/* Fondo con imagen de mapa o placeholder */}
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="mb-6">
                        <svg
                            className="w-32 h-32 mx-auto text-gray-300"
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
                    <h2 className="text-2xl font-bold text-gray-600 mb-2">
                        Simulación de Envíos
                    </h2>
                    <p className="text-gray-500">
                        Configura los parámetros para comenzar
                    </p>
                </div>
            </div>

            {/* Botón flotante de configuración */}
            <button
                onClick={openModal}
                className="fixed bottom-8 right-8 z-40 bg-primary text-white p-4 rounded-full shadow-2xl hover:bg-primary-600 transition-all duration-200 hover:scale-110 flex items-center gap-3 group"
                aria-label="Configurar simulación"
            >
                <FaCog size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-semibold text-lg pr-2">
                    Configurar Simulación
                </span>
            </button>

            {/* Modal */}
            <ConfiguracionModal isOpen={isModalOpen} onClose={closeModal} />
        </div>
    );
}