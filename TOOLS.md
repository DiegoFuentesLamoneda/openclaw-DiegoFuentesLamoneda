# TOOLS.md — Mi equipo de trabajo

Notas concretas de **esta** instalación. Las skills dicen *cómo* se usa una herramienta; este fichero dice *qué* hay aquí y con qué convenciones.

## Lo que tengo conectado

**Un solo servidor MCP: `zapier`**, nativo, por HTTP con OAuth. Da acceso a **Google Docs** y **Google Calendar** de la cuenta `diego@i21ecodesign.com`.

Y **Telegram**, que es el canal por el que hablo con Diego.

Eso es todo. No hay Gmail, ni Drive como app aparte, ni Tasks, ni GitHub. Si algo necesita uno de esos, no puedo hacerlo — dilo en vez de buscar rodeos.

## Cómo se llaman las cosas

Zapier no expone las acciones directamente: expone meta-herramientas. El patrón siempre es el mismo.

- `zapier__discover_zapier_actions` → qué acciones existen
- `zapier__inspect_zapier_actions` → qué parámetros acepta una acción
- `zapier__execute_zapier_read_action` → leer
- `zapier__execute_zapier_write_action` → escribir

Las que uso de verdad:

| Acción | Para qué |
|---|---|
| `google_docs_create_document_from_text` | crear un documento nuevo |
| `google_docs_append_text_to_document` | añadir al final de uno que ya existe |
| `google_docs_find_a_document` | localizar un documento por nombre |
| `google_docs_get_document_content` | leer lo que hay dentro |
| `google_calendar_create_detailed_event` | crear un evento con todos sus campos |
| `google_calendar_find_events` | consultar la agenda |

Si dudas de un parámetro, `inspect` antes de ejecutar. Es más barato que crear un evento mal.

## Convenciones que no se negocian

**Carpeta de Drive.** Todo lo que yo cree en Docs va a la carpeta **`Grace`**:

    folder = 1JoVDkU0tJbC2pmeqRVxpPoWmrilwwMX5

Nunca escribo fuera de ahí. No es que no pueda técnicamente — es que Diego confía en que no lo haga.

**Calendario.** El principal: `diego@i21ecodesign.com`.

**Zona horaria.** `Europe/Madrid`. En verano `+02:00`, en invierno `+01:00`. Nunca UTC.

**Duración por defecto.** 30 minutos si no se especifica.

**Si falta el título o la fecha de un evento, pregunto.** Lo demás lo decido y lo digo.

## Telegram

- Sin tablas de Markdown: no se ven bien en el móvil. Listas.
- Mensajes cortos. Lo largo va a un Doc y le paso el enlace.
- Un emoji o dos. No una fiesta.

## Lo que NO puedo hacer

**No tengo shell.** `tools.exec.mode` está en `deny` desde julio, y es a propósito: con shell podría leer mis propias credenciales. Si algo solo se puede hacer ejecutando un comando, no se puede hacer.

Por eso `scripts/calendar_event.js` está muerto. Existe en el workspace por historia, pero no lo puedo ejecutar. **No lo intentes.** Todo va por el MCP.

**No salgo del workspace.** `tools.fs.workspaceOnly` está activo.

## Cuando Zapier deja de responder

El token OAuth caduca cada pocas semanas. El síntoma es claro: `MCP server "zapier" requires OAuth authorization`.

No lo puedo arreglar yo — hace falta un navegador. Aviso a Diego y le paso estos pasos:

1. `openclaw mcp login zapier` en el VPS
2. Abrir la URL que imprime y darle a **Allow**
3. La redirección falla (`This site can not be reached`): es lo normal en un servidor sin navegador
4. Copiar el `code` de la barra de direcciones
5. `openclaw mcp login zapier --code <code>`
6. Comprobar con `openclaw mcp probe zapier` → deben salir 17 herramientas
