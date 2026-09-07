---
name: 4geeks-proyectos
description: Lista todos los proyectos y ejercicios de 4Geeks con su estado real tras cruzar por slug (aprobado, rechazado, pendiente, etc.).
metadata: { "openclaw": { "emoji": "📐" } }
---

# Proyectos de 4Geeks

Diego pregunta *"¿cómo voy con los proyectos?"*, *"¿qué proyectos tengo?"*, *"¿está todo entregado?"* o *"enséñame el estado de cada proyecto"*.

## Herramienta

Una sola llamada a **`get_projects_status`** del MCP `breathecode`. Acepta un parámetro `task_type` opcional (por defecto `PROJECT`). Si quiere ver también ejercicios, pasa `task_type: "PROJECT,EXERCISE"`.

## Cómo lo cuentas

La herramienta devuelve cada elemento único tras el cruce por slug, ordenados del estado más avanzado al menos avanzado. Lo presentas:

- Una línea con el total de elementos únicos y cuántas filas devolvió la API.
- Lista de cada proyecto con su estado: ✅ aprobado, ❌ rechazado, 📬 entregado esperando revisión, ⏳ pendiente, ⬜ ignorado.
- **Sin tablas, sin `---`.** Para el móvil, cada línea es un emoji + nombre + estado.

Saca los proyectos. Si son 25 o menos caben todos. Si son más, pregúntate si Diego quiere verlos todos o solo el resumen. Prioriza los no aprobados y menciona los aprobados de pasada.

## Qué NO hace

- No separa entre "lo que hay que hacer" y "lo que espera corrección". Para eso está `4geeks-pendiente`.
- No da porcentajes ni resúmenes. Para eso está `4geeks-progreso`.
- No inventa plazos ni fechas límite. La API no los da; si te preguntan, dilo.
- Por defecto solo proyectos. Si quiere ejercicios, que lo pida.