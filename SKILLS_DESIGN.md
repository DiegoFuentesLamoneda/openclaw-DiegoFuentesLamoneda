# SKILLS_DESIGN.md — Diseño de las skills de Grace

Documento de diseño previo a la implementación, como pide el enunciado. Tres skills, cada una de una de las tres categorías propuestas.

| Skill | Categoría | Servicios |
|---|---|---|
| `triaje-bandeja` | conecta herramientas entre sí | Gmail → Google Tasks |
| `plan-semana` | crea contenido nuevo | Google Docs + Calendar + Tasks |
| `briefing-dia` | afina un comportamiento ya instalado | Calendar + Tasks → Telegram |

## Contexto de partida

Todo pasa por el **MCP nativo de Zapier**, que no expone acciones directas sino meta-herramientas: `discover`, `inspect`, `execute_read_action` y `execute_write_action`.

Dos restricciones que condicionan el diseño:

- **El agente no tiene shell.** `tools.exec.mode` está en `deny` desde la práctica anterior, por seguridad: con shell podría leer sus propias credenciales. Esto descarta cualquier diseño basado en scripts.
- **Google Tasks es TasksBoard.** Diego gestiona sus tareas en [TasksBoard](https://tasksboard.com), que es un tablero kanban montado sobre Google Tasks con sincronización bidireccional en tiempo real. Escribir en Google Tasks equivale a escribir en su tablero. Esto es lo que hace que el triaje sea útil de verdad y no un ejercicio.

Convenciones comunes, heredadas de `TOOLS.md`: carpeta `Grace` en Drive (`1JoVDkU0tJbC2pmeqRVxpPoWmrilwwMX5`), calendario `diego@i21ecodesign.com`, zona horaria `Europe/Madrid`, 30 minutos por defecto.

---

## 1. `triaje-bandeja`

### ¿Qué hace?

Lee el correo no leído, separa lo que exige una acción de lo que es ruido, y crea una tarea en TasksBoard por cada cosa que haya que hacer.

### ¿Qué input necesita?

**Lo que Diego escribe:** nada. *"tríame la bandeja"*. Opcionalmente un filtro: *"solo lo de hoy"*.

**Lo que ya sabe sin que se lo digan:**

- Que el bootcamp de 4Geeks es la prioridad, así que un correo del curso pesa más que una newsletter (`USER.md`).
- Que **no debe contestar ni enviar nada**: leer y crear tareas, nunca responder. Mandar correo en nombre de alguien es el caso de manual de "para y pregunta" (`AGENTS.md`).
- Que el resultado se lee en un móvil: resumen corto, sin tablas (`TOOLS.md`).
- Que si algo es ambiguo lo marca como duda en vez de inventarse la intención del remitente (`SOUL.md`).

### ¿Cómo es un buen output?

**Proceso:** `gmail_find_email` sobre no leídos → clasificar → `google_tasks_create_task` por cada accionable.

**Cada tarea lleva** un título que empieza por verbo —"Responder a…", "Revisar…"— porque una tarea que no dice qué hacer no es una tarea; el remitente y el asunto en las notas; y la fecha límite si el correo la menciona.

**Idempotencia:** al terminar, `gmail_add_label_to_email` marca lo procesado con la etiqueta `triado`. Sin esto, ejecutarla dos veces duplica las tareas. Es la decisión de diseño menos vistosa y la más importante.

**Lo que NO hace:** no archiva, no borra, no responde, no marca como leído. Solo etiqueta.

**Cómo sé que funcionó:** las tareas aparecen en TasksBoard, los correos procesados llevan la etiqueta, y el resumen por Telegram cuadra en número con lo creado. Verificación cruzada en tres sitios.

**Dónde se nota la configuración:** un agente sin configurar devolvería un volcado de todos los correos. Este descarta el ruido, prioriza según el contexto de Diego, escribe títulos accionables en español y se abstiene de tocar nada más.

---

## 2. `plan-semana`

### ¿Qué hace?

Convierte objetivos, compromisos y tareas pendientes en un plan semanal priorizado, guardado como Google Doc, con los bloques de trabajo propuestos para el calendario.

### ¿Qué input necesita?

**Lo que Diego escribe:** objetivos de la semana y compromisos con fecha fija. *"entregar la práctica de skills el jueves, repasar RAG, y el viernes médico a las 10"*.

**Lo que ya sabe sin que se lo digan:**

- Lo que ya hay pendiente: lo lee de TasksBoard con `google_tasks_get_tasks_by_list`, en vez de pedir que se lo dicten otra vez.
- Que las entregas del curso mandan sobre todo lo demás (`USER.md`).
- Que Diego trabaja de noche: un plan que solo propone bloques de 9 a 17 no le sirve (`USER.md`).
- Calendario, zona horaria y duración por defecto (`TOOLS.md`).

### ¿Cómo es un buen output?

**El Doc** lleva los objetivos ordenados por prioridad con una línea de por qué, los compromisos fijos como anclas, los bloques de trabajo alrededor, y al final **lo que no entra esta semana**. Un plan que finge que cabe todo es un plan inútil.

**Destino:** `google_docs_create_document_from_text` en la carpeta `Grace`, y `google_calendar_create_detailed_event` para los bloques.

**Regla de seguridad:** los eventos se **proponen por Telegram y se crean solo tras el visto bueno**. Bloquear un calendario sin permiso es exactamente lo que `AGENTS.md` marca como parada obligatoria.

**Cómo sé que funcionó:** el Doc existe en la carpeta correcta, los eventos aprobados están en hora de Madrid, y ninguno se creó sin confirmación.

---

## 3. `briefing-dia`

### ¿Qué hace?

Manda por Telegram un resumen corto de lo que viene en las próximas 24-48 horas: agenda y tareas que vencen.

### ¿Qué input necesita?

**Lo que Diego escribe:** casi nada. *"¿qué tengo hoy?"*. Opcionalmente otro horizonte: *"¿y mañana?"*.

**Lo que ya sabe sin que se lo digan:**

- Qué calendario mirar y en qué zona horaria (`TOOLS.md`).
- Que se lee en un móvil: sin tablas, párrafos cortos (`TOOLS.md`, `SOUL.md`).
- Que si el día está vacío la respuesta correcta es una línea, no un párrafo de relleno (`SOUL.md`).
- El tono: corto, con chispa, sin ceremonia (`IDENTITY.md`).

Es la skill con menos input y más configuración: casi todo el comportamiento sale de los cinco ficheros. Ese es justamente el punto.

### ¿Cómo es un buen output?

**Proceso:** `google_calendar_find_events` en la ventana pedida, más `google_tasks_find_task` para lo que vence.

**Formato:** eventos en orden cronológico con hora de Madrid, el siguiente destacado, las tareas que vencen hoy, y una línea de qué conviene preparar si procede. Si hay ocho eventos, los relevantes y un recuento del resto — no la agenda entera.

**Destino:** el propio chat de Telegram.

**Cómo sé que funcionó:** las horas coinciden con las del calendario, y un día vacío produce una línea.

**Dónde se nota la configuración:** un agente sin configurar volcaría JSON o una tabla ilegible en el móvil. Este prioriza, ajusta zona horaria, se adapta a la pantalla y suena a Grace.

---

## Por qué estas tres

Las tres salen de algo que Diego ya hace a mano cada semana:

- El **triaje** es el que más tiempo come y el que peor se le da mantener al día.
- El **plan de semana** ya lo hace mentalmente cada domingo, pero no queda escrito en ningún sitio.
- El **briefing** ya existía a medias, como reglas sueltas escritas a mano en `tareas.md`. Convertirlo en skill es formalizar algo que estaba naciendo solo.

Y encajan entre sí: el triaje llena TasksBoard, el plan de semana lee de ahí para repartir el trabajo, y el briefing recuerda a diario lo que sale de los dos. No son tres ejercicios sueltos, son un ciclo.
