import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Aeropuertos con fuente infinita (hubs principales)
const HUBS = ['SPIM', 'EBCI', 'UBBB'];

// Offsets de zona horaria por aeropuerto (horas respecto a UTC)
const TIMEZONE_OFFSETS = {
  'SKBO': -5, 'SEQM': -5, 'SVMI': -4, 'SBBR': -3, 'SPIM': -5,
  'SLLP': -4, 'SCEL': -3, 'SABE': -3, 'SGAS': -4, 'SUAA': -3,
  'LATI': +2, 'EDDI': +2, 'LOWW': +2, 'EBCI': +2, 'UMMS': +3,
  'LBSF': +3, 'LKPR': +2, 'LDZA': +2, 'EKCH': +2, 'EHAM': +2,
  'VIDP': +5, 'OSDI': +3, 'OERK': +3, 'OMDB': +4, 'OAKB': +4,
  'OOMS': +4, 'OYSN': +3, 'OPKC': +5, 'UBBB': +4, 'OJAI': +3
};

// Función para convertir hora local a UTC
function localToUTC(date, timeStr, tzOffset) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const utcDate = new Date(date);
  utcDate.setUTCHours(hours - tzOffset, minutes, 0, 0);
  return utcDate;
}

// Función para parsear formato de hora HH:MM
function parseTime(timeStr) {
  return timeStr.split(':').map(Number);
}

// Cargar y parsear vuelos.txt
function loadFlights() {
  const content = fs.readFileSync(path.join(__dirname, 'public/data/vuelos.txt'), 'utf-8');
  const lines = content.trim().split('\n');
  
  return lines.map(line => {
    const [origin, dest, depTime, arrTime, capacity] = line.split(',');
    return {
      origin: origin.trim(),
      dest: dest.trim(),
      depTime: depTime.trim(),
      arrTime: arrTime.trim(),
      capacity: parseInt(capacity.trim(), 10)
    };
  }).filter(flight => 
    // Solo vuelos que conectan con los hubs
    HUBS.includes(flight.origin) || HUBS.includes(flight.dest)
  );
}

// Cargar y parsear pedidos.txt
function loadOrders() {
  const content = fs.readFileSync(path.join(__dirname, 'public/data/pedidos.txt'), 'utf-8');
  const lines = content.trim().split('\n');
  
  return lines
    .map((line, idx) => {
      const parts = line.split('-');
      const day = parseInt(parts[0], 10);
      const hour = parseInt(parts[1], 10);
      const minute = parseInt(parts[2], 10);
      const dest = parts[3];
      const qty = parseInt(parts[4], 10);
      const clientId = parts[5];
      
      // Asignar origen aleatorio desde un hub
      const origin = HUBS[Math.floor(Math.random() * HUBS.length)];
      
      return {
        day,
        hour,
        minute,
        origin,
        dest,
        qty,
        clientId,
        orderId: `ORD-${String(idx + 1).padStart(3, '0')}`,
        date: null, // Se calculará en base a startDate
        lineIndex: idx // Para tracking
      };
    })
    .filter((order) => {
      // FILTRAR pedidos que tienen como destino un HUB (fuente infinita)
      if (HUBS.includes(order.dest)) {
        console.log(`⚠️  Pedido ignorado (línea ${order.lineIndex + 1}): destino ${order.dest} es una fuente infinita`);
        return false;
      }
      return true;
    });
}

// Generar instancias de vuelos para 7 días
function generateFlightInstances(flights, startDate) {
  const instances = [];
  let flightCounter = 1;
  
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    flights.forEach(flight => {
      const currentDate = new Date(startDate);
      currentDate.setUTCDate(currentDate.getUTCDate() + dayOffset);
      
      // Usar hora directamente como UTC (sin conversiones de zona horaria)
      const [depH, depM] = parseTime(flight.depTime);
      const depUtc = new Date(currentDate);
      depUtc.setUTCHours(depH, depM, 0, 0);
      
      // Calcular duración del vuelo
      const [arrH, arrM] = parseTime(flight.arrTime);
      let durationMinutes = (arrH * 60 + arrM) - (depH * 60 + depM);
      
      // Si la duración es negativa, el vuelo llega al día siguiente
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60;
      }
      
      const arrUtc = new Date(depUtc.getTime() + durationMinutes * 60 * 1000);
      
      const instanceId = `MP-${String(flightCounter).padStart(3, '0')}#${depUtc.toISOString()}`;
      
      instances.push({
        instanceId,
        flightId: `MP-${String(flightCounter).padStart(3, '0')}`,
        origin: flight.origin,
        dest: flight.dest,
        depUtc: depUtc.toISOString(),
        arrUtc: arrUtc.toISOString(),
        capacity: flight.capacity
      });
      
      flightCounter++;
    });
  }
  
  return instances;
}

// Encontrar mejor vuelo para un pedido
function findBestFlight(order, instances, startDate) {
  const orderDate = new Date(startDate);
  orderDate.setDate(orderDate.getDate() + order.day - 1);
  orderDate.setUTCHours(order.hour, order.minute, 0, 0);
  
  // Buscar vuelo directo desde hub a destino
  const directFlights = instances.filter(inst => {
    const depTime = new Date(inst.depUtc);
    return HUBS.includes(inst.origin) &&
           inst.dest === order.dest &&
           depTime >= orderDate &&
           inst.capacity >= order.qty;
  }).sort((a, b) => new Date(a.depUtc) - new Date(b.depUtc));
  
  if (directFlights.length > 0) {
    return {
      type: 'direct',
      flights: [directFlights[0]]
    };
  }
  
  // Buscar vuelo con conexión (hub → hub → destino)
  for (const hub of HUBS) {
    const firstLeg = instances.filter(inst => {
      const depTime = new Date(inst.depUtc);
      return HUBS.includes(inst.origin) &&
             HUBS.includes(inst.dest) &&
             inst.dest === hub &&
             depTime >= orderDate &&
             inst.capacity >= order.qty;
    }).sort((a, b) => new Date(a.depUtc) - new Date(b.depUtc))[0];
    
    if (firstLeg) {
      const firstArrival = new Date(firstLeg.arrUtc);
      const secondLeg = instances.filter(inst => {
        const depTime = new Date(inst.depUtc);
        return inst.origin === hub &&
               inst.dest === order.dest &&
               depTime > firstArrival &&
               depTime <= new Date(firstArrival.getTime() + 12 * 60 * 60 * 1000) && // Max 12h espera
               inst.capacity >= order.qty;
      }).sort((a, b) => new Date(a.depUtc) - new Date(b.depUtc))[0];
      
      if (secondLeg) {
        return {
          type: 'connection',
          flights: [firstLeg, secondLeg]
        };
      }
    }
  }
  
  return null;
}

// Buscar múltiples rutas al mismo destino para particionamiento
function findMultipleRoutesToSameDestination(order, instances, startDate, numSplits) {
  const orderDate = new Date(startDate);
  orderDate.setDate(orderDate.getDate() + order.day - 1);
  orderDate.setUTCHours(order.hour, order.minute, 0, 0);
  
  const routes = [];
  const usedInstances = new Set();
  
  // Buscar múltiples vuelos directos al mismo destino
  const directFlights = instances.filter(inst => {
    const depTime = new Date(inst.depUtc);
    return HUBS.includes(inst.origin) &&
           inst.dest === order.dest &&
           depTime >= orderDate &&
           !usedInstances.has(inst.instanceId);
  }).sort((a, b) => new Date(a.depUtc) - new Date(b.depUtc));
  
  // Agregar vuelos directos disponibles
  for (let i = 0; i < Math.min(numSplits, directFlights.length); i++) {
    routes.push({
      type: 'direct',
      flights: [directFlights[i]]
    });
    usedInstances.add(directFlights[i].instanceId);
  }
  
  // Si necesitamos más rutas, buscar conexiones
  while (routes.length < numSplits) {
    let found = false;
    
    for (const hub of HUBS) {
      const firstLeg = instances.filter(inst => {
        const depTime = new Date(inst.depUtc);
        return HUBS.includes(inst.origin) &&
               HUBS.includes(inst.dest) &&
               inst.dest === hub &&
               depTime >= orderDate &&
               !usedInstances.has(inst.instanceId);
      }).sort((a, b) => new Date(a.depUtc) - new Date(b.depUtc))[0];
      
      if (firstLeg) {
        const firstArrival = new Date(firstLeg.arrUtc);
        const secondLeg = instances.filter(inst => {
          const depTime = new Date(inst.depUtc);
          return inst.origin === hub &&
                 inst.dest === order.dest &&
                 depTime > firstArrival &&
                 depTime <= new Date(firstArrival.getTime() + 12 * 60 * 60 * 1000) &&
                 !usedInstances.has(inst.instanceId);
        }).sort((a, b) => new Date(a.depUtc) - new Date(b.depUtc))[0];
        
        if (secondLeg) {
          routes.push({
            type: 'connection',
            flights: [firstLeg, secondLeg]
          });
          usedInstances.add(firstLeg.instanceId);
          usedInstances.add(secondLeg.instanceId);
          found = true;
          break;
        }
      }
    }
    
    if (!found) break; // No hay más rutas disponibles
  }
  
  return routes;
}

// Generar asignaciones
function generateAssignments(orders, instances, startDate) {
  const assignments = [];
  
  orders.forEach(order => {
    // Determinar si particionar el pedido
    // Criterios: cantidad grande (>150) o aleatoriamente (20% de probabilidad)
    const shouldPartition = order.qty > 150 || (order.qty > 100 && Math.random() < 0.2);
    
    if (!shouldPartition) {
      // Asignación simple: 1 split, 1 o 2 legs
      const route = findBestFlight(order, instances, startDate);
      
      if (!route) {
        console.warn(`No se encontró ruta para el pedido ${order.orderId}`);
        return;
      }
      
      const legs = route.flights.map((flight, idx) => ({
        seq: idx + 1,
        instanceId: flight.instanceId,
        from: flight.origin,
        to: flight.dest,
        qty: order.qty
      }));
      
      const splits = [{
        consignmentId: `C-${order.orderId.split('-')[1]}-1`,
        qty: order.qty,
        legs
      }];
      
      assignments.push({
        orderId: order.orderId,
        splits
      });
    } else {
      // Particionamiento: dividir en 2-3 splits AL MISMO DESTINO
      const numSplits = order.qty > 250 ? 3 : 2;
      const routes = findMultipleRoutesToSameDestination(order, instances, startDate, numSplits);
      
      if (routes.length === 0) {
        console.warn(`No se encontró ruta para el pedido particionado ${order.orderId}`);
        return;
      }
      
      // Dividir cantidad entre splits disponibles
      const qtyPerSplit = Math.ceil(order.qty / routes.length);
      const splits = [];
      let remainingQty = order.qty;
      
      routes.forEach((route, splitIdx) => {
        const splitQty = Math.min(qtyPerSplit, remainingQty);
        remainingQty -= splitQty;
        
        if (splitQty <= 0) return;
        
        const legs = route.flights.map((flight, legIdx) => ({
          seq: legIdx + 1,
          instanceId: flight.instanceId,
          from: flight.origin,
          to: flight.dest,
          qty: splitQty
        }));
        
        splits.push({
          consignmentId: `C-${order.orderId.split('-')[1]}-${String.fromCharCode(65 + splitIdx)}`,
          qty: splitQty,
          legs
        });
      });
      
      if (splits.length > 0) {
        assignments.push({
          orderId: order.orderId,
          splits
        });
      }
    }
  });
  
  return assignments;
}

// Generar timeline
function generateTimeline(assignments, instances) {
  const events = [];
  
  assignments.forEach(assignment => {
    assignment.splits.forEach(split => {
      split.legs.forEach((leg, legIdx) => {
        const instance = instances.find(i => i.instanceId === leg.instanceId);
        if (!instance) return;
        
        const depTime = new Date(instance.depUtc);
        const arrTime = new Date(instance.arrUtc);
        
        // WAIT_START: 50 min antes del despegue
        const waitStart = new Date(depTime.getTime() - 50 * 60 * 1000);
        events.push({
          ts: waitStart.toISOString(),
          type: 'WAIT_START',
          orderId: assignment.orderId,
          consignmentId: split.consignmentId,
          airport: leg.from
        });
        
        // WAIT_END: 5 min antes del despegue
        const waitEnd = new Date(depTime.getTime() - 5 * 60 * 1000);
        events.push({
          ts: waitEnd.toISOString(),
          type: 'WAIT_END',
          orderId: assignment.orderId,
          consignmentId: split.consignmentId,
          airport: leg.from
        });
        
        // LOAD: Momento del despegue
        events.push({
          ts: depTime.toISOString(),
          type: 'LOAD',
          orderId: assignment.orderId,
          consignmentId: split.consignmentId,
          instanceId: leg.instanceId,
          from: leg.from,
          to: leg.to,
          qty: leg.qty
        });
        
        // ARRIVAL: Momento de llegada
        events.push({
          ts: arrTime.toISOString(),
          type: 'ARRIVAL',
          orderId: assignment.orderId,
          consignmentId: split.consignmentId,
          instanceId: leg.instanceId,
          from: leg.from,
          to: leg.to,
          qty: leg.qty,
          at: leg.to
        });
        
        // PICKUP_READY: Solo si es el último leg
        if (legIdx === split.legs.length - 1) {
          events.push({
            ts: arrTime.toISOString(),
            type: 'PICKUP_READY',
            orderId: assignment.orderId,
            consignmentId: split.consignmentId,
            at: leg.to,
            qty: leg.qty
          });
        }
      });
    });
  });
  
  // Ordenar por timestamp
  events.sort((a, b) => new Date(a.ts) - new Date(b.ts));
  
  return events;
}

// Main
function main() {
  console.log('🚀 Generando datos expandidos...\n');
  
  const startDate = '2025-10-20T00:00:00Z';
  
  console.log('📂 Cargando archivos originales...');
  const flights = loadFlights();
  const orders = loadOrders();
  console.log(`   ✅ ${flights.length} vuelos cargados (filtrados a hubs)`);
  console.log(`   ✅ ${orders.length} pedidos cargados\n`);
  
  console.log('✈️  Generando instancias de vuelos para 7 días...');
  const instances = generateFlightInstances(flights, startDate);
  console.log(`   ✅ ${instances.length} instancias generadas\n`);
  
  console.log('📦 Generando asignaciones de pedidos...');
  const assignments = generateAssignments(orders, instances, startDate);
  console.log(`   ✅ ${assignments.length} asignaciones creadas\n`);
  
  console.log('⏱️  Generando timeline de eventos...');
  const timeline = generateTimeline(assignments, instances);
  console.log(`   ✅ ${timeline.length} eventos generados\n`);
  
  // Guardar archivos
  console.log('💾 Guardando archivos JSON...');
  fs.writeFileSync(
    path.join(__dirname, 'public/flight_instances_icao.json'),
    JSON.stringify(instances, null, 2)
  );
  console.log('   ✅ flight_instances_icao.json');
  
  fs.writeFileSync(
    path.join(__dirname, 'public/assignments_split_icao.json'),
    JSON.stringify(assignments, null, 2)
  );
  console.log('   ✅ assignments_split_icao.json');
  
  fs.writeFileSync(
    path.join(__dirname, 'public/timeline_split_icao.json'),
    JSON.stringify(timeline, null, 2)
  );
  console.log('   ✅ timeline_split_icao.json');

  // ========== VALIDACIÓN DE COHERENCIA ==========
  console.log('\n🔍 Validando coherencia de datos...');
  
  let errors = 0;
  let warnings = 0;

  // 1. Verificar que todos los instanceIds en assignments existen en instances
  console.log('\n1️⃣ Validando instanceIds en asignaciones...');
  const instanceIds = new Set(instances.map(i => i.instanceId));
  assignments.forEach(assignment => {
    assignment.splits.forEach((split, splitIdx) => {
      split.legs.forEach((leg, legIdx) => {
        if (!instanceIds.has(leg.instanceId)) {
          console.error(`   ❌ ERROR: Pedido ${assignment.orderId}, split ${splitIdx}, leg ${legIdx}: instanceId ${leg.instanceId} no existe`);
          errors++;
        }
      });
    });
  });
  if (errors === 0) console.log('   ✅ Todos los instanceIds son válidos');

  // 2. Verificar que todos los vuelos parten o llegan a un HUB
  console.log('\n2️⃣ Validando que vuelos conectan con HUBs...');
  let hubWarnings = 0;
  instances.forEach(inst => {
    const hasHub = HUBS.includes(inst.origin) || HUBS.includes(inst.dest);
    if (!hasHub) {
      if (hubWarnings < 5) {
        console.warn(`   ⚠️  WARNING: Vuelo ${inst.instanceId} (${inst.origin} → ${inst.dest}) no conecta con ningún HUB`);
      }
      hubWarnings++;
    }
  });
  if (hubWarnings === 0) {
    console.log('   ✅ Todos los vuelos conectan con HUBs');
  } else {
    console.log(`   ⚠️  ${hubWarnings} vuelos no conectan con HUBs`);
    warnings += hubWarnings;
  }

  // 3. Verificar que los pedidos particionados llegan al mismo destino
  console.log('\n3️⃣ Validando convergencia de pedidos particionados...');
  let partitionErrors = 0;
  assignments.forEach(assignment => {
    if (assignment.splits.length > 1) {
      const destinations = assignment.splits.map(split => {
        const lastLeg = split.legs[split.legs.length - 1];
        const instance = instances.find(i => i.instanceId === lastLeg.instanceId);
        return instance ? instance.dest : null;
      });
      
      const uniqueDests = new Set(destinations.filter(d => d !== null));
      if (uniqueDests.size > 1) {
        console.error(`   ❌ ERROR: Pedido ${assignment.orderId} tiene splits con destinos diferentes: ${Array.from(uniqueDests).join(', ')}`);
        partitionErrors++;
      }
    }
  });
  if (partitionErrors === 0) {
    console.log('   ✅ Todos los pedidos particionados convergen al mismo destino');
  }
  errors += partitionErrors;

  // 4. Verificar que eventos en timeline corresponden a asignaciones válidas
  console.log('\n4️⃣ Validando eventos del timeline...');
  const consignmentIds = new Set();
  assignments.forEach(a => {
    a.splits.forEach(split => {
      consignmentIds.add(split.consignmentId);
    });
  });
  
  let timelineErrors = 0;
  timeline.forEach(event => {
    if (!consignmentIds.has(event.consignmentId)) {
      if (timelineErrors < 5) {
        console.error(`   ❌ ERROR: Evento con consignmentId ${event.consignmentId} no existe en asignaciones`);
      }
      timelineErrors++;
    }
    if (event.instanceId && !instanceIds.has(event.instanceId)) {
      if (timelineErrors < 5) {
        console.error(`   ❌ ERROR: Evento con instanceId ${event.instanceId} no existe en vuelos`);
      }
      timelineErrors++;
    }
  });
  if (timelineErrors === 0) {
    console.log('   ✅ Todos los eventos del timeline son válidos');
  } else {
    console.log(`   ❌ ${timelineErrors} errores en el timeline`);
    errors += timelineErrors;
  }

  // 5. Verificar duración de la simulación (7 días)
  console.log('\n5️⃣ Validando duración de simulación...');
  const departureDates = instances
    .map(i => new Date(i.depUtc))
    .filter(d => !isNaN(d.getTime()));
  
  if (departureDates.length > 0) {
    const minDep = new Date(Math.min(...departureDates));
    const maxDep = new Date(Math.max(...departureDates));
    
    // Calcular días calendario (no redondear)
    const depDays = Math.floor((maxDep - minDep) / (1000 * 60 * 60 * 24));
    
    // Calcular rango total incluyendo llegadas
    const allDates = instances
      .flatMap(i => [new Date(i.depUtc), new Date(i.arrUtc)])
      .filter(d => !isNaN(d.getTime()));
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    const totalDays = Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24));
    
    console.log(`   📅 Días de despegues: ${depDays + 1} días calendario (${minDep.toISOString().split('T')[0]} a ${maxDep.toISOString().split('T')[0]})`);
    console.log(`   📅 Rango total (con llegadas): ${totalDays + 1} días (${minDate.toISOString().split('T')[0]} a ${maxDate.toISOString().split('T')[0]})`);
    
    if (depDays < 7) {
      console.log(`   ✅ Duración de 7 días de simulación confirmada (${depDays + 1} días calendario)`);
    } else {
      console.warn(`   ⚠️  WARNING: Simulación debería generar vuelos en 7 días, pero genera en ${depDays + 1} días`);
      warnings++;
    }
  } else {
    console.error('   ❌ ERROR: No hay fechas válidas en las instancias de vuelos');
    errors++;
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  if (errors === 0 && warnings === 0) {
    console.log('✅ VALIDACIÓN EXITOSA: Todos los datos son coherentes');
  } else {
    console.log(`⚠️  VALIDACIÓN COMPLETADA con ${errors} errores y ${warnings} advertencias`);
  }
  console.log('='.repeat(60));
  
  console.log('\n🎉 ¡Generación completa!\n');
  console.log('📊 Resumen:');
  console.log(`   - Instancias de vuelos: ${instances.length}`);
  console.log(`   - Pedidos asignados: ${assignments.length}`);
  console.log(`   - Eventos de timeline: ${timeline.length}`);
}

main();
