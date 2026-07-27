# OpenClaw — Asistente de IA personal

Workspace del agente OpenClaw montado sobre el VPS del curso 4Geeks (AI Engineering).

## Proveedor de modelo

Se configuró **Google Gemini** como proveedor, con el modelo:

    google/gemini-flash-latest

### ¿Por qué no LiteLLM / 4Geeks?

La guía del curso indica usar el proveedor **LiteLLM** con la API de 4Geeks. Durante
el montaje, esa API devolvía errores de límite: cualquier petición, por mínima que
fuera, superaba el límite de tokens del endpoint, impidiendo que el agente respondiera.

Como alternativa gratuita y funcional se configuró la API de **Google AI Studio**
(free tier). El agente responde correctamente con `google/gemini-flash-latest`.

### Cómo volver a LiteLLM / 4Geeks cuando se solucione

1. `openclaw onboard --classic`
2. Proveedor: **LiteLLM** · baseUrl del gateway de 4Geeks · API key de 4Geeks
3. En "Default model", seleccionar el modelo de 4Geeks
4. Reiniciar el gateway y, en el chat, `/model default`

## Notas de seguridad

- Las credenciales (API keys) **no** se incluyen en este repositorio.
- La configuración con secretos vive en `~/.openclaw/openclaw.json`, **fuera** de este workspace.