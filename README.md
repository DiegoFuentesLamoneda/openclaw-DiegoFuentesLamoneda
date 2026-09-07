# Grace — asistente personal sobre OpenClaw

Workspace del agente de **Diego Fuentes Lamoneda** para el bootcamp de AI Engineering de 4Geeks. Corre en un VPS propio y se maneja desde Telegram.

El agente se llama **Grace**, por la Border Collie de Diego.

## Qué hay aquí

Este repositorio **es** el workspace del agente: lo que ves es lo que Grace lee al despertar en cada sesión.

| | |
|---|---|
| [`IDENTITY.md`](IDENTITY.md) | Nombre, símbolo y cómo se refiere a sí misma |
| [`SOUL.md`](SOUL.md) | Personalidad, cuándo actúa y cuándo pregunta, cómo gestiona la incertidumbre |
| [`AGENTS.md`](AGENTS.md) | Reglas inamovibles: privacidad, paradas obligatorias, honestidad |
| [`USER.md`](USER.md) | Quién es Diego y cómo trabaja |
| [`TOOLS.md`](TOOLS.md) | Qué hay conectado en esta instalación y con qué convenciones |
| [`SKILLS_DESIGN.md`](SKILLS_DESIGN.md) | Diseño de las skills de Google, escrito antes de implementarlas |
| [`SKILL_LOG.md`](SKILL_LOG.md) | Cómo aprendió Grace a consultar mi cuenta de 4Geeks, skill a skill |
| [`skills/`](skills/) | Las skills personalizadas |
| [`mcp-4geeks/`](mcp-4geeks/) | Servidor MCP propio para la API de estudiante de 4Geeks |
| [`openclaw-connection/`](openclaw-connection/) | Entrega de la primera práctica: capturas y notas de montaje |

## Las skills

| Skill | Qué hace | Servicios |
|---|---|---|
| [`triaje-bandeja`](skills/triaje-bandeja/SKILL.md) | Convierte el correo no leído en tareas accionables | Gmail → Google Tasks |
| [`plan-semana`](skills/plan-semana/SKILL.md) | Plan semanal priorizado y bloques de calendario | Docs + Calendar + Tasks |
| [`briefing-dia`](skills/briefing-dia/SKILL.md) | Resumen de las próximas 24-48h | Calendar + Tasks → Telegram |

Google Tasks es **TasksBoard**, el tablero kanban que Diego ya usaba. Las tareas que crea Grace aparecen ahí directamente.

Y las de 4Geeks, todas sobre el MCP propio [`breathecode`](mcp-4geeks/server.mjs):

| Skill | Qué hace |
|---|---|
| [`4geeks-sesion`](skills/4geeks-sesion/SKILL.md) | Comprueba que el token sigue vivo y dice quién eres |
| [`4geeks-proyectos`](skills/4geeks-proyectos/SKILL.md) | Inventario de proyectos con su estado real |
| [`4geeks-pendiente`](skills/4geeks-pendiente/SKILL.md) | Qué falta por entregar de verdad, tras cruzar cohortes |
| [`4geeks-progreso`](skills/4geeks-progreso/SKILL.md) | Cuánto llevas del curso, con la cifra oficial y la real |
| [`4geeks-feedback`](skills/4geeks-feedback/SKILL.md) | Los comentarios que te dejaron los correctores |
| [`4geeks-cohortes`](skills/4geeks-cohortes/SKILL.md) | En qué cohorte estás y cuál es la principal |

El detalle de cómo se construyeron está en [`SKILL_LOG.md`](SKILL_LOG.md).

## Infraestructura

- **Servidor:** VPS Ubuntu 22.04, gateway de OpenClaw como servicio de systemd con `linger` activado — sobrevive a cierres de sesión y reinicios.
- **Modelo:** `deepseek-v4-flash` a través del gateway LiteLLM de 4Geeks.
- **Canal:** Telegram, con emparejamiento por `dmPolicy: "pairing"`.
- **Herramientas:** dos servidores MCP nativos. **Zapier**, que da Google Docs, Calendar, Gmail y Tasks; y **`breathecode`**, escrito para este workspace, que da la API de estudiante de 4Geeks.

### Nota sobre el modelo

El montaje inicial usó `google/gemini-flash-latest` porque el gateway de 4Geeks daba errores de límite. Esa vía se agotó: el free tier de Gemini devolvía `429 RESOURCE_EXHAUSTED` porque OpenClaw manda un prompt de sistema grande en cada mensaje y los esquemas MCP lo engordan todavía más. Se migró a `deepseek-v4-flash` por LiteLLM, que es lo que corre hoy.

## Seguridad

Decisiones tomadas tras pasar `openclaw security audit`, documentadas en [`openclaw-connection/notes.md`](openclaw-connection/notes.md):

- **Sin shell.** `tools.exec.mode: "deny"`. Con shell, el agente podía leer sus propias credenciales.
- **Ficheros confinados** al workspace (`tools.fs.workspaceOnly`).
- **Correo de solo lectura** por convención: Grace lee y etiqueta, nunca envía.
- **Ningún secreto en este repositorio.** Viven en `~/.openclaw/openclaw.json` en el VPS, con permisos `600`.
- Las notas personales del agente están en `.gitignore`: este repositorio es público.

La migración de Zapier a MCP nativo salió justamente de aquí — el agente invocaba Zapier por shell, así que cerrar `exec` rompía la integración. Está contado en las notas.
