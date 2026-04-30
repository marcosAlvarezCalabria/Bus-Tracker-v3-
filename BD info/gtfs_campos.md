# Campos GTFS — para qué sirve cada uno

## GTFS-RT · `trip_update.trip`

| Campo | Ejemplo real | Para qué sirve | Web | ML |
|---|---|---|:---:|:---:|
| `trip_id` | `"5578_69876"` | Identifica el viaje concreto. Une GTFS-RT con GTFS estático para sacar nombre de paradas, destino y horario base. | ✅ | ✅ |
| `route_id` | `"5578_131646"` | Identifica la línea. Con esto sacamos el número de ruta que ve el usuario (ej. "401"). | ✅ | ✅ |
| `start_date` | `"20260429"` | Fecha del viaje. Importante para ML: día de semana, festivo, época del año afectan el retraso. **Guardar como DATE, nunca convertir a timestamp.** | ❌ | ✅ |
| `start_time` | `"06:00:00"` | Hora programada de salida. Para ML: la hora del día es clave (hora punta vs noche). **Guardar como string.** | ❌ | ✅ |
| `direction_id` | `0` o `1` | Dirección del viaje. 0 = ida, 1 = vuelta. Con `trip_headsign` del GTFS estático → destino legible ("Eyre Square"). | ✅ | ✅ |

---

## GTFS-RT · `stop_time_update` (una por cada parada activa)

> Solo llegan las paradas que tienen delay activo, no todas las del viaje.

| Campo | Ejemplo real | Para qué sirve | Web | ML |
|---|---|---|:---:|:---:|
| `stop_id` | `"8240B111911"` | Parada concreta. Con GTFS estático → nombre legible. **Prefijo 8240 = Galway.** | ✅ | ✅ |
| `stop_sequence` | `26` | Posición de la parada en la ruta. Útil para saber cuántas paradas faltan. No se muestra al usuario. | ❌ | ✅ |
| `arrival.delay` | `1372` (seg) | Retraso en segundos al llegar. 1372 seg = ~23 min tarde. Negativo = adelantado. **El dato principal de todo el sistema.** | ✅ | ✅ |
| `departure.delay` | `1460` (seg) | Retraso en segundos al salir. Puede diferir del arrival si el bus espera en la parada. | ❌ | ✅ |
| `arrival.time` | **NO EXISTE** | No viene en el feed. La hora real se calcula: `stop_times.arrival_time + delay`. | — | — |
| `schedule_relationship` | `"SCHEDULED"` | Estado de la parada. `SCHEDULED` = normal, `SKIPPED` = el bus no para aquí, `NO_DATA` = sin info. Útil para no mostrar predicciones falsas. | ✅ | ❌ |

---

## GTFS-RT · `vehicle`

| Campo | Ejemplo real | Para qué sirve | Web | ML |
|---|---|---|:---:|:---:|
| `vehicle.id` | `"7029"` | ID del vehículo físico. **No siempre presente.** Útil para ML: algunos vehículos son más puntuales que otros. | ❌ | ✅ |

---

## GTFS estático (se importa una vez, no viene en RT)

| Campo | Ejemplo real | Para qué sirve | Web | ML |
|---|---|---|:---:|:---:|
| `stop_times.arrival_time` | `"08:32:00"` | Horario base programado. Base para calcular hora real = este valor + delay. **Guardar como VARCHAR** (puede ser >24h, ej. "25:30:00"). | ✅ | ✅ |
| `trips.trip_headsign` | `"Eyre Square"` | Destino del bus, el cartel que ves en la calle. Se muestra directamente en la web. | ✅ | ❌ |
| `stops.stop_name` | `"Eyre Square"` | Nombre legible de la parada. Se muestra en la web en vez del `stop_id`. | ✅ | ❌ |
| `routes.route_short_name` | `"401"` | Número de línea que ve el usuario. Mucho más útil que `route_id` para la web. | ✅ | ❌ |

---

## Fórmula clave

```
hora_real_llegada = stop_times.arrival_time + arrival.delay (segundos)
```

El GTFS-RT nunca trae la hora absoluta, solo el desvío respecto al horario base.

---

## Prefijos stop_id por zona

| Prefijo | Zona |
|---|---|
| `8240` | Galway |
| `8530` | Midlands / Athlone |
| `8490` | Connacht |
| `7010` | Dublin |

