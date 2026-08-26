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
| [`SKILLS_DESIGN.md`](SKILLS_DESIGN.md) | Diseño de las skills, escrito antes de implementarlas |
| [`skills/`](skills/) | Las skills personalizadas |
| [`openclaw-connection/`](openclaw-connection/) | Entrega de la primera práctica: capturas y notas de montaje |

## Las skills

| Skill | Qué hace | Servicios |
|---|---|---|
| [`triaje-bandeja`](skills/triaje-bandeja/SKILL.md) | Convierte el correo no leído en tareas accionables | Gmail → Google Tasks |
| [`plan-semana`](skills/plan-semana/SKILL.md) | Plan semanal priorizado y bloques de calendario | Docs + Calendar + Tasks |
| [`briefing-dia`](skills/briefing-dia/SKILL.md) | Resumen de las próximas 24-48h | Calendar + Tasks → Telegram |

Google Tasks es **TasksBoard**, el tablero kanban que Diego ya usaba. Las tareas que crea Grace aparecen ahí directamente.

## Infraestructura

- **Servidor:** VPS Ubuntu 22.04, gateway de OpenClaw como servicio de systemd con `linger` activado — sobrevive a cierres de sesión y reinicios.
- **Modelo:** `deepseek-v4-flash` a través del gateway LiteLLM de 4Geeks.
- **Canal:** Telegram, con emparejamiento por `dmPolicy: "pairing"`.
- **Herramientas:** un único servidor MCP nativo (Zapier) que da Google Docs, Calendar, Gmail y Tasks.

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
