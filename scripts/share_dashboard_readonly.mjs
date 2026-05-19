#!/usr/bin/env node
import { createServer } from "node:http";

const targetOrigin = process.env.CODEX_PET_DASHBOARD_TARGET ?? "http://127.0.0.1:4321";
const port = Number(process.env.CODEX_PET_READONLY_PORT ?? process.argv[2] ?? 4331);
const host = process.env.CODEX_PET_READONLY_HOST ?? process.argv[3] ?? "127.0.0.1";
const allowedApiGetRoutes = new Set([
  "/api/config",
  "/api/status",
  "/api/doctor",
  "/api/auto-scan",
  "/api/pets"
]);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("Port must be an integer between 1 and 65535.");
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    sendJson(response, 502, {
      error: error instanceof Error ? error.message : String(error)
    });
  });
});

server.listen(port, host, () => {
  console.log(`Read-only dashboard proxy running at http://${host}:${port}`);
  console.log(`Forwarding safe GET requests to ${targetOrigin}`);
});

async function handleRequest(request, response) {
  const method = request.method ?? "GET";
  const sourceUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  if (method === "OPTIONS") {
    response.writeHead(204, safeHeaders("text/plain; charset=utf-8"));
    response.end();
    return;
  }

  if (method !== "GET" && method !== "HEAD") {
    sendJson(response, 403, {
      error: "This shared dashboard is read-only. Write actions are disabled."
    });
    return;
  }

  if (!isAllowedReadPath(sourceUrl.pathname)) {
    sendJson(response, 404, {
      error: "Route is not available in the read-only share."
    });
    return;
  }

  const targetUrl = new URL(sourceUrl.pathname + sourceUrl.search, targetOrigin);
  const upstream = await fetch(targetUrl, {
    method,
    headers: {
      accept: request.headers.accept ?? "*/*"
    }
  });

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const body = Buffer.from(await upstream.arrayBuffer());

  if (!upstream.ok) {
    sendBuffer(response, upstream.status, body, contentType);
    return;
  }

  if (sourceUrl.pathname === "/") {
    const html = injectReadOnlyBanner(body.toString("utf8"));
    sendText(response, 200, html, "text/html; charset=utf-8");
    return;
  }

  if (sourceUrl.pathname === "/app.js") {
    sendText(response, 200, `${body.toString("utf8")}\n${readOnlyClientPatch()}\n`, "text/javascript; charset=utf-8");
    return;
  }

  if (sourceUrl.pathname === "/api/config") {
    const config = JSON.parse(body.toString("utf8"));
    const { writeToken: _writeToken, ...safeConfig } = config;
    sendJson(response, 200, {
      ...safeConfig,
      readOnlyShare: true
    });
    return;
  }

  sendBuffer(response, 200, body, contentType);
}

function isAllowedReadPath(pathname) {
  if (pathname === "/" || pathname === "/styles.css" || pathname === "/app.js" || pathname === "/favicon.ico") {
    return true;
  }

  if (allowedApiGetRoutes.has(pathname)) {
    return true;
  }

  return /^\/pet\/(?:[^/]+\/)?(?:pet\.json|spritesheet\.webp)$/u.test(pathname);
}

function injectReadOnlyBanner(html) {
  const style = `
    <style>
      .readonly-share-banner {
        position: sticky;
        top: 0;
        z-index: 20;
        padding: 9px 14px;
        background: #163b36;
        color: #fff;
        font: 700 13px/1.4 Inter, ui-sans-serif, system-ui, sans-serif;
        text-align: center;
      }
      body.readonly-share .button[disabled] {
        cursor: not-allowed;
      }
    </style>`;
  const safeBanner = `<div class="readonly-share-banner">&#21482;&#35835;&#36828;&#31243;&#39044;&#35272;&#65306;&#21487;&#20197;&#26597;&#30475;&#29366;&#24577;&#21644;&#25112;&#32489;&#65292;&#25195;&#25551;&#12289;&#25112;&#26007;&#20889;&#20837;&#12289;&#22791;&#20221;&#21644;&#33258;&#21160;&#25195;&#25551;&#24050;&#20851;&#38381;&#12290;</div>`;
  return html
    .replace("</head>", `${style}</head>`)
    .replace("<body>", `<body class="readonly-share">${safeBanner}`);
}

function readOnlyClientPatch() {
  return `
;(() => {
  const disabledIds = [
    "dryRunButton",
    "confirmButton",
    "practiceBattleButton",
    "autoStartButton",
    "autoStopButton",
    "backupStateButton"
  ];
  const disableWrites = () => {
    for (const id of disabledIds) {
      const element = document.getElementById(id);
      if (!element) {
        continue;
      }
      element.disabled = true;
      element.title = "只读远程预览已关闭写操作";
    }
  };
  window.addEventListener("load", () => {
    disableWrites();
    setInterval(disableWrites, 1000);
  });
})();`;
}

function sendJson(response, statusCode, payload) {
  sendText(response, statusCode, `${JSON.stringify(payload)}\n`, "application/json; charset=utf-8");
}

function sendText(response, statusCode, body, contentType) {
  response.writeHead(statusCode, safeHeaders(contentType, Buffer.byteLength(body)));
  response.end(body);
}

function sendBuffer(response, statusCode, body, contentType) {
  response.writeHead(statusCode, safeHeaders(contentType, body.byteLength));
  response.end(body);
}

function safeHeaders(contentType, contentLength) {
  return {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
    ...(contentLength === undefined ? {} : { "Content-Length": String(contentLength) })
  };
}
