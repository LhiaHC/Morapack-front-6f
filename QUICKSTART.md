# Guía de Inicio Rápido - Simulación ICAO

## 🚀 Inicio Rápido

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Iniciar Servidor de Desarrollo
```bash
npm run dev
```

### 3. Abrir en Navegador
- Navegar a la URL mostrada (usualmente `http://localhost:5173`)
- Ir a la página del mapa (MapPage)

## 📋 Verificar Archivos JSON

Asegúrate de que existan estos archivos en `/public`:

```
public/
├── airports_icao.json           ✅ Aeropuertos
├── flight_instances_icao.json   ✅ Instancias de vuelos
├── assignments_split_icao.json  ✅ Asignaciones split-aware
└── timeline_split_icao.json     ✅ Timeline (opcional)
```

## 🎮 Uso de la Simulación

### Controles de Tiempo (Panel superior derecho)

1. **Play/Pausa** ▶️ ⏸️
   - Inicia o pausa la simulación
   - Los aviones se moverán cuando esté en Play

2. **Slider de Tiempo** 
   - Arrastra para navegar manualmente en el tiempo
   - Muestra el rango completo de la simulación

3. **Selector de Velocidad**
   - Ajusta qué tan rápido avanza el tiempo
   - Opciones: 30s/s hasta 1h/s (default: 2min/s)

4. **Reset** 🔄
   - Vuelve al inicio de la simulación

### Panel de Pedidos (Panel lateral izquierdo)

1. **Búsqueda**
   ```
   [Buscar por Order ID...]
   ```
   - Escribe el ID del pedido (ej: "ORD-004")
   - La lista se filtra automáticamente

2. **Lista de Pedidos**
   - Clic en un pedido para ver detalles
   - Muestra número de splits

3. **Detalle de Pedido**
   - **Splits**: Consignaciones del pedido
   - **Line Refs**: Referencias de líneas
   - **Legs**: Trayectos individuales
     - Secuencia
     - Ruta (from → to)
     - Cantidad transportada
     - Horarios (salida/llegada)
   - **Timeline**: Eventos de trazabilidad (si existe)

### Mapa Interactivo

1. **Aeropuertos** 📍
   - Marcadores fijos en el mapa
   - Tooltip muestra: ICAO, nombre, ciudad, país
   - Zoom y pan con mouse

2. **Rutas** ━━━━
   - Líneas punteadas entre aeropuertos
   - Representan las rutas de vuelo

3. **Aviones** ✈️
   - Iconos que se mueven sobre las rutas
   - Tooltip muestra:
     - ID de vuelo
     - Ruta (origen → destino)
     - Carga actual / Capacidad
     - Porcentaje de ocupación
     - Progreso del vuelo
   - Colores según carga:
     - 🟢 Verde: < 70%
     - 🟠 Naranja: 70-90%
     - 🔴 Rojo: > 90%

## 📊 Ejemplo de Uso

### Caso: Seguir un pedido multi-leg

1. **Buscar el pedido**
   ```
   Panel lateral → [Buscar] → "ORD-004"
   ```

2. **Ver splits**
   ```
   ORD-004
   ├── Split 1: C-004-A
   │   └── Leg 1: SPIM → UBBB (directo)
   └── Split 2: C-004-B
       ├── Leg 1: SPIM → EBCI
       └── Leg 2: EBCI → UBBB
   ```

3. **Observar en el mapa**
   - Darle Play a la simulación
   - Ajustar velocidad a 10min/s para ver más rápido
   - Observar cómo los aviones transportan la carga

4. **Verificar timeline**
   - En el panel de detalle, scroll hasta Timeline
   - Ver eventos: LOAD, ARRIVAL, etc.
   - Ordenados cronológicamente

## 🔧 Solución de Problemas

### Error: "Failed to load airports"
- Verificar que `airports_icao.json` existe en `/public`
- Verificar formato JSON (debe ser un array)
- Abrir consola del navegador (F12) para más detalles

### Error: "Failed to load flight instances"
- Verificar que `flight_instances_icao.json` existe en `/public`
- Verificar que las fechas están en formato ISO (YYYY-MM-DDTHH:mm:ssZ)

### Los aviones no se mueven
- Verificar que la simulación está en Play (▶️)
- Verificar que el tiempo actual está dentro del rango de vuelos
- Usar el slider para navegar a un momento donde hay vuelos activos

### No aparecen pedidos
- Verificar que `assignments_split_icao.json` existe en `/public`
- Verificar que el JSON tiene la estructura correcta
- Verificar en la consola del navegador (F12)

## 📝 Datos de Ejemplo

### Aeropuertos Incluidos
- **SPIM** (LIM): Lima, Peru
- **EBCI** (CRL): Charleroi, Belgium
- **UBBB** (GYD): Baku, Azerbaijan

### Vuelos de Ejemplo
- **MP-101**: SPIM → EBCI (2025-10-20, 00:00-12:00 UTC)
- **MP-202**: EBCI → UBBB (2025-10-20, 06:00-18:00 UTC)
- **MP-303**: SPIM → UBBB (2025-10-20, 12:00-00:00 UTC)

### Pedidos de Ejemplo
- **ORD-001**: 1 split, vuelo directo
- **ORD-002**: 1 split, vuelo directo
- **ORD-003**: 1 split, vuelo directo
- **ORD-004**: 2 splits, uno directo y uno multi-leg

## 🎯 Casos de Uso Típicos

### 1. Monitoreo General
```
1. Iniciar simulación (Play)
2. Ajustar velocidad (ej: 10min/s)
3. Observar flujo de vuelos en el mapa
4. Ver tooltips de aviones para detalles
```

### 2. Análisis de Pedido Específico
```
1. Buscar pedido en panel lateral
2. Clic para ver detalles
3. Revisar splits y legs
4. Verificar horarios
5. (Opcional) Ver timeline de eventos
```

### 3. Verificar Capacidad de Vuelos
```
1. Observar colores de aviones
2. 🟢 Verde = buena capacidad disponible
3. 🟠 Naranja = capacidad ajustada
4. 🔴 Rojo = casi lleno
5. Clic en avión para ver números exactos
```

### 4. Navegar en el Tiempo
```
1. Usar slider para ir a momento específico
2. Pausar para examinar estado
3. Ver qué vuelos están activos
4. Ver qué pedidos están en tránsito
5. Continuar con Play
```

## 💡 Consejos

- **Velocidad inicial**: Empieza con 2min/s para familiarizarte
- **Zoom del mapa**: Usa scroll del mouse para acercarte
- **Tooltips**: Pasa el mouse sobre elementos para información
- **Panel lateral**: Puedes minimizar el panel de pedidos si necesitas más espacio en el mapa
- **Timeline**: Solo aparece si el archivo JSON existe y tiene eventos para ese pedido

## 📚 Más Información

- Ver `IMPLEMENTACION_ICAO.md` para detalles técnicos
- Ver `ARQUITECTURA_ICAO.md` para arquitectura del sistema
- Consultar código fuente en `src/` para personalizaciones
