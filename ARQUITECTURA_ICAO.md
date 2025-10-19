# Guía de Arquitectura - Simulación ICAO

## Flujo de Datos

```
/public/
├── airports_icao.json ─────┐
├── flight_instances_icao.json ──┤
├── assignments_split_icao.json ─┤
└── timeline_split_icao.json ────┤
                                 │
                                 ▼
                      src/sim/staticSource.ts
                      (loadAirports, loadInstances, etc.)
                                 │
                                 ▼
                         MapPage.tsx
                      (Carga y coordina)
                         │       │
          ┌──────────────┼───────┼──────────────┐
          │              │       │              │
          ▼              ▼       ▼              ▼
    MapView.tsx   OrderPanel  SimControls  SimContext
          │                                     │
          ▼                                     │
    FlightLayer.tsx ◄─────────────────────────┘
    (Renderiza mapa +                  (Tiempo de
     aviones animados)                  simulación)
```

## Componentes Principales

### 1. MapPage (Orquestador)
```typescript
- Carga datos estáticos (useEffect inicial)
- Calcula min/max time desde instancias
- Coordina MapView + OrderPanel + SimControls
```

### 2. MapView (Contenedor del Mapa)
```typescript
- Inicializa Leaflet
- Envuelve con SimProvider
- Renderiza FlightLayer
```

### 3. FlightLayer (Motor de Animación)
```typescript
- Pinta aeropuertos (markers)
- Dibuja rutas (polylines)
- Anima aviones basado en simTime
- Calcula carga por instancia
```

### 4. SimControls (Control de Tiempo)
```typescript
- Botones Play/Pausa/Reset
- Slider de tiempo
- Selector de velocidad
```

### 5. OrderPanel (Búsqueda de Pedidos)
```typescript
- Input de búsqueda
- Lista de pedidos
- Detalle: splits → legs → horarios
- Timeline (opcional)
```

### 6. SimContext (Estado Global)
```typescript
- simTime: tiempo actual de simulación
- playing: estado play/pausa
- timeScale: velocidad (s sim / s real)
- minTime/maxTime: límites
```

## Tipos de Datos (ICAO)

### AirportICAO
```typescript
{
  icao: string           // "SPIM"
  lat: number           // -12.0219
  lon: number           // -77.1143
  name: string          // "Jorge Chávez Intl"
  ...
}
```

### FlightInstance
```typescript
{
  instanceId: string    // "MP-101#2025-10-20T00:00Z"
  origin: string        // "SPIM" (ICAO)
  dest: string          // "EBCI" (ICAO)
  depUtc: string        // "2025-10-20T00:00:00Z"
  arrUtc: string        // "2025-10-20T12:00:00Z"
  capacity: number      // 320
}
```

### AssignmentByOrder
```typescript
{
  orderId: string       // "ORD-004"
  splits: [
    {
      consignmentId: string  // "C-004-A"
      qty: number            // 100
      lineRefs: [...]
      legs: [
        {
          seq: number           // 1
          instanceId: string    // "MP-303#..."
          from: string          // "SPIM" (ICAO)
          to: string            // "UBBB" (ICAO)
          qty: number           // 100
        }
      ]
    }
  ]
}
```

## Algoritmo de Animación

### Posicionamiento de Aviones
```typescript
// Para cada instancia en cada frame:
const now = simTime.getTime()
const depTime = new Date(instance.depUtc).getTime()
const arrTime = new Date(instance.arrUtc).getTime()

// ¿Está el vuelo activo?
const isActive = now >= depTime && now <= arrTime

if (isActive) {
  // Calcular progreso (0 a 1)
  const progress = clamp((now - depTime) / (arrTime - depTime), 0, 1)
  
  // Interpolación lineal
  const lat = lerp(origin.lat, dest.lat, progress)
  const lon = lerp(origin.lon, dest.lon, progress)
  
  // Actualizar marker en el mapa
  marker.setLatLng([lat, lon])
}
```

### Cálculo de Carga
```typescript
// Sumar todas las qty de legs que usan esta instancia
assignments.forEach(order => {
  order.splits.forEach(split => {
    split.legs.forEach(leg => {
      if (leg.instanceId === instance.instanceId) {
        loaded += leg.qty
      }
    })
  })
})

const loadFactor = loaded / instance.capacity
```

## Configuración del Reloj

### Velocidades Disponibles
```
30s/s   = 1 segundo real = 30 segundos sim
1min/s  = 1 segundo real = 1 minuto sim
2min/s  = 1 segundo real = 2 minutos sim  (default)
5min/s  = 1 segundo real = 5 minutos sim
10min/s = 1 segundo real = 10 minutos sim
30min/s = 1 segundo real = 30 minutos sim
1h/s    = 1 segundo real = 1 hora sim
```

### Actualización del Tiempo
```typescript
// Cada 250ms (4 veces por segundo):
const deltaReal = (Date.now() - lastRealTime) / 1000  // segundos
const deltaSimSeconds = deltaReal * timeScale
simTime = new Date(simTime.getTime() + deltaSimSeconds * 1000)
```

## Colores de Estado

```typescript
LOAD_COLORS = {
  LOW: '#4CAF50',      // Verde: carga < 70%
  MEDIUM: '#FF9800',   // Naranja: 70% ≤ carga ≤ 90%
  HIGH: '#F44336',     // Rojo: carga > 90%
  UNKNOWN: '#9E9E9E'   // Gris: sin datos
}
```

## Estructura de Pantalla

```
┌─────────────────────────────────────────────────────────┐
│                    ┌──────────────────┐                 │
│  ┌──────────────┐  │  SimControls     │                 │
│  │ OrderPanel   │  │  - Time display  │                 │
│  │              │  │  - Slider        │                 │
│  │ [Search]     │  │  - Play/Pause    │                 │
│  │              │  │  - Speed select  │                 │
│  │ • ORD-001    │  └──────────────────┘                 │
│  │ • ORD-002    │                                       │
│  │ • ORD-003    │         MAPA LEAFLET                  │
│  │              │                                       │
│  │ [Details]    │      • SPIM (Lima)                    │
│  │  Split 1     │        ✈️ → EBCI                      │
│  │   Leg 1      │      • EBCI (Charleroi)               │
│  │   Leg 2      │        ✈️ → UBBB                      │
│  │              │      • UBBB (Baku)                    │
│  │ [Timeline]   │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

## Puntos Clave de Implementación

### ✅ Sin Backend
- Todo carga desde archivos JSON estáticos
- Fetch directo a `/public/*.json`
- No hay llamadas API

### ✅ Solo ICAO
- Todos los códigos de aeropuerto usan ICAO
- No hay conversión IATA ↔ ICAO
- Consistencia total en el modelo de datos

### ✅ Split-Aware
- Pedidos pueden tener múltiples splits (consignments)
- Cada split puede tener múltiples legs
- Timeline rastrea eventos por consignmentId

### ✅ Animación Suave
- Interpolación lineal entre aeropuertos
- Actualización cada 250ms
- Rotación del ícono según dirección

### ✅ Interfaz Completa
- Mapa interactivo
- Controles de simulación
- Panel de búsqueda
- Timeline de eventos
