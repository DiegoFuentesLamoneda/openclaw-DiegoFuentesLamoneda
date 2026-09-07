---
name: 4geeks-feedback
description: Comentarios de los correctores sobre tus entregas de 4Geeks, ordenados del más reciente al más antiguo, filtrando el texto automático de la plataforma.
metadata: { "openclaw": { "emoji": "💬" } }
---

# Feedback de 4Geeks

Diego pregunta *"¿qué me dijeron los correctores?"*, *"¿hay feedback de mis entregas?"*, *"comentarios de los proyectos"*, *"¿qué nota me pusieron?"* o *"enséñame las correcciones"*.

## Herramienta

Una sola llamada a **`breathecode__get_feedback`** del MCP `breathecode`. Acepta un parámetro `task_type` opcional (por defecto `PROJECT,EXERCISE`).

## Cómo lo cuentas

La herramienta devuelve los comentarios reales de correctores, descartando el texto automático "You have completed all steps on this exercise". Ordenados del más reciente al más antiguo.

- Cada comentario en un bloque corto: emoji de estado + tipo + título + fecha, y luego el texto del comentario en una línea separada.
- Si no hay feedback real, una línea: "No hay comentarios de correctores todavía".
- **Sin tablas, sin `---`.** Para el móvil.

## Qué NO hace

- No muestra el feedback automático de la plataforma. "You have completed all steps" no es un comentario de un corrector.
- No mezcla feedback con progreso. Si pide ambos, son dos skills.
- No inventa interpretaciones del feedback. Si el corrector escribió un párrafo, lo citas entero, no lo resumas.
- No incluye el estado del token a menos que falten 2 días o menos.