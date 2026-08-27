---
name: plan-semana
description: Convierte objetivos, compromisos y tareas pendientes en un plan semanal priorizado guardado como Google Doc, y propone los bloques de trabajo para el calendario.
metadata: { "openclaw": { "emoji": "🗓️" } }
---

# Plan de semana

Diego suelta lo que quiere sacar adelante esta semana. Tú lo conviertes en un plan escrito y en bloques de calendario.

## Antes de escribir nada, entérate de lo que ya hay

No le pidas que te dicte lo que ya está registrado:

- **`google_tasks_get_tasks_by_list`** — lo pendiente en TasksBoard.
- **`google_calendar_find_events`** — lo que ya ocupa la semana.

Si algo que él menciona ya existe como tarea o evento, no lo dupliques: dilo y sigue.

## Cómo priorizar

Por lo que sabes de él en `USER.md`: **estudia AI Engineering en 4Geeks a tiempo completo**. Las entregas del curso mandan. Lo demás se ordena alrededor.

Y **trabaja de noche**. Esto no es un detalle de color: si le propones un plan de 10:00 a 18:30 no lo va a seguir, porque no es cuando rinde.

Antes de repartir bloques, **pregúntale a qué hora piensa ponerse** si no lo ha dicho. Y si tienes que decidir tú, decide hacia la tarde-noche, no hacia la mañana. Un bloque a las 22:00 es más realista para Diego que uno a las 10:00.

### Prioridades: prioriza de verdad

Ordena de la primera a la última y que se note. **Nada de poner 🥇 en las tres** — si todo es lo más importante, no has priorizado, has hecho una lista. Numera, y que la primera sea inequívocamente la primera.

## El documento

`google_docs_create_document_from_text` en la carpeta `Grace` (`1JoVDkU0tJbC2pmeqRVxpPoWmrilwwMX5`). Título: `Plan semana <fecha del lunes>`.

Cuatro secciones, en este orden:

1. **Prioridades** — ordenadas, cada una con una línea de por qué está donde está. La justificación importa tanto como el orden.
2. **Anclas** — los compromisos con hora fija que no se mueven.
3. **Bloques propuestos** — el trabajo repartido en los huecos, con día, hora y duración.
4. **Lo que no entra esta semana** — explícito. Un plan que finge que cabe todo es un plan inútil, y esta sección es la que hace que el resto sea creíble.

## Los eventos: proponer, no crear

**Esta es la parte donde te paras.**

Enseña los bloques propuestos por Telegram —día, hora, duración, título— y **espera el visto bueno**. Solo entonces `google_calendar_create_detailed_event`.

Si Diego dice "sí a todo", los creas todos. Si dice "quita el del martes", los creas menos ese. Si no contesta, no creas nada.

Bloquear un calendario sin permiso es exactamente el caso que `AGENTS.md` marca como parada obligatoria. Un plan se puede tirar a la basura; treinta eventos mal puestos hay que borrarlos a mano uno a uno.

## Convenciones

- Calendario `diego@i21ecodesign.com`, zona horaria `Europe/Madrid`.
- Duración por defecto 30 minutos, pero para bloques de estudio propón entre 90 y 120: el trabajo profundo no cabe en media hora.
- Si falta un dato imprescindible —una fecha de entrega que no te ha dado— pregunta **uno**. Lo prescindible lo decides y lo anuncias.

## Al terminar

Un mensaje corto: el enlace al Doc, las tres prioridades de la semana en una línea cada una, y qué eventos quedaron creados. Sin repetir el plan entero por chat — para eso está el documento.
