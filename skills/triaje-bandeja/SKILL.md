---
name: triaje-bandeja
description: Lee el correo no leído de Diego, separa lo accionable del ruido y crea una tarea en TasksBoard por cada cosa que haya que hacer.
metadata: { "openclaw": { "emoji": "📥" } }
---

# Triaje de bandeja

Diego pide *"tríame la bandeja"*, *"¿qué tengo en el correo?"* o similar. Tú conviertes el correo no leído en tareas accionables en su tablero.

## Regla que no se rompe

**Solo lees y etiquetas.** Nunca envías, respondes, reenvías, archivas ni borras correo. Aunque Zapier tenga esas acciones habilitadas, aquí no se usan. Si algo necesita respuesta, creas la tarea de responder — no respondes tú.

Está en `TOOLS.md` y en `AGENTS.md`: mandar correo en nombre de alguien es parada obligatoria.

## Proceso

### 1. Leer

`gmail_find_email` sobre el correo no leído. Si Diego acota (*"solo lo de hoy"*), respeta el filtro.

### 2. Clasificar

Para cada correo, una pregunta: **¿hay algo que Diego tenga que hacer?**

**Sí → tarea.** Le piden algo, hay una fecha límite, hay que decidir, o alguien espera respuesta.

**No → fuera.** Newsletters, notificaciones automáticas, confirmaciones, publicidad, copias en las que solo va en CC sin que le pidan nada.

Ordena por lo que sabes de él en `USER.md`: **el bootcamp de 4Geeks es la prioridad**. Un correo del curso o de un compañero de equipo pesa más que una promoción. Si dudas de si algo es accionable, inclúyelo y márcalo como duda — mejor una tarea de más que perder una entrega.

### 3. Crear las tareas

`google_tasks_create_task` por cada accionable.

- **El título empieza por un verbo.** "Responder a Marta sobre el proyecto final", no "Correo de Marta". Una tarea que no dice qué hacer no es una tarea.
- **En las notas:** remitente y asunto original, para que se pueda encontrar el correo.
- **Fecha límite** solo si el correo la menciona de verdad. No te la inventes.

Aparecen automáticamente en TasksBoard, que es donde Diego trabaja.

### 4. Marcar lo procesado

`gmail_add_label_to_email` con la etiqueta `triado` sobre cada correo revisado, accionable o no.

**Esto no es opcional.** Sin la etiqueta, la próxima ejecución vuelve a leer lo mismo y duplica tareas. Y antes de empezar, excluye lo que ya lleve la etiqueta.

### 5. Contar lo hecho

Un mensaje corto por Telegram:

- cuántos correos revisados y cuántas tareas creadas
- las tareas creadas, en una línea cada una
- lo que hayas marcado como dudoso
- si algo falló, qué falló

Sin tablas — se lee en el móvil.

## Cuando no hay nada

Si no hay correo no leído sin triar, dilo en una línea y ya. *"Bandeja limpia, nada que hacer 🐶"*. No rellenes.

## Si algo falla

Si Gmail no responde, **averigua qué capa ha fallado antes de decir nada** — están explicadas en `TOOLS.md` y el arreglo es distinto:

- ¿Falla todo el MCP, o solo Gmail? Si Calendar y Tasks responden, el MCP está bien y lo caducado es la conexión de Zapier con Gmail. Ahí no hay que tocar el VPS: se reconecta en <https://zapier.com/app/connections>.
- Solo si se cae todo a la vez toca reautorizar el MCP desde el servidor.

Mandar a Diego a reautorizar la capa equivocada le hace perder el tiempo. Comprueba con `zapier__list_zapier_connections` antes de dar instrucciones.

Y no finjas que el triaje salió bien con cero resultados: una bandeja limpia y un fallo de conexión son cosas distintas.
