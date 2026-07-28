# Notas de configuración — OpenClaw + Telegram + Zapier MCP

- **Zapier, no Composio**: el enunciado indicaba Composio, pero el instructor confirmó que la integración correcta era Zapier MCP.
- **Telegram**: el bloque `channels` va en el **primer nivel** de `openclaw.json`. Pegarlo "al final del JSON" lo dejó dentro de `hooks` y el gateway abortaba con `hooks: Invalid input`. Se corrigió con `jq '.channels = .hooks.channels | del(.hooks.channels)'`.
- **OAuth de Zapier en un VPS headless**: el primer intento falló porque el callback redirige a `http://127.0.0.1:<puerto>`, que apunta al portátil y no al servidor donde corre OpenClaw. Se resolvió al cambiar de modelo: sin el corte por cuota de la API de Gemini, el agente pudo completar por sí mismo las instrucciones de configuración del MCP de Zapier.
- **Mínimo privilegio**: en el servidor MCP solo se habilitaron dos acciones —Google Docs *Create Document from Text* y Google Calendar *Create Detailed Event*—, así el agente no puede ejecutar nada más.
- **Cambio de modelo**: `google/gemini-flash-latest` agotó la cuota del free tier (429 RESOURCE_EXHAUSTED) porque OpenClaw envía un prompt de sistema grande en cada mensaje y los esquemas MCP lo aumentan. Se pasó a `deepseek-v4-flash` a través del gateway LiteLLM de 4Geeks.
- **`model not allowed`**: no basta con que el modelo aparezca en `openclaw models list`; hay que declararlo en `models.providers.litellm.models` para poder seleccionarlo.
- **Control de acceso**: `dmPolicy: "pairing"` y `commands.ownerAllowFrom` limitan quién puede dar órdenes al agente por Telegram.
- **Secretos**: ninguno en este repositorio. Viven en `~/.openclaw/openclaw.json` en el VPS, con permisos `600`.
