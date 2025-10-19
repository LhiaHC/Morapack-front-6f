# Implementación de Simulación Semanal con JSON Estáticos (ICAO)

## Resumen

Se ha implementado exitosamente la simulación semanal trabajando exclusivamente con códigos ICAO (SPIM, EBCI, UBBB) mediante fetch a archivos JSON estáticos ubicados en `/public`.

## Archivos Creados/Modificados

### 1. Nuevos Archivos

#### `src/sim/staticSource.ts`
- **Propósito**: Carga de datos estáticos desde JSON en `/public`
- **Funciones**:
  - `loadAirports()`: Carga aeropuertos desde `/airports_icao.json`
  - `loadInstances()`: Carga instancias de vuelos desde `/flight_instances_icao.json`
  - `loadAssignmentsSplit()`: Carga asignaciones split-aware desde `/assignments_split_icao.json`
  - `loadTimeline()`: Carga eventos de timeline (opcional) desde `/timeline_split_icao.json`
  - `loadBundle()`: Alternativa para cargar todo desde un único archivo

#### `src/components/OrderPanel.tsx`
- **Propósito**: Panel lateral para búsqueda y visualización de pedidos
- **Características**:
  - Buscador por `orderId`
  - Lista de splits con `consignmentId`, cantidad y `lineRefs`
  - Detalle de legs con secuencia, ruta (from→to), cantidad
  - Información de vuelos: horarios de salida/llegada (depUtc/arrUtc)
  - Timeline de eventos si existe el archivo JSON correspondiente

### 2. Archivos Modificados

#### `src/sim/types.ts`
- Agregados tipos ICAO para datos estáticos:
  - `AirportICAO`: Aeropuerto con código ICAO
  - `FlightInstance`: Instancia de vuelo programado
  - `AssignmentLeg`: Leg de un consignment
  - `LineRef`: Referencia de línea
  - `AssignmentSplit`: Split de un pedido
  - `AssignmentByOrder`: Asignaciones agrupadas por pedido
  - `TimelineEvent`: Evento de trazabilidad

#### `src/pages/MapPage.tsx`
- **Cambios principales**:
  - Carga de datos estáticos al montar usando `staticSource.ts`
  - Cálculo automático de rango de tiempo (min/max) desde las instancias de vuelos
  - Integración del `OrderPanel`
  - Manejo de estados de carga y error

#### `src/components/map/MapView.tsx`
- **Cambios principales**:
  - Recibe props: `airports`, `instances`, `assignments`, `timeline`
  - Pasa datos al `FlightLayer`

#### `src/components/map/FlightLayer.tsx`
- **Reescritura completa** para trabajar con datos ICAO:
  - Pintar aeropuertos con código ICAO y nombre
  - Dibujar rutas (polylines) entre aeropuertos para cada instancia
  - Animación de aviones mediante interpolación:
    ```typescript
    const p = clamp((now - depUtc) / (arrUtc - depUtc), 0, 1)
    lat = lerp(origin.lat, dest.lat, p)
    lon = lerp(origin.lon, dest.lon, p)
    ```
  - Cálculo de carga por instancia sumando `legs.qty` desde assignments
  - Tooltips con información de carga (loaded/capacity) y progreso
  - Colores según factor de carga: verde (<70%), naranja (70-90%), rojo (>90%)

#### `src/sim/SimContext.tsx`
- **Mejoras**:
  - Agregado `setSimTime` para control manual del tiempo
  - Agregado `minTime` y `maxTime` para límites de simulación
  - Mejora en la actualización del tiempo (basado en delta time)
  - Auto-pausa al alcanzar `maxTime`

#### `src/components/sim/SimControls.tsx`
- **Mejoras**:
  - Slider de tiempo (range input) para navegación manual
  - Visualización de rango temporal (min/max)
  - Botones Play/Pausa y Reset mejorados
  - Selector de velocidad con más opciones (30s a 1h sim/s)
  - Interfaz en español
  - Barra de progreso visual en el slider

## Archivos JSON Estáticos (Ya Existentes en `/public`)

### `airports_icao.json`
```json
[
  {
    "icao": "SPIM",
    "iata": "LIM",
    "name": "Jorge Chávez Intl",
    "city": "Lima",
    "country": "Peru",
    "lat": -12.0219,
    "lon": -77.1143,
    "warehouseCapacity": 900,
    "infiniteSource": true
  },
  // ... más aeropuertos
]
```

### `flight_instances_icao.json`
```json
[
  {
    "instanceId": "MP-101#2025-10-20T00:00Z",
    "flightId": "MP-101",
    "origin": "SPIM",
    "dest": "EBCI",
    "depUtc": "2025-10-20T00:00:00Z",
    "arrUtc": "2025-10-20T12:00:00Z",
    "capacity": 320
  },
  // ... más instancias
]
```

### `assignments_split_icao.json`
```json
[
  {
    "orderId": "ORD-004",
    "splits": [
      {
        "consignmentId": "C-004-A",
        "qty": 100,
        "lineRefs": [{"lineId": "ORD-004-L1", "qty": 100}],
        "legs": [{
          "seq": 1,
          "instanceId": "MP-303#2025-10-20T12:00Z",
          "from": "SPIM",
          "to": "UBBB",
          "qty": 100
        }]
      },
      // ... más splits
    ]
  },
  // ... más pedidos
]
```

### `timeline_split_icao.json` (Opcional)
```json
[
  {
    "ts": "2025-10-20T00:00:00Z",
    "type": "LOAD",
    "orderId": "ORD-004",
    "consignmentId": "C-004-B",
    "instanceId": "MP-101#2025-10-20T00:00Z",
    "from": "SPIM",
    "to": "EBCI",
    "qty": 80
  },
  // ... más eventos
]
```

## Funcionalidades Implementadas

### ✅ Mapa Interactivo
- Visualización de aeropuertos con códigos ICAO
- Rutas dibujadas entre aeropuertos (polylines discontinuas)
- Aviones animados que se mueven entre aeropuertos
- Tooltips informativos en aeropuertos y aviones

### ✅ Animación de Vuelos
- Interpolación lineal de posición basada en tiempo de simulación
- Rotación del ícono del avión según dirección del vuelo
- Visualización de carga actual vs capacidad
- Código de colores según factor de carga

### ✅ Reloj de Simulación
- Play/Pausa
- Slider para navegación manual en el tiempo
- Selector de velocidad (30s/s hasta 1h/s)
- Límites automáticos basados en horarios de vuelos
- Reset al tiempo inicial

### ✅ Panel de Búsqueda de Pedidos
- Búsqueda por `orderId`
- Visualización de splits (consignments)
- Detalle de legs con:
  - Secuencia
  - Ruta (from → to)
  - Cantidad
  - Horarios de vuelo (dep/arr)
- Timeline de eventos (si existe)

### ✅ Soporte de Contratos
- Nombres de archivo exactos según especificación
- Estructura de datos JSON conforme a lo definido
- Trabajo exclusivo con códigos ICAO
- Sin conversión ICAO↔IATA

## Criterios de Aceptación Cumplidos

✅ Se cargan los 4 JSON ICAO desde `/public`  
✅ Mapa muestra aeropuertos (ICAO) y rutas  
✅ Aviones se mueven al darle Play  
✅ Tooltip del avión muestra carga = suma de legs.qty por instanceId y capacidad  
✅ Panel permite buscar orderId y ver splits/legs con horarios (dep/arr)  
✅ Trazabilidad opcional si existe timeline_split_icao.json  
✅ Todo funciona sin backend, solo con JSON estáticos  

## Características Adicionales

- **Manejo de errores**: Mensajes informativos si fallan las cargas
- **Estados de carga**: Indicador mientras se cargan los datos
- **Interfaz responsive**: Componentes con z-index apropiados
- **Colores semánticos**: Verde/Naranja/Rojo según ocupación
- **Navegación temporal**: Slider visual con barra de progreso
- **Timeline opcional**: Se maneja gracefully si el archivo no existe

## Cómo Usar

1. Asegurarse de que los archivos JSON estén en `/public`
2. Iniciar el servidor de desarrollo: `npm run dev`
3. Navegar a la página del mapa
4. Los datos se cargarán automáticamente
5. Usar los controles para:
   - Play/Pausa: Controlar la simulación
   - Slider: Navegar manualmente en el tiempo
   - Velocidad: Ajustar qué tan rápido avanza la simulación
   - Panel lateral: Buscar y explorar pedidos

## Tecnologías Utilizadas

- React + TypeScript
- Leaflet (mapas)
- Fetch API (carga de JSON)
- CSS/Tailwind (estilos)

## Notas

- No se introdujeron librerías nuevas innecesarias
- Todo el código trabaja exclusivamente con ICAO
- Los contratos JSON se mantienen exactos según especificación
- La implementación es completamente estática (sin backend)
