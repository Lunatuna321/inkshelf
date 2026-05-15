const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = process.env.PORT || 3000;
const HOST = "127.0.0.1";
const ROOT = __dirname;
const DATA_ROOT = path.join(ROOT, "data");
const CLOUD_ROOT = path.join(DATA_ROOT, "cloud-library");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5";
const SESSION_COOKIE = "inkshelf_session";
const sessions = new Map();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function createServer() {
  return http.createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === "/api/auth/session") {
        return handleAuthSession(req, res);
      }

      if (req.method === "POST" && req.url === "/api/auth/login") {
        return handleAuthLogin(req, res);
      }

      if (req.method === "POST" && req.url === "/api/auth/logout") {
        return handleAuthLogout(req, res);
      }

      if (req.method === "GET" && req.url === "/api/sync/state") {
        return handleSyncPull(req, res);
      }

      if (req.method === "POST" && req.url === "/api/sync/state") {
        return handleSyncPush(req, res);
      }

      if (req.method === "GET" && req.url === "/api/status") {
        return json(res, 200, {
          ok: Boolean(OPENAI_API_KEY),
          model: OPENAI_MODEL,
        });
      }

      if (req.method === "POST" && req.url === "/api/reflection/chat") {
        return handleReflectionChat(req, res);
      }

      if (req.method === "POST" && req.url === "/api/reflection/chat-stream") {
        return handleReflectionChatStream(req, res);
      }

      if (req.method === "POST" && req.url === "/api/reflection/summarize") {
        return handleReflectionSummary(req, res);
      }

      if (req.method === "POST" && req.url === "/api/draft/rewrite") {
        return handleDraftRewrite(req, res);
      }

      if (req.method === "GET" || req.method === "HEAD") {
        return serveStatic(req, res);
      }

      return json(res, 404, { error: "not_found" });
    } catch (error) {
      return json(res, 500, { error: "server_error", detail: String(error.message || error) });
    }
  });
}

async function handleAuthSession(req, res) {
  const session = getSession(req);
  return json(res, 200, {
    user: session ? session.user : null,
  });
}

async function handleAuthLogin(req, res) {
  const body = await readJson(req);
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim();

  if (!email || !email.includes("@")) {
    return json(res, 400, { error: "invalid_email" });
  }

  const user = {
    id: buildUserId(email),
    email,
    name: name || email.split("@")[0],
  };

  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, {
    user,
    createdAt: new Date().toISOString(),
  });

  setSessionCookie(res, sessionId);
  return json(res, 200, { ok: true, user });
}

async function handleAuthLogout(req, res) {
  const cookies = parseCookies(req);
  const sessionId = cookies[SESSION_COOKIE];
  if (sessionId) {
    sessions.delete(sessionId);
  }
  clearSessionCookie(res);
  return json(res, 200, { ok: true });
}

async function handleSyncPull(req, res) {
  const session = requireSession(req, res);
  if (!session) {
    return;
  }

  const payload = await readCloudState(session.user.id);
  return json(res, 200, {
    user: session.user,
    hasState: Boolean(payload),
    state: payload?.state || null,
    updatedAt: payload?.updatedAt || null,
  });
}

async function handleSyncPush(req, res) {
  const session = requireSession(req, res);
  if (!session) {
    return;
  }

  const body = await readJson(req);
  if (!body || typeof body.state !== "object" || body.state === null) {
    return json(res, 400, { error: "invalid_state" });
  }

  const payload = {
    user: session.user,
    updatedAt: new Date().toISOString(),
    state: body.state,
  };

  await writeCloudState(session.user.id, payload);
  return json(res, 200, {
    ok: true,
    syncedAt: payload.updatedAt,
  });
}

function startServer({ port = PORT, host = HOST } = {}) {
  const server = createServer();
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve({
        server,
        port,
        host,
        url: `http://${host}:${port}`,
      });
    });
  });
}

async function handleReflectionChat(req, res) {
  if (!OPENAI_API_KEY) {
    return json(res, 400, { error: "missing_api_key" });
  }

  const body = await readJson(req);
  const payload = buildChatPayload(body, false);

  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await apiResponse.json();
  if (!apiResponse.ok) {
    return json(res, apiResponse.status, {
      error: "openai_error",
      detail: data.error?.message || "Request failed",
    });
  }

  return json(res, 200, {
    reply: data.output_text || "",
    responseId: data.id || null,
  });
}

async function handleReflectionChatStream(req, res) {
  if (!OPENAI_API_KEY) {
    return json(res, 400, { error: "missing_api_key" });
  }

  const body = await readJson(req);
  const payload = buildChatPayload(body, true);
  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!apiResponse.ok) {
    const data = await apiResponse.json();
    return json(res, apiResponse.status, {
      error: "openai_error",
      detail: data.error?.message || "Request failed",
    });
  }

  res.writeHead(200, {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  const decoder = new TextDecoder();
  let buffer = "";
  let responseId = null;

  for await (const chunk of apiResponse.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    events.forEach((eventBlock) => {
      const dataLines = eventBlock
        .split("\n")
        .filter((line) => line.startsWith("data: "))
        .map((line) => line.slice(6));

      if (!dataLines.length) {
        return;
      }

      const raw = dataLines.join("\n");
      if (raw === "[DONE]") {
        if (responseId) {
          res.write(`${JSON.stringify({ type: "done", responseId })}\n`);
        }
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return;
      }

      if (parsed.type === "response.created") {
        responseId = parsed.response?.id || responseId;
      }
      if (parsed.type === "response.output_text.delta") {
        res.write(`${JSON.stringify({ type: "delta", delta: parsed.delta || "" })}\n`);
      }
      if (parsed.type === "response.completed") {
        responseId = parsed.response?.id || responseId;
        res.write(`${JSON.stringify({ type: "done", responseId })}\n`);
      }
      if (parsed.type === "error") {
        res.write(`${JSON.stringify({ type: "error", message: parsed.error?.message || "stream_error" })}\n`);
      }
    });
  }

  res.end();
}

async function handleReflectionSummary(req, res) {
  if (!OPENAI_API_KEY) {
    return json(res, 400, { error: "missing_api_key" });
  }

  const body = await readJson(req);
  const transcript = Array.isArray(body.transcript) ? body.transcript.slice(-16) : [];
  const styleSamples = Array.isArray(body.styleSamples) ? body.styleSamples.slice(0, 6) : [];

  const instructions = [
    "You are a writing synthesis assistant.",
    "Turn the user's finished reflection dialogue into a polished short piece.",
    "Preserve the user's actual meaning and stay close to the voice they seem to prefer.",
    "Do not use a title, bullets, or process commentary.",
    "Write a complete short passage of roughly 180 to 320 words or the equivalent natural length in the user's language.",
    "Always answer in the same language the user mainly used in the dialogue.",
    `Style tendency: ${body.styleProfile?.style || "Minimal"}; mood tendency: ${body.styleProfile?.mood || "Calm"}; sentence rhythm: ${body.styleProfile?.rhythm || "shorter sentences"}`,
    styleSamples.length ? `Reference samples for tone and density only. Do not repeat them:\n${styleSamples.join("\n---\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const prompt = [
    `Topic: ${body.topic || "Untitled topic"}`,
    "Dialogue transcript:",
    ...transcript.map((message) => `${message.role === "ai" ? "Assistant" : "User"}: ${message.text}`),
    "Shape what the user truly means into a coherent, well-written short piece.",
  ].join("\n");

  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      reasoning: { effort: "medium" },
      instructions,
      input: prompt,
    }),
  });

  const data = await apiResponse.json();
  if (!apiResponse.ok) {
    return json(res, apiResponse.status, {
      error: "openai_error",
      detail: data.error?.message || "Request failed",
    });
  }

  return json(res, 200, {
    article: data.output_text || "",
  });
}

async function handleDraftRewrite(req, res) {
  if (!OPENAI_API_KEY) {
    return json(res, 400, { error: "missing_api_key" });
  }

  const body = await readJson(req);
  const styleSamples = Array.isArray(body.styleSamples) ? body.styleSamples.slice(0, 6) : [];
  const instructions = [
    "You are a rewriting assistant.",
    "Rewrite the text without changing its core meaning.",
    "Do not explain the rewrite and do not add a title. Output only the rewritten body text.",
    "Always write in the same language as the source text unless the request explicitly asks otherwise.",
    `Base style tendency: ${body.styleProfile?.style || "Minimal"}; mood: ${body.styleProfile?.mood || "Calm"}; rhythm: ${body.styleProfile?.rhythm || "shorter sentences"}`,
    `Requested rewrite direction: ${body.targetStyle || "clearer"}`,
    styleSamples.length ? `Reference samples for voice only. Do not repeat them:\n${styleSamples.join("\n---\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const prompt = [
    `Title: ${body.title || "Untitled draft"}`,
    "Original text:",
    body.text || "",
    "Rewrite toward the requested style. Keep the overall length close, but make the language more finished.",
  ].join("\n");

  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      reasoning: { effort: "medium" },
      instructions,
      input: prompt,
    }),
  });

  const data = await apiResponse.json();
  if (!apiResponse.ok) {
    return json(res, apiResponse.status, {
      error: "openai_error",
      detail: data.error?.message || "Request failed",
    });
  }

  return json(res, 200, { text: data.output_text || "" });
}

function serveStatic(req, res) {
  const pathname = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(path.join(ROOT, pathname));
  if (!safePath.startsWith(ROOT) || safePath.startsWith(DATA_ROOT)) {
    return json(res, 403, { error: "forbidden" });
  }

  fs.readFile(safePath, (error, file) => {
    if (error) {
      return json(res, 404, { error: "not_found" });
    }
    const ext = path.extname(safePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "text/plain; charset=utf-8" });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    res.end(file);
  });
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, entry) => {
      const index = entry.indexOf("=");
      if (index < 0) {
        return acc;
      }
      const key = entry.slice(0, index);
      const value = decodeURIComponent(entry.slice(index + 1));
      acc[key] = value;
      return acc;
    }, {});
}

function getSession(req) {
  const cookies = parseCookies(req);
  const sessionId = cookies[SESSION_COOKIE];
  if (!sessionId) {
    return null;
  }
  return sessions.get(sessionId) || null;
}

function requireSession(req, res) {
  const session = getSession(req);
  if (!session) {
    json(res, 401, { error: "auth_required" });
    return null;
  }
  return session;
}

function setSessionCookie(res, sessionId) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function buildUserId(email) {
  return email.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function getCloudFile(userId) {
  return path.join(CLOUD_ROOT, `${userId}.json`);
}

async function readCloudState(userId) {
  try {
    const raw = await fsp.readFile(getCloudFile(userId), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeCloudState(userId, payload) {
  await fsp.mkdir(CLOUD_ROOT, { recursive: true });
  await fsp.writeFile(getCloudFile(userId), JSON.stringify(payload, null, 2), "utf8");
}

function buildChatPayload(body, stream = false) {
  const styleSamples = Array.isArray(body.styleSamples) ? body.styleSamples.slice(0, 6) : [];
  const transcript = Array.isArray(body.transcript) ? body.transcript.slice(-12) : [];

  const instructions = [
    "You are a reflection coach.",
    "Your job is to deepen the user's thinking rather than conclude too early.",
    "Reply in short, compact turns, ideally one to three sentences.",
    "Ask sharper questions, clarify tensions, revisit contradictions, and enlarge meaningful detail.",
    "Do not lecture, do not summarize into an essay, and do not use bullet lists.",
    "You may be warm, but never vague. Build directly from what the user just said.",
    "Always answer in the same language the user is using.",
    `Preferred expression profile: ${body.styleProfile?.style || "Minimal"}; mood: ${body.styleProfile?.mood || "Calm"}; rhythm: ${body.styleProfile?.rhythm || "shorter sentences"}`,
    styleSamples.length ? `Reference samples for tone only. Do not repeat them:\n${styleSamples.join("\n---\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const input = [];
  if (body.mode === "start") {
    input.push({
      role: "user",
      content: `I want to think about this question: "${body.topic}". Start by asking the first question that can genuinely open the thought up.`,
    });
  } else {
    transcript.forEach((message) => {
      input.push({
        role: message.role === "ai" ? "assistant" : "user",
        content: message.text,
      });
    });
    input.push({
      role: "user",
      content: body.userText || "",
    });
  }

  const payload = {
    model: OPENAI_MODEL,
    reasoning: { effort: "medium" },
    instructions,
    input,
    stream,
  };

  if (body.previousResponseId) {
    payload.previous_response_id = body.previousResponseId;
  }

  return payload;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(payload));
}

module.exports = {
  createServer,
  startServer,
};

if (require.main === module) {
  startServer()
    .then(({ url }) => {
      console.log(`InkShelf server running at ${url}`);
    })
    .catch((error) => {
      console.error("Failed to start InkShelf server:", error);
      process.exitCode = 1;
    });
}
