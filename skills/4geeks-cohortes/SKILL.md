---
name: 4geeks-cohortes
description: Muestra las cohortes de 4Geeks en las que estás inscrito, sabiendo que la principal es spain-aie-pt-4 y las demás son módulos y prework.
metadata: { "openclaw": { "emoji": "🏫" } }
---

# Cohortes de 4Geeks

Diego pregunta *"¿en qué cohorte estoy?"*, *"¿qué grupo tengo?"* o *"¿cuándo empieza o termina mi cohorte?"*.

## Herramienta

Una sola llamada a **`get_cohorts`** del MCP `breathecode`. No necesita parámetros.

## Cómo lo cuentas

**A "¿en qué cohorte estoy?" se responde con una línea.** La principal es `spain-aie-pt-4`. El resto son módulos sueltos y prework con `stage: INACTIVE` — no los listes a menos que pida "todas" o "el detalle".

En la respuesta normal:
- Una línea: "Estás en spain-aie-pt-4 (AI Engineering Part Time)."
- Las fechas de esa, si las tiene.
- Si no hay ninguna cohorte con nombre reconocible, dices lo que devuelve la API sin adornos.

Solo si pregunta explícitamente por el resto, listas las demás: nombre, etapa, fechas.

**Sin tablas.** Para el móvil.

## Qué NO hace

- No comprueba el estado del token a menos que falten 2 días o menos — pero si el token falla, la respuesta es "renueva el token", no una lista vacía de cohortes.
- No habla de tareas, proyectos, progreso ni feedback. Solo cohortes. Si pregunta por el curso en general, usa `4geeks-progreso`.
- No inventa duraciones ni plazos que la API no proporcione. Si la fecha de fin es nula, se marca con "—".