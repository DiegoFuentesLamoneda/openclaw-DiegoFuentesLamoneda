---
name: 4geeks-progreso
description: Resumen general del curso 4Geeks con desglose por tipo (proyectos y ejercicios), porcentajes y verificación de que los cubos cuadran.
metadata: { "openclaw": { "emoji": "📊" } }
---

# Progreso de 4Geeks

Diego pregunta *"¿cómo voy de porcentaje?"*, *"¿cuánto llevo del curso?"*, *"resumen general"*, *"¿qué tal voy?"* o *"enséñame las métricas"*.

## Herramienta

Una sola llamada a **`breathecode__get_progress`** del MCP `breathecode`. No necesita parámetros.

## Cómo lo cuentas

La herramienta devuelve un desglose exhaustivo. Lo presentas:

- **Totales**: únicos tras cruce por slug, cuántas filas trajo la API.
- **Desglose por tipo** con su propio porcentaje:
  - Proyectos: X total, Y aprobados = Z%
  - Ejercicios: X total, Y aprobados = Z%
  *(El porcentaje mezclado no sirve de nada — 16 proyectos aprobados de 25 es muy distinto a 27 ejercicios de 96)*
- **Cubos**: aprobados, rechazados, sin entregar, esperando revisión, hechos sin revisión formal. Los números tienen que sumar el total. Si no cuadran, avísalo en vez de callártelo.

El estado del token **no se menciona** a menos que queden 2 días o menos, o haya caducado.

## Qué NO hace

- No confunde token caducado con progreso. Si el token falla, la respuesta es "renueva el token", no un resumen con ceros.
- No inventa fechas ni plazos.
- No lista elementos uno a uno. Si Diego quiere el detalle, que use `4geeks-proyectos` o `4geeks-pendiente`.
- No da recomendaciones de qué hacer a continuación. Un resumen es un resumen, no un plan de trabajo.