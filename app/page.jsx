"use client";

import { useState, useEffect } from "react";
import { FaClock, FaMapMarkedAlt, FaBoxOpen, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function Home() {
    const [currentSlide, setCurrentSlide] = useState(0);

    const colorMap = {
        primary: { bg: 'bg-primary-50', text: 'text-primary' },
        info: { bg: 'bg-info-light/10', text: 'text-info' },
    };

    const slides = [
        {
            title: "Monitoreo en Tiempo Real",
            description: "Visualiza el estado de todos tus grupos de productos y vuelos en un mapa interactivo. Obtén información detallada sobre ubicación, tiempos de llegada y capacidad de almacenes.",
            icon: FaMapMarkedAlt,
            color: "primary"
        },
        {
            title: "Simulaciones Avanzadas",
            description: "Ejecuta simulaciones semanales o hasta el colapso del sistema. Analiza escenarios, optimiza rutas y toma decisiones basadas en datos predictivos.",
            icon: FaClock,
            color: "info"
        },
        {
            title: "Gestión de Grupos de Productos",
            description: "Administra tu flota de forma eficiente. Controla velocidades de simulación, rastrea productos y consulta el historial completo de operaciones.",
            icon: FaBoxOpen,
            color: "primary"
        }
    ];

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [slides.length]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-info-light/10">
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="max-w-6xl w-full">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-6xl font-bold font-display text-neutral-custom-800 mb-4">
                            Bienvenido a <span className="text-primary">Morapack</span>
                        </h1>
                        <p className="text-xl font-sans text-neutral-custom-600 max-w-2xl mx-auto">
                            Sistema de gestión y monitoreo de envíos en tiempo real
                        </p>
                    </div>

                    {/* Carrusel */}
                    <div className="relative mb-12">
                        <div className="bg-white rounded-3xl shadow-2xl p-12 min-h-[400px] flex items-center justify-center overflow-hidden">
                            {slides.map((slide, index) => {
                                const Icon = slide.icon;
                                const colors = colorMap[slide.color];
                                return (
                                    <div
                                        key={index}
                                        className={`absolute inset-0 p-12 flex flex-col items-center justify-center transition-all duration-700 ${
                                            index === currentSlide
                                                ? "opacity-100 translate-x-0"
                                                : index < currentSlide
                                                ? "opacity-0 -translate-x-full"
                                                : "opacity-0 translate-x-full"
                                        }`}
                                    >
                                        <div className={`p-8 rounded-full mb-8 transition-all duration-500 ${colors.bg}`}>
                                            <Icon className={`text-7xl ${colors.text}`} />
                                        </div>
                                        <h2 className="text-4xl font-bold font-display text-neutral-custom-800 mb-6">
                                            {slide.title}
                                        </h2>
                                        <p className="text-lg font-sans text-neutral-custom-600 text-center max-w-3xl leading-relaxed">
                                            {slide.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Controles del carrusel */}
                        <button
                            onClick={prevSlide}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
                            aria-label="Anterior"
                        >
                            <FaChevronLeft className="text-2xl text-neutral-custom-700" />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
                            aria-label="Siguiente"
                        >
                            <FaChevronRight className="text-2xl text-neutral-custom-700" />
                        </button>

                        {/* Indicadores */}
                        <div className="flex justify-center gap-3 mt-6">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`h-3 rounded-full transition-all duration-300 ${
                                        index === currentSlide
                                            ? "w-12 bg-primary"
                                            : "w-3 bg-neutral-custom-300 hover:bg-neutral-custom-400"
                                    }`}
                                    aria-label={`Ir a diapositiva ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-12">
                        <p className="text-neutral-custom-500 text-sm font-sans">
                            DP1 - Morapack © 2025
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
