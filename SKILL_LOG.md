# SKILL_LOG.md — Enseñándole a Grace la API de 4Geeks

Registro de cómo Grace, mi asistente sobre OpenClaw, aprendió a consultar mi cuenta de 4Geeks. Seis skills, cada una construida hablando con ella, cada una probada contra la API real.

Grace corre en un VPS propio y se maneja por Telegram. El contexto de la instalación está en [`TOOLS.md`](TOOLS.md); esto documenta solo lo de 4Geeks.

---

## 1. Configuración inicial

**Dónde vive el token.** El `4g_tok` se saca de las cookies de `learn.4geeks.com` y está guardado en el VPS:

```
/root/.openclaw/secrets/4geeks.token    -rw------- (600), dueño root
```

En la configuración de OpenClaw solo va la **ruta**, nunca el valor. Ningún fichero de skill lo contiene, y no está en este repositorio.

**Por qué en un fichero aparte y no en `openclaw.json`.** Miré primero si el esquema admitía referencias a secretos donde hacía falta:

```
mcp.servers.*.env      → string | number | boolean
mcp.servers.*.headers  → string | number | boolean
```

No admiten `SecretRef` en esta versión (build `2026.7.1-2`). Meterlo ahí habría dejado el token en claro dentro de `openclaw.json`. Con el fichero aparte, `openclaw secrets audit` sigue dando limpio y el servidor MCP lo lee en tiempo de ejecución.

**El token caduca a los 7 días.** Sale del código de BreatheCode:

```python
LOGIN_TOKEN_LIFETIME = timezone.timedelta(days=7)
```

Eso condiciona el diseño entero: todas las skills tienen que distinguir *"no tienes nada pendiente"* de *"tu token ha caducado"*. Confundirlas sería el peor fallo posible aquí.

**Verificación desde el VPS:**

```
longitud_leida = 40
http = 200
usuario: Diego Fuentes Lamoneda | id: 21730
```

---

## 2. La conversación de descubrimiento

### El prompt inicial

> Quiero darte la habilidad de conectarte a mi cuenta de 4Geeks usando mi token de estudiante, sin que tenga que desarrollar código de mi parte. ¿Qué debemos hacer?

### Qué propuso Grace

Lo primero que hizo fue **buscar si ya existía una integración**, en vez de inventarse una solución a medida:

> Lo primero: mirar si 4Geeks está en el catálogo de Zapier — si hay integración directa, es coser y cantar.
>
> 4Geeks no aparece como app en el catálogo de Zapier (lo que hay es "Real Geeks", nada que ver).

Descartada la vía directa, propuso **API by Zapier**, la acción genérica para llamar a APIs sin app dedicada. Y la habilitó ella misma en el servidor MCP de Zapier.

### Qué información me pidió

1. La URL base de la API de 4Geeks.
2. Cómo se manda el token: `Authorization: Bearer`, cabecera propia o query param.
3. Que entrara en un enlace de autorización de Zapier para configurar la conexión con mi token.

### Un error suyo, anotado

En el mismo mensaje prometió que podría *"listar los deadlines del bootcamp"*. **No puede**: la API no devuelve ninguna fecha límite en ningún campo. Se comprometió con una capacidad sin haberla verificado, que es justo lo que su propio [`AGENTS.md`](AGENTS.md) le prohíbe. Se lo dije, y a partir de ahí dejó de prometer de más.

### Por qué no seguimos su camino

La propuesta era legítima, pero perdía por cuatro razones:

1. **El token acabaría en Zapier**, no en mi VPS. El enunciado pide guardarlo en la configuración de OpenClaw, y ya estaba ahí con permisos 600.
2. **El cruce de datos tendría que hacerlo ella de cabeza** en cada consulta. Como se ve en la sección 3, esa pieza es la diferencia entre una skill útil y una que miente — y no se delega a un modelo pequeño, se pone en código.
3. **Una tercera capa de OAuth que caduca sola.** [`TOOLS.md`](TOOLS.md) ya documenta dos que se rompen por separado.
4. Mis datos académicos quedarían registrados en el *History* de Zapier.

### Lo que se decidió

Un **servidor MCP propio y mínimo** en el VPS, en [`mcp-4geeks/server.mjs`](mcp-4geeks/server.mjs): cero dependencias, una herramienta por endpoint, respuestas ya filtradas. El token se lee del disco y **nunca entra en el contexto del modelo**.

Grace diseñó la arquitectura y escribió el servidor. Lo que yo aporté fue el terreno: los endpoints reales y la forma de los datos, que es lo que ella no podía saber sin probar.

---

## 3. Lo que hubo que averiguar antes de diseñar nada

Estas tres cosas se descubrieron probando la API con Postman, y son las que explican por qué las skills están hechas así y no de la forma obvia.

### `description` no es la descripción: es el comentario del corrector

Ejemplos reales de mis entregas:

> *"La idea del agente de WhatsApp está bien definida y propone acciones concretas. Como mejora, intentaría acotar un poco el alcance..."*

Eso significa que la skill de feedback **no necesita un endpoint aparte**. Sale del mismo sitio.

### No existe ningún campo de fecha límite

Los campos de fecha son `created_at`, `opened_at`, `reviewed_at`, `delivered_at` y `updated_at`. Ninguno es un plazo. Por eso ninguna skill habla de deadlines, y por eso todas tienen escrito que si les preguntan por plazos, la respuesta es que la API no los da.

### Una fila por cohorte, y la principal guarda copias vírgenes

Estoy matriculado en **26 cohortes**: el bootcamp (`spain-aie-pt-4`) más sus módulos y el prework. La misma tarea existe como fila distinta en varias, y la principal conserva copias sin tocar de trabajo ya aprobado en los módulos:

| slug | en `spain-aie-pt-4` | estado real |
|---|---|---|
| `typescript-cinema-seat-manager` | PENDING | APPROVED en `coding-fundamentals-with-typescript` |
| `html-css-artist-landing-seo-access` | PENDING | APPROVED en `web-ui-fundamentals-with-tailwind` |
| `ai-eng-milestone-web-fundamentals` | PENDING | APPROVED en `web-ui-fundamentals-with-tailwind` |

De ahí sale **la regla central del servidor**:

> El estado real de una tarea es el más avanzado de todas las filas que comparten `associated_slug`.

Y esto es lo que mide la diferencia. Preguntando "¿qué proyectos me faltan?" de tres formas distintas:

| Cómo se pregunta | Respuesta |
|---|---|
| Sin filtros | **11** proyectos |
| Filtrando por mi cohorte principal | **7** — y esconde la práctica que estoy haciendo ahora |
| Cruzando por `associated_slug` | **5**, la correcta |

Una skill montada sobre la consulta obvia me habría agobiado con seis fantasmas cada vez. Habría dejado de preguntarle a la semana.

### Dos detalles más que cambiaron el código

- **El endpoint pagina de 100 por defecto** (`APIViewExtensions(..., paginate=True)`). Sin `limit` y `offset` explícitos se pierden filas y se dan cifras falsas con total aplomo. El servidor recorre las páginas usando el `count` de la respuesta y reporta *"157 filas de 157 esperadas"* en cada salida.
- **Los `task_type: LESSON` se quedan en `revision_status: PENDING` para siempre**, porque nadie corrige una lección. Contarlas como "esperando nota" sería mentir.

---

## 4. Las seis skills

Todas llaman a herramientas del MCP `breathecode`. Base de la API: `https://breathecode.herokuapp.com`, autenticación por cabecera `Authorization: Token <4g_tok>`.

Las seis salieron de la misma conversación con Grace, la que arranca en la sección 2 y sigue con el diseño de las herramientas. Bajo cada una está lo que le pedí para esa skill en concreto; el hilo completo, con sus rodeos y sus correcciones, está en las secciones 2, 3 y 5.

---

### Skill 1 — [`4geeks-sesion`](skills/4geeks-sesion/SKILL.md) 🔐

**Prompt que la originó**

> Quiero poder preguntarte si mi token de 4Geeks sigue vivo y que me digas quién soy en la plataforma. Nada más: es un *health check*, no un resumen del curso.

**Qué hace y qué endpoint usa**

Herramienta `breathecode__get_profile` → `GET /v1/auth/user/me`. Una sola llamada. Confirma que la sesión está activa, devuelve identidad y calcula los días que le quedan al token a partir del `mtime` del fichero.

Si el token ha caducado, la respuesta es *"tu token ha caducado, renuévalo"* — nunca un error técnico ni un silencio.

**Prueba**

```
🔑 Token: 4.4 dias restantes

**Diego Fuentes Lamoneda**
✉️ diego@i21ecodesign.com
👤 @diego@i21ecodesign.com
```

---

### Skill 2 — [`4geeks-proyectos`](skills/4geeks-proyectos/SKILL.md) 📐

**Prompt que la originó**

> Quiero pedirte el inventario completo: todos mis proyectos con su estado real — aprobado, rechazado, entregado esperando corrección o sin entregar.

**Qué hace y qué endpoint usa**

Herramienta `breathecode__get_projects_status` → `GET /v1/assignment/user/me/task` (paginado). Cruza por `associated_slug` y devuelve un elemento único por trabajo, ordenado del estado más avanzado al menos. Por defecto solo `PROJECT`; los ejercicios hay que pedirlos con el parámetro `task_type`.

**Prueba**

```
🔑 Token: 4.4 dias restantes
📦 25 elementos unicos (31 filas de 31 esperadas)

✅ 📐 **Cinema Seat Manager in TypeScript** — _APPROVED_ (typescript-cinema-seat-manager)
✅ 📐 **Showcase your friend's artist talent with a website** — _APPROVED_ (html-css-artist-landing-seo-access)
✅ 📐 **Command Line Challenge** — _APPROVED_ (exercise-terminal-challenge)
...
```

2.602 caracteres. Antes de acotar el defecto a `PROJECT` eran **12.324 en 124 líneas** — ilegible en el móvil y un mordisco de 3.000 tokens en el contexto de Grace.

---

### Skill 3 — [`4geeks-pendiente`](skills/4geeks-pendiente/SKILL.md) 📋

**Prompt que la originó**

> Cuando te pregunte "¿qué me falta?", quiero lo que de verdad tengo que entregar. No lo que la API cree que está pendiente: lo que está pendiente después de cruzar cohortes.

**Qué hace y qué endpoint usa**

Herramienta `breathecode__get_pending` → `GET /v1/assignment/user/me/task` (paginado). Cruza por slug, separa lo que exige trabajo mío de lo que ya entregué y espera corrección, y resume los ejercicios en una sola línea. "Esperando corrección" exige `delivered_at` no nulo: si no hay entrega real, no hay nada que esperar.

**Prueba**

```
🔑 Token: 4.4 dias restantes
📊 157 filas de 157 esperadas -> 121 unicos tras cruzar por slug

**📋 Proyectos por hacer (5):**
  ⏳ 📐 **Milestone 9 — Agentic Workflow Generation (Part 1 of 3)** (ai-eng-milestone-agentic-workflows-orchestrate)
  ⏳ 📐 **Todo List CLI with Python** (todo-list-cli-python)
  ⏳ 📐 **Applying Spec Driven Development - Financial dashboard** (company-financial-dashboard-specs-project)
  ⏳ 📐 **Building context from an existing project - Financial dashboard** (company-financial-dashboard-context-project)
  ⏳ 📐 **My 4Geeks Assistant — Teaching OpenClaw to Track Your Progress** (openclaw-integration)

**📬 Esperando correccion (4):**
  📐 **Milestone 2 — Building Scripts to Automate Tasks** — entregado 2026-08-21
  📐 **Milestone 3 — Talent Pipeline Tracker** — entregado 2026-09-03
  📐 **Talk to the Machine - Building a Chat Interface with a Real AI API** — entregado 2026-09-04
  📐 **My Agent, My Way: Teaching Your Personal Assistant New Skills** — entregado 2026-08-27

📝 Ejercicios: 96 (34 hechos, 62 pendientes)
```

El primero de la lista es esta misma práctica.

---

### Skill 4 — [`4geeks-progreso`](skills/4geeks-progreso/SKILL.md) 📊

**Prompt que la originó**

> Quiero un resumen de cuánto llevo del curso. Con desglose por tipo, porque 16 proyectos de 25 no es lo mismo que 27 ejercicios de 96, y con los números cuadrando.

**Qué hace y qué endpoints usa**

Herramienta `breathecode__get_progress` → dos llamadas:

- `GET /v1/assignment/user/me/task` (paginado) para el cálculo cruzado por slug.
- `GET /v1/admissions/user/me` para leer el `completion` oficial de la cohorte principal.

Los cubos son exhaustivos y la herramienta verifica que sumen el total; si no cuadran, lo avisa en vez de callárselo.

Da **cuatro perspectivas**, porque hay cuatro verdades distintas y mezclarlas engaña:

- **Asignado hasta hoy** — de lo que me han puesto delante, cuánto llevo aprobado. Mide el ritmo.
- **Bootcamp completo** — sobre el total que exige el plan de estudios. Mide dónde estoy en el curso.
- **Módulos sin empezar** — proyectos que existen en el plan pero aún no tienen ficha de tarea.
- **Lo que dice 4Geeks** de la cohorte principal, con la frase que reconcilia la diferencia.

Las dos primeras hacen falta porque **el endpoint de tareas solo ve lo asignado**: 25 proyectos con ficha creada frente a los 77 que exige el bootcamp. Sin esa distinción, el porcentaje **bajaría cada vez que empiezo un módulo nuevo**, porque el denominador crece de golpe — un número que empeora cuando avanzas está mal construido. El total real sale de sumar el `completion.overall` de todas las matrículas menos la principal, cuyos siete proyectos son los duplicados de siempre.

Y la cuarta hace falta porque **4Geeks no cruza por slug**: cuenta como pendientes seis proyectos ya aprobados en sus módulos. Esa discrepancia se ve en `learn.4geeks.com`, y la skill la explica en vez de dejar que parezca un error nuestro.

**Prueba**

```
🔑 Token: 4.3 dias restantes
📊 121 unicos (157 filas de 157)
   ✅ Los cubos cuadran

📐 Asignado hasta hoy: 25 proyectos, 16 aprobados (64%)
📝 Ejercicios: 96 (27 aprobados = 28%)

🎓 Bootcamp completo: 77 proyectos requeridos, 16 aprobados (21%)
🔒 47 proyectos en módulos sin empezar (aún sin ficha de tarea)

🏫 4Geeks oficial (cohorte principal): 0/7 = 0%
   7 pendientes según plataforma: ai-eng-milestone-web-fundamentals, exercise-terminal-challenge,
   first-collaborative-project-tailwind-css, html-css-artist-landing-seo-access,
   simple-dashboard-tailwind-css, todo-list-cli-python, typescript-cinema-seat-manager

   De los 7 que 4Geeks cuenta como pendientes, 6 están aprobados en sus módulos.
   El único pendiente de verdad es `todo-list-cli-python`.

✅ Aprobados: 43
❌ Rechazados: 0
⏳ Sin entregar: 67
📬 Esperando revisión: 4
🤓 Hechos sin revisión formal: 7
```

Esa última frase es la más útil que produce todo el sistema, y **se calcula**: de los slugs que la plataforma da por pendientes, se quitan los que tengan una fila `APPROVED` en cualquier cohorte, y lo que queda se nombra. No es una plantilla — en un intento anterior lo fue, y decía "en realidad no hay ninguno" cuando quedaba uno.

---

### Skill 5 (extendida) — [`4geeks-feedback`](skills/4geeks-feedback/SKILL.md) 💬

**Por qué la quería**

Los comentarios de los correctores se pierden. Están dentro de cada entrega en la plataforma, y para releer lo que me dijeron en junio tengo que ir proyecto por proyecto. Quiero pedírselos todos de golpe.

**Prompt que la originó**

> Quiero poder preguntarte qué me han dicho los correctores en mis entregas, todos juntos y del más reciente al más antiguo.

**Qué hace y qué endpoint usa**

Herramienta `breathecode__get_feedback` → `GET /v1/assignment/user/me/task` (paginado). El comentario del corrector está en el campo `description`. Descarta el texto automático de la plataforma (*"You have completed all steps on this exercise"*), que no lo escribe una persona, y cita el comentario entero sin resumirlo.

**Prueba**

```
🔑 Token: 4.4 dias restantes
💬 16 elementos con feedback (157 filas de 157)

✅ 📐 **Wanderlust Explorer with React and Next.js** (2026-08-26)
   Seguimos con los frameworks!! -A

✅ 📐 **AgentHub Admin Panel Specs and Prompt-Driven Prototype** (2026-08-26)
   Excelente! Seguimos!
   Como ves, cada vez hacemos todo mejor, mas rapido y entendiendo!!
   -A
...
```

16 comentarios reales en 2.275 caracteres. El filtro no es cosmético: de las **45** tareas con `description` no vacío, **29** son el texto automático de la plataforma. Solo 16 los escribió una persona.

---

### Skill 6 (extendida) — [`4geeks-cohortes`](skills/4geeks-cohortes/SKILL.md) 🏫

**Por qué la quería**

Porque "¿en qué cohorte estoy?" tiene una respuesta sorprendentemente enrevesada, y necesitaba entenderla para que las demás skills fueran correctas.

**Prompt que la originó**

> Quiero saber en qué cohortes estoy matriculado y cuál es la principal. Y quiero que lo deduzcas de los datos, no que lo lleves escrito a mano.

**Qué hace y qué endpoint usa**

Herramienta `breathecode__get_cohorts` → `GET /v1/admissions/user/me`. El array `cohorts` **no contiene cohortes: contiene matrículas**, con la cohorte anidada en `cohort`.

Ninguna de las 26 se distingue por `stage` (todas `INACTIVE`) ni por `educational_status` (todas `ACTIVE`). La principal se detecta por **`cohort.micro_cohorts`**: `spain-aie-pt-4` tiene 23; las demás, cero. A la pregunta normal se contesta con una línea; las 26 solo si se piden.

**Prueba**

```
🔑 Token: 4.3 dias restantes

🏫 **spain-aie-pt-4** (spain-aie-pt-4) — 2026-07-13 → 2027-01-13

... y 25 cohortes mas (modulos y prework). Pide "todas" para verlas.
```

---

## 5. Lo que hubo que corregirle a Grace

Nada de esto salió bien a la primera, y el registro de los fallos vale tanto como el resultado.

**Endpoints inventados.** En su primer diseño propuso `GET /v1/mentorship/student/{id}/assignments`, que no existe, y dijo que `auth/user/me` devolvía progreso, que tampoco. Segunda vez en la misma conversación dando algo por bueno sin verificarlo.

**Config equivocada.** Describió la configuración de OpenClaw como un `config.yaml` con una clave `mcpServers`. Es `openclaw.json`, y los servidores se registran con `openclaw mcp add`.

**Un secreto derivado dentro del repositorio público.** Quería guardar un `.token_meta.json` con el `sha256` del token dentro del workspace — que es este repositorio. Un sha no se revierte, pero un artefacto derivado de una credencial no pinta nada en GitHub. Se sustituyó por el `mtime` del propio fichero del token: cero estado extra.

**Código en una carpeta ignorada.** Quiso poner el servidor en `scripts/`, que está en [`.gitignore`](.gitignore) desde que se cerró `exec`. Ahí no se habría publicado.

**Silencio en el protocolo.** Le mandé un `resources/list` por stdin y el servidor **no contestó nada**: un cliente esperando esa respuesta se queda colgado. Ahora cualquier método desconocido con `id` devuelve `-32601`. También emitía una notificación `log` antes del handshake y una `initialized` que corresponde mandar al cliente, no al servidor.

**`[object Object]` justo cuando más importa.** `get_profile` y `get_cohorts` devolvían el objeto de error en crudo en vez de pasarlo por `formatApiError`. El día que caducara el token, la herramienta cuya única misión es avisar de eso habría contestado `[object Object]`.

**Volcados de 12.000 caracteres.** Dos veces: `get_pending` devolvía 67 líneas por incluir ejercicios, y `get_projects_status` 124. En un agente con el contexto justo, eso no es un problema de estilo.

**Una skill que parecía funcionar con los datos rotos.** `get_cohorts` devolvía 26 líneas de `**undefined** (undefined)`, pero como la skill tenía escrito *"Estás en spain-aie-pt-4"* como texto fijo, la respuesta habitual salía correcta. Solo se veía pidiendo el detalle. Se arregló el bug y se quitó el dato escrito a mano.

**Intentó usar la shell.** Al terminar el servidor quiso comprobarlo con `wc` y chocó con `tools.exec.mode: "deny"`. Está escrito en su propio [`TOOLS.md`](TOOLS.md); se le olvidó a media tarea.

**Los nombres de las herramientas, sin el prefijo del servidor.** Este es el más instructivo de todos. Las seis skills decían *"llama a `get_feedback`"*, pero OpenClaw las expone como **`breathecode__get_feedback`**. Grace buscaba un nombre que no existía, no lo encontraba, y de ahí concluía que **el servidor MCP se había caído**: rebuscó entre las herramientas de Zapier y luego pidió que se ejecutara `openclaw mcp probe` para confirmar la avería. Razonamiento impecable a partir de un dato falso — la forma más difícil de detectar un error, porque todo lo que dice el agente suena sensato.

Y la convención ya estaba escrita: [`TOOLS.md`](TOOLS.md) documenta las de Zapier como `zapier__discover_zapier_actions`, con su prefijo. Se rompió al añadir las nuevas.

**Dos regresiones al reescribir una función.** Al añadir las cifras del bootcamp completo, la reescritura de `handleGetProgress` se llevó por delante la cifra oficial de 4Geeks y su frase de reconciliación, pedidas expresamente dos mensajes antes. Y cuando volvieron, la frase estaba mal calculada: decía *"en realidad no hay ninguno"* cuando quedaba uno, **contradiciendo a `breathecode__get_pending`**, que sí listaba `todo-list-cli-python`. Dos herramientas del mismo servidor afirmando cosas incompatibles sobre el mismo proyecto. Se arregló haciendo que la frase se calcule contra los slugs `APPROVED` en vez de rellenar una plantilla.

La lección práctica: **cada vez que el agente reescribe una función, hay que volver a probar lo que ya funcionaba**, no solo lo nuevo.

Y una corrección **mía**, que también cuenta: le dije que la API no podía saber cuál era mi cohorte principal y que había que escribírselo. Sí puede — `micro_cohorts` lo dice. Mandó el dato.

---

## 6. Arquitectura y seguridad

```
Telegram → Grace (OpenClaw) → MCP breathecode → API de 4Geeks
                                    ↑
                    /root/.openclaw/secrets/4geeks.token (600)
```

- **El token nunca entra en el contexto del modelo.** Lo lee el proceso del servidor MCP, que es independiente del agente, y solo viaja en la cabecera `Authorization` hacia `breathecode.herokuapp.com`.
- **Grace no puede leerlo.** `tools.fs.workspaceOnly` la confina al workspace y el token está fuera; `tools.exec.mode: "deny"` le quita la shell. Puede usar el servidor, no la credencial.
- **Cero dependencias.** El servidor implementa JSON-RPC 2.0 sobre stdin/stdout con `fetch` nativo y `node:fs`. Nada que instalar, nada que actualizar, ningún `node_modules` en el repositorio.
- **Solo lectura.** Las seis herramientas son `GET`. Ninguna entrega, modifica ni borra nada en 4Geeks.
- **Una responsabilidad por herramienta**, y una herramienta por skill.

Registro:

```
openclaw mcp add breathecode --command node --arg /root/.openclaw/workspace/mcp-4geeks/server.mjs
openclaw mcp probe breathecode    → breathecode: 6 tools
```

---

## 7. Limitaciones conocidas

- **El token caduca cada 7 días** y hay que renovarlo a mano. Grace avisa cuando quedan 2 días o menos, pero no puede renovarlo: no tiene credenciales de 4Geeks ni shell.
- **No hay fechas límite** en la API. Ninguna skill puede decir para cuándo es una entrega.
- **Las skills solo ven trabajo asignado.** Los módulos sin empezar no tienen ficha de tarea: 25 proyectos con ficha frente a 77 que exige el plan. Por eso `4geeks-progreso` da la cifra del bootcamp completo aparte, y `4geeks-pendiente` menciona los 47 que esperan al final.
- **La cifra oficial de 4Geeks y la real no coinciden**, y no es un error de este sistema: la plataforma no cruza por slug. Por eso `4geeks-progreso` da las dos.
- **Solo lectura.** Entregar un proyecto se sigue haciendo en la plataforma.
