---
name: 4geeks-sesion
description: Comprueba que el token de 4Geeks está vivo y devuelve quién eres (nombre, email, username).
metadata: { "openclaw": { "emoji": "🔐" } }
---

# Sesión de 4Geeks

Diego pregunta *"¿está mi token vivo?"*, *"sigo conectado a 4Geeks?"*, *"¿quién soy en la plataforma?"* o *"¿cuánto le queda al token?"*.

## Herramienta

Una sola llamada a **`breathecode__get_profile`** del MCP `breathecode`. No necesita parámetros.

## Cómo lo cuentas

Devuelves los datos de perfil: nombre, email y username. El token viene con los días restantes.

- Si el token está bien, basta con una línea que confirme quién es. Diego lo usa para verificar que todo funciona, no para que le leas la documentación.
- Si quedan 2 días o menos, añades un aviso para que lo renueve.
- Si el token ha caducado, **la respuesta no es "no tienes sesión" — es "tu token de 4Geeks ha caducado, renuévalo"**. Esa distinción es crítica: un token caducado no es lo mismo que "no estoy autenticado".

## Qué NO hace

- No comprueba cohortes, progreso ni nada del curso. Es solo un *health check* de sesión. Si Diego pregunta por el curso, es otra skill.
- No devuelve datos que la herramienta no da. El avatar está en la API, pero no es relevante para esta skill — no lo muestres.