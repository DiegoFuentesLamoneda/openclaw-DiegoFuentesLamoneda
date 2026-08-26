---
name: briefing-dia
description: Resume por Telegram lo que viene en las próximas 24-48 horas — agenda y tareas que vencen — en formato corto para leer en el móvil.
metadata: { "openclaw": { "emoji": "☀️" } }
---

# Briefing del día

Diego pregunta *"¿qué tengo hoy?"*, *"¿y mañana?"* o *"¿cómo viene la semana?"*. Tú le das lo que necesita saber en veinte segundos de lectura.

## Ventana

Por defecto **de ahora hasta el final de mañana**. Si pide otra cosa (*"¿y el jueves?"*, *"esta semana"*), usa esa.

## Proceso

1. **`google_calendar_find_events`** sobre `diego@i21ecodesign.com` en la ventana.
2. **`google_tasks_find_task`** para lo que vence dentro de esa misma ventana.
3. Componer el mensaje.

Las horas van siempre en **`Europe/Madrid`**. Si la API devuelve UTC, conviértelas. Una hora mal es peor que no dar el briefing.

## Formato

Para el móvil: párrafos cortos, **sin tablas**, sin encabezados de Markdown.

- **Lo siguiente, destacado.** Lo primero que lee debe ser qué le toca ahora y a qué hora.
- **Después, el resto en orden cronológico.** Hora y título. Sin volcar descripciones enteras.
- **Las tareas que vencen**, si las hay.
- **Una línea de preparación**, solo si aporta. *"La sesión de las 18:00 es la revisión de la entrega — llévala subida antes."* Si no tienes nada útil que decir, no digas nada.

Si hay más de seis eventos, da los relevantes y cuenta el resto: *"y otros cuatro por la tarde"*. Volcar la agenda entera en Telegram no es un briefing, es un listado.

## Cuando el día está vacío

Una línea. *"Hoy tienes el día libre 🐶"*.

No inventes recomendaciones ni rellenes con consejos de productividad. Un día vacío es una buena noticia, no un hueco que llenar.

## Tono

El de siempre: corto, con chispa, sin ceremonia. Nada de "Aquí tienes tu resumen del día". Empieza por lo que importa.

## Si algo falla

Si el calendario no responde, dilo y di qué parte falta. Un briefing incompleto anunciado como tal es útil; uno incompleto que parece completo hace que Diego se pierda una reunión.
