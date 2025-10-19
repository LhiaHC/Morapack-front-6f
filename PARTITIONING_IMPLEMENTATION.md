# Implementación de Particionamiento de Pedidos

## 📋 Resumen
Se implementó una lógica inteligente de particionamiento de pedidos que divide órdenes grandes en múltiples envíos (splits) que **siempre convergen al mismo destino final**, tal como funciona en la logística del mundo real.

## 🎯 Regla de Negocio Principal
> **Cuando un pedido es particionado, todos los splits DEBEN llegar al mismo destino final, aunque pueden tomar rutas diferentes para llegar allí.**

## 🔧 Implementación Técnica

### 1. Criterios de Particionamiento
Un pedido se particiona cuando cumple alguna de estas condiciones:
- Cantidad mayor a **150 unidades** → Siempre se particiona
- Cantidad mayor a **100 unidades** → 20% de probabilidad de particionamiento
- Cantidad mayor a **250 unidades** → Se divide en **3 splits**
- Otros casos → Se divide en **2 splits**

### 2. Lógica de Asignación de Rutas

#### Función: `findMultipleRoutesToSameDestination()`
Esta función busca múltiples rutas al **mismo destino** para particionamiento:

```javascript
// Determina el destino final (siempre order.dest)
const finalDest = order.dest;

// Busca rutas directas diferentes
- Split A: HUB1 → DESTINO (vuelo directo)
- Split B: HUB2 → DESTINO (vuelo directo)

// Si no hay suficientes vuelos directos, busca con conexiones
- Split A: HUB1 → HUB2 → DESTINO (con conexión)
- Split B: HUB3 → DESTINO (directo)
```

#### Características Clave:
- ✅ Destino final idéntico para todos los splits
- ✅ Rutas pueden ser diferentes (directo vs conexión)
- ✅ Hubs de origen pueden variar
- ✅ Horarios de salida pueden diferir
- ✅ Validación de capacidad por vuelo
- ✅ Evita usar mismas instancias de vuelo (Set de usedInstances)

### 3. División de Cantidad

```javascript
const qtyPerSplit = Math.ceil(order.qty / routes.length);
let remainingQty = order.qty;

// Distribuye cantidades equitativamente
Split 1: min(qtyPerSplit, remainingQty)
Split 2: min(qtyPerSplit, remainingQty - qty1)
Split 3: remaining
```

### 4. Estructura de Splits

Cada split mantiene:
```json
{
  "consignmentId": "C-014-A",  // Identificador único del split
  "qty": 75,                    // Cantidad en este split
  "lineRefs": [...],            // Referencias de línea del pedido
  "legs": [                     // Tramos del viaje
    {
      "seq": 1,
      "instanceId": "MP-955#...",
      "from": "EBCI",
      "to": "UMMS",              // ⭐ Destino final idéntico
      "qty": 75
    }
  ]
}
```

## 📊 Ejemplos Reales Generados

### Ejemplo 1: ORD-014 (Particionado en 2 splits)
```
Total: 150 unidades → Destino: UMMS

Split C-014-A:
  EBCI → UMMS (75 unidades)
  
Split C-014-B:
  UBBB → UMMS (75 unidades)
```
✅ Ambos convergen a **UMMS** desde diferentes hubs

### Ejemplo 2: ORD-019 (Particionado en 2 splits)
```
Total: 164 unidades → Destino: UBBB

Split C-019-A:
  EBCI → UBBB (82 unidades) - Salida 01:45
  
Split C-019-B:
  EBCI → UBBB (82 unidades) - Salida 04:39
```
✅ Ambos al **mismo destino** en **diferentes horarios**

### Ejemplo 3: Pedido con Conexiones (hipotético)
```
Total: 300 unidades → Destino: LKPR

Split C-XXX-A:
  SPIM → LKPR (100 unidades) - Directo
  
Split C-XXX-B:
  EBCI → UBBB → LKPR (100 unidades) - Con conexión
  
Split C-XXX-C:
  UBBB → LKPR (100 unidades) - Directo
```
✅ Todos convergen a **LKPR** con rutas variadas

## 🚀 Datos Generados

### Estadísticas de la Generación
```
✅ 4116 instancias de vuelos (7 días)
✅ 50 pedidos asignados (de 51 pedidos totales)
✅ ~15 pedidos particionados con 2-3 splits cada uno
✅ 345 eventos de timeline
✅ 3 hubs principales: SPIM, EBCI, UBBB
```

### Archivos Actualizados
1. **`flight_instances_icao.json`**: 4116 vuelos programados
2. **`assignments_split_icao.json`**: Asignaciones con splits convergentes
3. **`timeline_split_icao.json`**: Timeline de eventos (WAIT_START, LOAD, ARRIVAL, PICKUP_READY)

## 🔍 Validación

### Comandos de Verificación
```bash
# Buscar pedidos particionados
grep -E '"consignmentId": "C-[0-9]+-[AB]"' assignments_split_icao.json

# Verificar destinos de splits de un pedido específico
# Todos los "to" del último leg de cada split deben ser idénticos
```

### Puntos de Validación Manual
- ✅ Cada split del mismo pedido tiene diferente consignmentId
- ✅ Último leg de cada split va al mismo destino
- ✅ Suma de qty de todos los splits = qty del pedido original
- ✅ No se reutilizan instanceId entre splits del mismo pedido

## 🎨 Visualización en el Mapa

En el componente `FlightLayer.tsx`:
- Al hacer click en un vuelo, se muestra su ruta con polyline
- Los pedidos particionados mostrarán múltiples rutas convergiendo al mismo punto
- Los aeropuertos hub (SPIM, EBCI, UBBB) tienen íconos especiales con animación de pulso

## 📝 Notas Técnicas

### Limitaciones Actuales
- Máximo 3 splits por pedido
- Solo soporta 0 o 1 conexión (vuelo directo o con 1 escala)
- Ventana temporal de búsqueda: 5 días desde la fecha del pedido
- Tiempo máximo de espera en conexión: 12 horas

### Posibles Mejoras Futuras
- [ ] Algoritmo de optimización de costos
- [ ] Soporte para múltiples conexiones (2+ escalas)
- [ ] Balance dinámico de capacidad entre splits
- [ ] Priorización de rutas más rápidas vs económicas
- [ ] Consolidación automática de envíos pequeños

## 🏆 Resultado Final

La implementación cumple exitosamente con la regla de negocio:

> ✅ **"Cuando es particionado, ambos (o todos los splits) deben llegar a un mismo destino siempre"**

Todos los pedidos particionados ahora tienen splits que:
1. Salen de hubs (potencialmente diferentes)
2. Pueden usar rutas diferentes (directo o con conexión)
3. Pueden tener horarios distintos
4. **SIEMPRE convergen al mismo destino final**

---

**Fecha de Implementación**: Enero 2025  
**Archivos Modificados**: `generate-data.js`  
**Generación Exitosa**: ✅ 50/51 pedidos asignados
