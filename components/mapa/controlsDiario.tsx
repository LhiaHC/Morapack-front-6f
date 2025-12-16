"use client";
import React, { useEffect, useState } from "react";

const SimControls: React.FC = () => {
  const [limaTime, setLimaTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleString("es-PE", {
        timeZone: "America/Lima",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      setLimaTime(time);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[45] w-full max-w-sm px-4">
      <div className="bg-white/85 backdrop-blur-xl shadow-2xl rounded-2xl border border-gray-200 px-6 py-3">
        <div className="flex items-center justify-center gap-4">

          {/* Icono */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6l4 2M12 22a10 10 0 100-20 10 10 0 000 20z"
              />
            </svg>
          </div>

          {/* Hora */}
          <div className="flex flex-col text-center">
            <span className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">
              Hora actual · Lima (PE)
            </span>
            <span className="text-xl font-bold text-gray-900 tabular-nums">
              {limaTime}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SimControls;
