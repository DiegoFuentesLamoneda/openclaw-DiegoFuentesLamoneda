# Notas de configuración — OpenClaw + Telegram + Zapier MCP

- **Zapier, no Composio**: el enunciado indicaba Composio, pero el instructor confirmó que la integración correcta era Zapier MCP.
- **Telegram**: el bloque `channels` va en el **primer nivel** de `openclaw.json`. Pegarlo "al final del JSON" lo dejó dentro de `hooks` y el gateway abortaba con `hooks: Invalid input`. Se corrigió con `jq '.channels = .hooks.channels | del(.hooks.channels)'`.
- **OAuth de Zapier en un VPS headless**: el primer intento falló porque el callback redirige a `http://127.0.0.1:<puerto>`, que apunta al portátil y no al servidor donde corre OpenClaw. Se resolvió al cambiar de modelo: sin el corte por cuota de la API de Gemini, el agente pudo completar por sí mismo las instrucciones de configuración del MCP de Zapier.
- **Mínimo privilegio**: en el servidor MCP solo se habilitaron dos acciones —Google Docs *Create Document from Text* y Google Calendar *Create Detailed Event*—, así el agente no puede ejecutar nada más.
- **Cambio de modelo**: `google/gemini-flash-latest` agotó la cuota del free tier (429 RESOURCE_EXHAUSTED) porque OpenClaw envía un prompt de sistema grande en cada mensaje y los esquemas MCP lo aumentan. Se pasó a `deepseek-v4-flash` a través del gateway LiteLLM de 4Geeks.
- **`model not allowed`**: no basta con que el modelo aparezca en `openclaw models list`; hay que declararlo en `models.providers.litellm.models` para poder seleccionarlo.
- **Control de acceso**: `dmPolicy: "pairing"` y `commands.ownerAllowFrom` limitan quién puede dar órdenes al agente por Telegram.
- **Secretos**: ninguno en este repositorio. Viven en `~/.openclaw/openclaw.json` en el VPS, con permisos `600`.

## Endurecimiento tras `openclaw security audit`

- **De 5 warns a 3, ninguno crítico**. Se desactivó `gateway.controlUi.allowInsecureAuth` (flag de depuración que se quedó puesto) y se activó `tools.fs.workspaceOnly` junto con `tools.exec.applyPatch.workspaceOnly`.
- **`workspaceOnly` no basta por sí solo**: limita la herramienta de ficheros, pero `exec` seguía pudiendo leer `~/.openclaw/openclaw.json` —y con él los tokens— a través de la shell. Cerrar `exec` era el paso que faltaba para que el mínimo privilegio del MCP significara algo.
- **`tools.exec.mode` es excluyente** con `tools.exec.security` y `tools.exec.ask`: el schema rechaza combinarlos. `mode` es el selector normalizado que sustituye a los otros dos.
- **Los paths se sacan del schema, no se adivinan**: `workspaceOnly` cuelga de `tools.fs` (primer nivel), no de `agents.defaults`. Con `openclaw config schema` y `config set` se valida antes de escribir, en lugar de editar el JSON a mano. Ojo: `config set --dry-run` en modo valor **no** comprueba el schema; hace falta `--strict-json`.

## De `mcporter` a MCP nativo

- **`exec: deny` rompió Zapier**, y el motivo era revelador: el agente no hablaba MCP, sino que lanzaba `npx -y mcporter call ...` por shell. Es decir, darle Zapier al agente implicaba darle shell — justo lo que el audit señalaba. El mínimo privilegio del panel de Zapier estaba en la capa equivocada.
- **La solución fue registrar Zapier como MCP nativo** con `openclaw mcp add` (probando con `probe` y recargando con `reload`). Ahora las herramientas se registran de primera clase, sin shell de por medio, y `tools.exec.mode: "deny"` convive con la integración funcionando. Verificado creando un evento en Calendar con `exec` cerrado.
- **OAuth headless, la solución real**: no hace falta túnel SSH ni navegador en el servidor. `openclaw mcp login <server>` imprime la URL de autorización, se abre en cualquier navegador y el código se entrega a mano con `openclaw mcp login <server> --code <code>`. Esto supera el problema descrito más arriba.
- **Callejones sin salida por el camino**, por si reaparecen: el túnel SSH al puerto del callback falló porque VS Code ya ocupaba el 8989 en el portátil; y al cambiar `--oauth-redirect-url` a otro puerto, Zapier respondía `Invalid authorization request` hasta ejecutar `openclaw mcp logout` para forzar un nuevo registro del cliente OAuth.
- **`loginctl enable-linger`**: sin linger, systemd mata los servicios de usuario al cerrar la sesión SSH y el agente deja de responder sin aviso. Verificado en `yes`.

## Pendiente

- **Corriendo como root**: el workspace es `/root/.openclaw/workspace`. El arreglo de fondo sería un usuario dedicado sin privilegios.
- **Dos entradas en el panel de Zapier, pero un solo servidor**: la autorización OAuth añadió "Openclaw mcp" junto al "Openclaw MCP Server" original. El *History* confirma que todo el tráfico —incluida la llamada nativa con `exec` ya cerrado— va al original, y que la entrada nueva no ha recibido nada. Es el registro del **cliente** OAuth, no un servidor paralelo: **no borrarla**, o se revocaría el acceso de la conexión nativa.
- **Revisar el mínimo privilegio**: el MCP nativo expone 17 herramientas y el panel de Zapier lista bastantes más de las dos acciones documentadas arriba. `openclaw mcp add --include` permite filtrar por servidor.
- **Warns que quedan y por qué se dejan**: `trusted_proxies_missing` es un falso positivo mientras el gateway esté en loopback sin proxy inverso; el plugin `groq` sin pinear es higiene de dependencias, no un riesgo activo; y el heurístico de multi-usuario no se apagará mientras haya un grupo de Telegram en la allowlist.
