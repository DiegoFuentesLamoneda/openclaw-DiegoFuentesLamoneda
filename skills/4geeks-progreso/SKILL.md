---
name: 4geeks-progreso
description: Resumen general del curso con cuatro perspectivas: asignado hasta hoy, bootcamp completo, módulos sin empezar y la cifra oficial de 4Geeks.
metadata: { "openclaw": { "emoji": "📊" } }
---

# Progreso de 4Geeks

Diego pregunta *"¿cómo voy de porcentaje?"*, *"¿cuánto llevo del curso?"*, *"resumen general"*, *"¿qué tal voy?"* o *"enséñame las métricas"*.

## Herramienta

Una sola llamada a **`breathecode__get_progress`** del MCP `breathecode`. No necesita parámetros.

## Atención — dos cifras, dos significados

**El endpoint de tareas solo ve lo asignado.** Los módulos que Diego no ha empezado no tienen fila de tarea, así que para el MCP no existen. Eso significa:

- **"Asignado hasta hoy"**: proyectos con ficha creada en la API. Mide el ritmo con lo que tiene encima de la mesa.
- **"Bootcamp completo"**: suma de `completion.overall.total` y `completion.overall.completed` de todas las matrículas *excepto* la cohorte principal (que serían duplicados). Mide el progreso real sobre el total del curso.
- **"En módulos sin empezar"**: slugs de `completion.pending_required_slugs.PROJECT` que no tienen ninguna fila en el endpoint de tareas. Son proyectos que existen en el plan de estudios pero aún no se han asignado.

La cifra de "asignado hasta hoy" baja cuando empieza un módulo nuevo porque el denominador crece de golpe. Es normal. La cifra de "bootcamp completo" no tiene ese problema.

## Cómo lo cuentas

La herramienta devuelve cuatro líneas. **Las cuatro se enseñan**, no elijas por tu cuenta:

- 📐 Asignado hasta hoy: X proyectos, Y aprobados (Z%)
- 🎓 Bootcamp completo: X proyectos requeridos, Y aprobados (Z%)
- 🔒 X proyectos en módulos sin empezar (aún sin ficha de tarea)
- 🏫 4Geeks oficial (cohorte principal): X/Y, con la frase que explica la diferencia

Luego sigue el desglose de cubos: aprobados, rechazados, sin entregar, esperando revisión, hechos sin revisión formal.

**La cuarta no se omite nunca.** Es la que explica por qué lo que Diego ve en `learn.4geeks.com` no cuadra con lo que le dices tú: la plataforma no cruza por slug y cuenta como pendientes proyectos ya aprobados en los módulos. Sin esa línea, la discrepancia parece un error nuestro.

El estado del token **no se menciona** a menos que queden 2 días o menos, o haya caducado.

## Qué NO hace

- No confunde token caducado con progreso. Si el token falla, la respuesta es "renueva el token", no un resumen con ceros.
- No inventa fechas ni plazos.
- No lista elementos uno a uno. Si Diego quiere el detalle, que use `4geeks-proyectos` o `4geeks-pendiente`.
- No da recomendaciones de qué hacer a continuación. Un resumen es un resumen, no un plan de trabajo.
- No mezcla las dos cifras ni las presenta como equivalentes. Son dos perspectivas, se muestran las dos y se entiende cuál es cuál.