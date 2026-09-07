#!/usr/bin/env node
// mcp-4geeks/server.mjs — MCP server for 4Geeks Academy (BreatheCode API)
// Zero external dependencies. Requires Node >= 18 (native fetch).
//
// Register:
//   openclaw mcp add breathecode --command node --arg /root/.openclaw/workspace/mcp-4geeks/server.mjs
//
// Probe:
//   openclaw mcp probe breathecode  → should list 6 tools
//
// If probe returns no tools, install @modelcontextprotocol/sdk and port this.

import { readFileSync, statSync } from "node:fs";
import { createInterface } from "node:readline";

// ─── Constants ───────────────────────────────────────────────────────────────

const TOKEN_PATH = "/root/.openclaw/secrets/4geeks.token";
const BASE_URL = "https://breathecode.herokuapp.com";
const TOKEN_VALID_DAYS = 7;
const PAGE_SIZE = 100;

// ─── Token helpers ───────────────────────────────────────────────────────────

function readToken() {
  try {
    return readFileSync(TOKEN_PATH, "utf-8").trim();
  } catch {
    return null;
  }
}

function tokenDaysOld() {
  try {
    const stats = statSync(TOKEN_PATH);
    return (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
  } catch {
    return Infinity;
  }
}

function tokenExpiresInDays() {
  return Math.max(0, Math.round((TOKEN_VALID_DAYS - tokenDaysOld()) * 10) / 10);
}

// ─── API client ──────────────────────────────────────────────────────────────

async function apiGet(path, params = {}) {
  const token = readToken();
  if (!token) return { _error: "NO_TOKEN" };

  const url = new URL(path, BASE_URL);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  }

  let res;
  try {
    res = await fetch(url, { headers: { Authorization: `Token ${token}` } });
  } catch (e) {
    return { _error: "NETWORK", _detail: e.message };
  }

  if (res.status === 401) return { _error: "TOKEN_EXPIRED" };
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { _error: `API_ERROR ${res.status}`, _detail: text.slice(0, 500) };
  }
  return await res.json();
}

// ─── Paginated task fetch ────────────────────────────────────────────────────
// Uses `count` from the API and iterates with `offset` until exhausted.
// If received < expected, reports it in every response.

async function fetchAllTasks(filters = {}) {
  const all = [];
  let offset = 0;
  let apiCount = null;

  while (true) {
    const data = await apiGet("/v1/assignment/user/me/task", {
      ...filters,
      limit: PAGE_SIZE,
      offset,
    });
    if (data._error) return data;

    const { count, results } = data;
    if (typeof count !== "number" || !Array.isArray(results)) {
      return { _error: "UNEXPECTED_RESPONSE", _detail: "missing count or results" };
    }

    if (apiCount === null) apiCount = count;
    const fetched = results.length;
    all.push(...results);
    offset += fetched;

    if (offset >= apiCount || fetched === 0) break;
  }

  return { data: all, expected: apiCount, received: all.length };
}

// ─── Slug dedup — most advanced revision_status wins ──────────────────────────

const REVISION_RANK = {
  APPROVED: 4,
  REJECTED: 3,
  PENDING: 1,
  IGNORED: 0,
};

function dedupBySlug(tasks) {
  const map = new Map();
  for (const t of tasks) {
    const slug = t.associated_slug;
    if (!slug) continue;
    const curRank = REVISION_RANK[t.revision_status] ?? 1;
    const existing = map.get(slug);
    const existingRank = existing ? (REVISION_RANK[existing.revision_status] ?? 1) : -1;
    // Tiebreaker: at same rank, prefer DONE task_status then most recent delivered_at
    if (!existing || curRank > existingRank) {
      map.set(slug, { ...t, _effective_status: t.revision_status || "PENDING" });
    } else if (curRank === existingRank) {
      const existingBetter =
        (existing.task_status === "DONE" && t.task_status !== "DONE") ||
        (existing.task_status === "DONE" && t.task_status === "DONE" &&
          new Date(existing.delivered_at || 0) >= new Date(t.delivered_at || 0));
      if (!existingBetter) {
        map.set(slug, { ...t, _effective_status: t.revision_status || "PENDING" });
      }
    }
  }
  return [...map.values()];
}

// ─── MCP tool definitions ────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "get_profile",
    description:
      "Verifica que el token siga vivo y devuelve los datos de identidad del estudiante (nombre, email, username, avatar).",
    inputSchema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "get_cohorts",
    description:
      "Devuelve la lista de cohortes (grupos) del estudiante: nombre, slug, etapa, fechas de inicio y fin.",
    inputSchema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "get_projects_status",
    description:
      "Lista todas las tareas (proyectos y ejercicios) con su estado actual tras cruzar por slug. Devuelve slug, título, tipo y estado real (APPROVED/REJECTED/DONE/PENDING).",
    inputSchema: {
      type: "object",
      properties: {
        task_type: {
          type: "string",
          description:
            "Filtrar por tipo: PROJECT, EXERCISE o ambos separados por coma. Por defecto: PROJECT.",
          default: "PROJECT",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "get_pending",
    description:
      "Qué proyectos y ejercicios te faltan por entregar (no entregados o rechazados), separando los que están esperando corrección.",
    inputSchema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "get_progress",
    description:
      "Resumen general del curso: total de proyectos y ejercicios, cuántos aprobados, rechazados, pendientes de entrega y esperando corrección.",
    inputSchema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "get_feedback",
    description:
      "Comentarios de los correctores sobre tus entregas revisadas. Muestra slug, título, tipo, comentario y fecha de revisión.",
    inputSchema: {
      type: "object",
      properties: {
        task_type: {
          type: "string",
          description:
            "Filtrar por tipo: PROJECT, EXERCISE o ambos separados por coma. Por defecto: PROJECT,EXERCISE.",
          default: "PROJECT,EXERCISE",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
];

// ─── Tool handlers ───────────────────────────────────────────────────────────

function tokenLine() {
  const days = tokenExpiresInDays();
  return `\ud83d\udd11 Token: ${days > 0 ? `${days} dias restantes` : "caducado \u2014 renovar con Diego"}`;
}

async function handleGetProfile(args) {
  const data = await apiGet("/v1/auth/user/me");
  if (data._error) return formatApiError(data);

  const lines = [
    tokenLine(),
    "",
    `**${data.first_name} ${data.last_name}**`,
    `\u2709\ufe0f ${data.email}`,
    `\ud83d\udc64 @${data.username}`,
  ];
  if (data.avatar_url) lines.push(` ${data.avatar_url}`);

  return lines.join("\n");
}

async function handleGetCohorts(args) {
  const data = await apiGet("/v1/admissions/user/me");
  if (data._error) return formatApiError(data);

  const enrollments = Array.isArray(data.cohorts) ? data.cohorts : [];
  if (enrollments.length === 0) {
    return `${tokenLine()}\n\nNo estas asignado a ninguna cohorte.`;
  }

  // Each enrollment wraps a cohort: { cohort: { id, slug, name, micro_cohorts, ... }, ... }
  const cohorts = enrollments.map((e) => e.cohort).filter(Boolean);

  // Main cohort = the one with the most micro_cohorts (spain-aie-pt-4 has 23, others 0-3)
  const sorted = [...cohorts].sort(
    (a, b) => (b.micro_cohorts?.length || 0) - (a.micro_cohorts?.length || 0)
  );
  const main = sorted[0];

  const lines = [tokenLine(), ""];
  const mainStart = main.kickoff_date ? main.kickoff_date.slice(0, 10) : "\u2014";
  const mainEnd = main.ending_date ? main.ending_date.slice(0, 10) : "\u2014";
  lines.push(`\ud83c\udfeb **${main.name}** (${main.slug}) \u2014 ${mainStart} \u2192 ${mainEnd}`);

  const rest = sorted.slice(1);
  if (rest.length > 0) {
    lines.push(`\n... y ${rest.length} cohortes mas (modulos y prework). Pide "todas" para verlas.`);
  }

  return lines.join("\n");
}

async function handleGetProjectsStatus(args) {
  const taskType = args?.task_type || "PROJECT";

  const raw = await fetchAllTasks({ task_type: taskType });
  if (raw._error) return formatApiError(raw);

  const deduped = dedupBySlug(raw.data);
  if (deduped.length === 0) {
    return `${tokenLine()}\n\nNo se encontraron elementos de ese tipo.`;
  }

  const lines = [
    tokenLine(),
    `\ud83d\udce6 ${deduped.length} elementos unicos (${raw.received} filas de ${raw.expected} esperadas)`,
    "",
  ];

  const sorted = [...deduped].sort((a, b) => {
    const rank = (s) => REVISION_RANK[s.revision_status] ?? 1;
    return rank(b) - rank(a);
  });

  for (const t of sorted) {
    const icon = { APPROVED: "\u2705", REJECTED: "\u274c", DONE: "\ud83d\udcec", PENDING: "\u23f3", IGNORED: "\u2b1c" }[t.revision_status] || "\u23f3";
    const type = t.task_type === "PROJECT" ? "\ud83d\udcd0" : "\ud83d\udcdd";
    lines.push(`${icon} ${type} **${t.title}** \u2014 _${t.revision_status || "PENDING"}_ (${t.associated_slug})`);
  }

  return lines.join("\n");
}

async function handleGetPending(args) {
  // Default: solo PROJECTS. Ejercicios al final como linea de recuento.
  const raw = await fetchAllTasks({ task_type: "PROJECT,EXERCISE" });
  if (raw._error) return formatApiError(raw);

  const deduped = dedupBySlug(raw.data);
  const projects = deduped.filter((t) => t.task_type === "PROJECT");
  const exercises = deduped.filter((t) => t.task_type === "EXERCISE");

  // Proyectos: lo que necesita trabajo
  const needWork = projects.filter(
    (t) => t.task_status === "PENDING" || t.revision_status === "REJECTED"
  );
  // Proyectos: entregados esperando correccion (con delivered_at no nulo)
  const waitingReview = projects.filter(
    (t) => t.task_status === "DONE" && t.revision_status === "PENDING" && t.delivered_at
  );

  const lines = [
    tokenLine(),
    `\ud83d\udcca ${raw.received} filas de ${raw.expected} esperadas -> ${deduped.length} unicos tras cruzar por slug`,
    "",
  ];

  if (needWork.length > 0) {
    lines.push(`**\ud83d\udccb Proyectos por hacer (${needWork.length}):**`);
    for (const t of needWork) {
      const icon = t.revision_status === "REJECTED" ? "\u274c" : "\u23f3";
      const label = t.revision_status === "REJECTED" ? "rechazado" : "sin entregar";
      lines.push(`  ${icon} \ud83d\udcd0 **${t.title}** \u2014 ${label} (${t.associated_slug})`);
    }
    lines.push("");
  } else {
    lines.push("\u2705 Todos los proyectos entregados y aprobados.\n");
  }

  if (waitingReview.length > 0) {
    lines.push(`**\ud83d\udcec Esperando correccion (${waitingReview.length}):**`);
    for (const t of waitingReview) {
      lines.push(`  \ud83d\udcd0 **${t.title}** \u2014 entregado ${t.delivered_at.slice(0, 10)}`);
    }
    lines.push("");
  }

  // Ejercicios: solo un recuento
  const done = exercises.filter((t) => t.revision_status === "APPROVED" || t.task_status === "DONE").length;
  const pending = exercises.filter((t) => t.task_status === "PENDING").length;
  lines.push(`\ud83d\udcdd Ejercicios: ${exercises.length} (${done} hechos, ${pending} pendientes)`);

  return lines.join("\n");
}

async function handleGetProgress(args) {
  const raw = await fetchAllTasks({ task_type: "PROJECT,EXERCISE" });
  if (raw._error) return formatApiError(raw);

  const deduped = dedupBySlug(raw.data);

  const approved = deduped.filter((t) => t.revision_status === "APPROVED").length;
  const rejected = deduped.filter((t) => t.revision_status === "REJECTED").length;
  const waitingReview = deduped.filter(
    (t) => t.task_status === "DONE" && t.revision_status === "PENDING" && t.delivered_at
  ).length;
  const autoDone = deduped.filter(
    (t) => t.task_status === "DONE" && t.revision_status === "PENDING" && !t.delivered_at
  ).length;
  const notDone = deduped.filter((t) => t.task_status === "PENDING").length;
  const ignored = deduped.filter((t) => t.revision_status === "IGNORED").length;
  const sum = approved + rejected + waitingReview + autoDone + notDone + ignored;

  const projects = deduped.filter((t) => t.task_type === "PROJECT");
  const exercises = deduped.filter((t) => t.task_type === "EXERCISE");
  const projApproved = projects.filter((t) => t.revision_status === "APPROVED").length;
  const exApproved = exercises.filter((t) => t.revision_status === "APPROVED").length;
  const projPct = projects.length > 0 ? Math.round((projApproved / projects.length) * 100) : 0;
  const exPct = exercises.length > 0 ? Math.round((exApproved / exercises.length) * 100) : 0;

  // Fetch 4Geeks official completion stats from the main cohort
  const admissions = await apiGet("/v1/admissions/user/me");
  let apiOverall = null;
  let apiMissing = [];
  let apiTotal = 0;
  let apiCompleted = 0;
  let apiPct = 0;
  let gapNote = "";

  if (!admissions._error) {
    const enrollments = Array.isArray(admissions.cohorts) ? admissions.cohorts : [];
    const cohorts = enrollments.map((e) => e.cohort).filter(Boolean);
    const sorted = [...cohorts].sort(
      (a, b) => (b.micro_cohorts?.length || 0) - (a.micro_cohorts?.length || 0)
    );
    const mainEnrollment = sorted.length > 0
      ? enrollments.find((e) => e.cohort?.slug === sorted[0].slug)
      : null;

    if (mainEnrollment && mainEnrollment.completion) {
      const c = mainEnrollment.completion;
      apiOverall = c.overall;
      if (apiOverall) {
        apiTotal = apiOverall.total || 0;
        apiCompleted = apiOverall.completed || 0;
        apiPct = apiOverall.percent || 0;
      }
      if (c.required && c.required.PROJECT && Array.isArray(c.required.PROJECT.missing)) {
        apiMissing = c.required.PROJECT.missing;
      }

      // Build gap explanation: which of 4Geeks' missing slugs are actually approved by slug-crossing
      const approvedSlugs = new Set(
        deduped.filter((t) => t.revision_status === "APPROVED").map((t) => t.associated_slug)
      );
      const actuallyMissing = apiMissing.filter((slug) => !approvedSlugs.has(slug));
      const falseMissing = apiMissing.filter((slug) => approvedSlugs.has(slug));

      if (falseMissing.length > 0) {
        const slugList = falseMissing.map((s) => `\`${s}\``).join(", ");
        gapNote = `\n\nDe los ${apiMissing.length} que 4Geeks cuenta como pendientes, ${falseMissing.length} estan aprobados en sus modulos. ${actuallyMissing.length > 0 ? `El unico pendiente de verdad es ${actuallyMissing[0]}.` : "En realidad no hay ninguno."}`;
      } else if (apiMissing.length > 0) {
        gapNote = `\n\nTodos los ${apiMissing.length} que 4Geeks cuenta como pendientes coinciden con los que tienes sin entregar.`;
      }
    }
  }

  const lines = [
    tokenLine(),
    `\ud83d\udcca ${deduped.length} unicos (${raw.received} filas de ${raw.expected})`,
    `   ${sum === deduped.length ? "\u2705 Los cubos cuadran" : `\u26a0\ufe0f Los cubos suman ${sum}, faltan ${deduped.length - sum}`}`,
    "",
    `\ud83d\udcd0 Proyectos: ${projects.length} (${projApproved} aprobados = ${projPct}%)`,
    `\ud83d\udcdd Ejercicios: ${exercises.length} (${exApproved} aprobados = ${exPct}%)`,
    "",
    `\u2705 Aprobados: ${approved}`,
    `\u274c Rechazados: ${rejected}`,
    `\u23f3 Sin entregar: ${notDone}`,
    `\ud83d\udcec Esperando revision: ${waitingReview}`,
    `\ud83e\udd13 Hechos sin revision formal: ${autoDone}`,
  ];
  if (ignored > 0) lines.push(`\u2b1c Ignorados: ${ignored}`);

  if (apiOverall) {
    lines.push("");
    lines.push(`**4Geeks oficial (cohorte principal):** ${apiCompleted}/${apiTotal} = ${apiPct}%`);
    if (apiMissing.length > 0) {
      lines.push(`   ${apiMissing.length} pendientes segun plataforma: ${apiMissing.join(", ")}`);
    }
  }
  if (gapNote) lines.push(gapNote);

  return lines.join("\n");
}

async function handleGetFeedback(args) {
  const taskType = args?.task_type || "PROJECT,EXERCISE";

  const raw = await fetchAllTasks({ task_type: taskType });
  if (raw._error) return formatApiError(raw);

  const deduped = dedupBySlug(raw.data);

  // description field is the reviewer comment. Skip empty ones and auto-generated text.
  const withFeedback = deduped.filter(
    (t) => t.description
      && t.description.trim().length > 0
      && !t.description.includes("You have completed all steps")
  );

  if (withFeedback.length === 0) {
    return `${tokenLine()}\n\nNo hay comentarios de correctores todavia.`;
  }

  const lines = [
    tokenLine(),
    `\ud83d\udcac ${withFeedback.length} elementos con feedback (${raw.received} filas de ${raw.expected})`,
    "",
  ];

  const sorted = [...withFeedback].sort(
    (a, b) => new Date(b.reviewed_at || 0) - new Date(a.reviewed_at || 0)
  );

  for (const t of sorted) {
    const icon = t.revision_status === "APPROVED" ? "\u2705" : t.revision_status === "REJECTED" ? "\u274c" : "\ud83d\udcec";
    const type = t.task_type === "PROJECT" ? "\ud83d\udcd0" : "\ud83d\udcdd";
    const date = t.reviewed_at ? t.reviewed_at.slice(0, 10) : t.delivered_at?.slice(0, 10) || "?";
    lines.push(`${icon} ${type} **${t.title}** (${date})`);
    lines.push(`   ${t.description.trim()}`);
    lines.push("");
  }

  return lines.join("\n");
}

function formatApiError(err) {
  switch (err._error) {
    case "NO_TOKEN":
      return "No encuentro el token en /root/.openclaw/secrets/4geeks.token";
    case "TOKEN_EXPIRED":
      return "Token caducado. Diego tiene que renovarlo (caduca a los 7 dias) y actualizar el fichero 4geeks.token";
    case "NETWORK":
      return `Error de red: ${err._detail || "no se pudo conectar con BreatheCode"}`;
    default:
      return `Error: ${err._error}${err._detail ? ` - ${err._detail}` : ""}`;
  }
}

// ─── Tool router ──────────────────────────────────────────────────────────────

const HANDLERS = {
  get_profile: handleGetProfile,
  get_cohorts: handleGetCohorts,
  get_projects_status: handleGetProjectsStatus,
  get_pending: handleGetPending,
  get_progress: handleGetProgress,
  get_feedback: handleGetFeedback,
};

// ─── MCP JSON-RPC 2.0 over stdin/stdout ─────────────────────────────────────

const rl = createInterface({ input: process.stdin });

function send(id, result) {
  const msg = JSON.stringify({ jsonrpc: "2.0", id, result });
  process.stdout.write(msg + "\n");
}

function sendError(id, code, message, data) {
  const err = { code, message };
  if (data) err.data = data;
  const msg = JSON.stringify({ jsonrpc: "2.0", id, error: err });
  process.stdout.write(msg + "\n");
}

// Listen on stdin for JSON-RPC messages
rl.on("line", async (line) => {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }

  const { method, id, params } = msg;

  // ── Lifecycle: initialize ──
  if (method === "initialize") {
    send(id, {
      protocolVersion: "2024-11-05",
      serverInfo: { name: "mcp-4geeks", version: "1.0.0" },
      capabilities: {
        tools: {},
      },
    });
    return;
  }

  // ── Lifecycle: ping ──
  if (method === "ping") {
    send(id, {});
    return;
  }

  // ── Lifecycle: tools/list ──
  if (method === "tools/list") {
    send(id, { tools: TOOLS });
    return;
  }

  // ── Tool execution: tools/call ──
  if (method === "tools/call") {
    const handler = HANDLERS[params.name];
    if (!handler) {
      send(id, {
        content: [{ type: "text", text: `Tool not found: ${params.name}` }],
        isError: true,
      });
      return;
    }

    try {
      const resultText = await handler(params.arguments);
      send(id, {
        content: [{ type: "text", text: String(resultText) }],
        isError: !!resultText._error || false,
      });
    } catch (e) {
      send(id, {
        content: [{ type: "text", text: `Internal error: ${e.message}` }],
        isError: true,
      });
    }
    return;
  }

  // ── Unknown method with id ── respond JSON-RPC Method Not Found
  if (id !== undefined) {
    sendError(id, -32601, "Method not found", { method });
  }
  // notifications without id — silently ignored
});

// ─── Shutdown safety ─────────────────────────────────────────────────────────

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));