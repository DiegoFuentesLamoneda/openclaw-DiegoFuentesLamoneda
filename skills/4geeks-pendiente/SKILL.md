---
name: 4geeks-pendiente
description: Qué proyectos de 4Geeks te faltan por entregar o te han rechazado, separando los que están esperando corrección.
metadata: { "openclaw": { "emoji": "📋" } }
---

# Pendiente de 4Geeks

Diego pregunta *"¿qué me falta?"*, *"¿qué tengo que entregar?"*, *"¿voy retrasado?"* o *"¿qué proyectos no he hecho?"*.

## Herramienta

Una sola llamada a **`get_pending`** del MCP `breathecode`. No necesita parámetros — por defecto trae proyectos y ejercicios, la skill ya separa uno de otro.

## Cómo lo cuentas

- **Proyectos por hacer**: los no entregados y los rechazados. Cada uno en una línea: ❌ o ⏳, nombre y slug.
- **Esperando corrección**: los entregados que aún no han revisado. Una línea cada uno con fecha de entrega. Exige `delivered_at` no nulo — si no tiene fecha de entrega real, no es una entrega esperando nota.
- **Ejercicios**: una línea de recuento al final. "Ejercicios: 96 (X hechos, Y pendientes)". **Nunca en lista.**
- Si no hay nada pendiente, una línea y ya.

## Qué NO hace

- **No confunde token caducado con trabajo pendiente.** Si el token ha caducado, la respuesta es "tu token de 4Geeks ha caducado, renuévalo", no una lista vacía ni un mensaje de error técnico. Esta skill pierde todo su sentido si lo primero que hace es mentir sobre si hay trabajo o no.
- No lista los ejercicios uno a uno. Son muchos y no importan a este nivel de detalle.
- No inventa plazos. La API no devuelve fechas límite de entrega. Si Diego pregunta "¿para cuándo?", la respuesta honesta es que la API no lo dice.
- No muestra feedback ni comentarios de correctores. Para eso está `4geeks-feedback`.