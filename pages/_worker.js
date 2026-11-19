
// === System Console Gateway Authentication Guard ===
async function getAuthToken(pass, user) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("gateway_sys_" + (user || "") + "_" + pass));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function getSessionCookie(request) {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return null;
  const match = cookie.match(/(?:^|;\s*)sys_auth_token=([^;]+)/);
  return match ? match[1] : null;
}

const LOGIN_PAGE_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cloud Core Console - 系统管理控制台</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card: rgba(22, 31, 48, 0.8);
      --border: rgba(255, 255, 255, 0.08);
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --text: #f3f4f6;
      --muted: #9ca3af;
      --input: rgba(15, 23, 42, 0.7);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg);
      background-image: 
        radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.12) 0px, transparent 50%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .panel {
      width: 100%;
      max-width: 420px;
      background: var(--card);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 36px 32px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }
    .header { text-align: center; margin-bottom: 28px; }
    .icon-box {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2));
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 12px;
      margin-bottom: 16px;
      color: #60a5fa;
    }
    .title { font-size: 20px; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 6px; }
    .subtitle { font-size: 13px; color: var(--muted); }
    .status-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      padding: 3px 10px;
      border-radius: 20px;
      margin-top: 10px;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; }
    .field { margin-bottom: 18px; }
    label { display: block; font-size: 13px; font-weight: 500; color: #d1d5db; margin-bottom: 7px; }
    input[type="text"], input[type="password"] {
      width: 100%;
      background: var(--input);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 11px 14px;
      color: #fff;
      font-size: 14px;
      transition: all 0.2s;
    }
    input[type="text"]:focus, input[type="password"]:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
      background: rgba(15, 23, 42, 0.9);
    }
    .actions { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--muted); margin-bottom: 22px; }
    .check { display: flex; align-items: center; gap: 7px; cursor: pointer; }
    button[type="submit"] {
      width: 100%;
      background: linear-gradient(135deg, var(--accent), var(--accent-hover));
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
    }
    button[type="submit"]:disabled { opacity: 0.6; cursor: not-allowed; }
    .alert {
      display: none;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      font-size: 13px;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 18px;
      text-align: center;
    }
    .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="panel">
    <div class="header">
      <div class="icon-box">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
          <line x1="6" y1="6" x2="6.01" y2="6"></line>
          <line x1="6" y1="18" x2="6.01" y2="18"></line>
        </svg>
      </div>
      <h1 class="title">Cloud Core Console</h1>
      <p class="subtitle">企业级云端资产与服务协同平台</p>
      <div class="status-tag"><span class="dot"></span>服务网关集群就绪</div>
    </div>
    <div id="alertBox" class="alert"></div>
    <form id="authForm" autocomplete="off">
      <div class="field">
        <label for="username">控制台账号</label>
        <input type="text" id="username" autocomplete="off" required autofocus>
      </div>
      <div class="field">
        <label for="password">安全访问密钥 (Key)</label>
        <input type="password" id="password" autocomplete="new-password" required>
      </div>
      <div class="actions">
        <label class="check">
          <input type="checkbox" id="keepSession" checked> 保持安全会话 (30天)
        </label>
        <span>TLS 1.3 加密</span>
      </div>
      <button type="submit" id="submitBtn">进入控制台</button>
    </form>
    <div class="footer">
      © 2026 Cloud Ops Services. Enterprise Restricted Area.
    </div>
  </div>
  <script>
    const form = document.getElementById("authForm");
    const alertBox = document.getElementById("alertBox");
    const btn = document.getElementById("submitBtn");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      alertBox.style.display = "none";
      btn.disabled = true;
      btn.innerText = "校验凭据中...";

      try {
        const res = await fetch("/api/sys/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: document.getElementById("username").value.trim(),
            password: document.getElementById("password").value
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          btn.innerText = "认证成功，正在载入...";
          window.location.reload();
        } else {
          alertBox.innerText = data.message || "账号或密钥校验失败，请核对后重试";
          alertBox.style.display = "block";
          btn.disabled = false;
          btn.innerText = "进入控制台";
        }
      } catch (err) {
        alertBox.innerText = "网关通信异常，请稍后再试";
        alertBox.style.display = "block";
        btn.disabled = false;
        btn.innerText = "进入控制台";
      }
    });
  </script>
</body>
</html>`;

const API_ORIGIN = "https://api.cloudflareclient.com";
const API_VERSION = "v0a4471";

const CF_HEADERS = {
  "User-Agent": "WARP for Android",
  "CF-Client-Version": "a-6.35-4471",
  "Content-Type": "application/json; charset=UTF-8",
  "Accept": "application/json"
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra
    }
  });
}

function allowedSameOrigin(request) {
  const target = new URL(request.url);
  const origin = request.headers.get("Origin");

  if (origin) {
    try {
      if (new URL(origin).origin !== target.origin) return false;
    } catch {
      return false;
    }
  }

  const site = request.headers.get("Sec-Fetch-Site");
  if (site && site !== "same-origin" && site !== "none") return false;
  return true;
}

async function readSmallJson(request) {
  const type = request.headers.get("Content-Type") || "";
  if (!type.toLowerCase().includes("application/json")) {
    throw new Error("Content-Type 必须为 application/json");
  }

  const text = await request.text();
  if (text.length > 16384) throw new Error("请求体过大");

  try {
    return JSON.parse(text || "{}");
  } catch {
    throw new Error("JSON 格式无效");
  }
}

function validB64(s, max = 4096) {
  return typeof s === "string" &&
    s.length > 0 &&
    s.length <= max &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(s);
}

async function upstreamJson(url, init) {
  let res;
  try {
    res = await fetch(url, init);
  } catch (e) {
    return json({
      message: "无法连接 Cloudflare WARP 上游 API",
      detail: String(e?.message || e)
    }, 502);
  }

  const body = await res.text();
  const retryAfterHeader = res.headers.get("Retry-After");
  const retryAfter = Math.max(
    0,
    Number.parseInt(retryAfterHeader || "0", 10) || 0
  );

  // Cloudflare's 1015 page may be HTML/plain text rather than JSON.
  const is1015 =
    res.status === 429 ||
    /\b1015\b/i.test(body) ||
    /rate\s*limit/i.test(body);

  if (is1015) {
    const wait = retryAfter || 30;
    return json({
      error: "rate_limited",
      code: 1015,
      retry_after: wait,
      message: `Cloudflare WARP 注册接口触发限流，请等待 ${wait} 秒后再试。不要连续点击注册。`
    }, 429, {
      "Retry-After": String(wait)
    });
  }

  const headers = {
    "Content-Type": res.headers.get("Content-Type") || "application/json; charset=UTF-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  };
  if (retryAfterHeader) headers["Retry-After"] = retryAfterHeader;

  return new Response(body, {
    status: res.status,
    headers
  });
}
async function relayRegister(request) {
  if (!allowedSameOrigin(request)) {
    return json({ message: "跨站请求已拒绝" }, 403);
  }

  if (request.headers.get("X-Usque-Intent") !== "single-register") {
    return json({ message: "缺少注册意图标记" }, 400);
  }

  let b;
  try {
    b = await readSmallJson(request);
  } catch (e) {
    return json({ message: e.message }, 400);
  }

  if (!validB64(b.key, 256)) {
    return json({ message: "key 无效" }, 400);
  }

  if (!/^[0-9a-f]{16}$/i.test(String(b.serial_number || ""))) {
    return json({ message: "serial_number 无效" }, 400);
  }

  if (typeof b.tos !== "string" || b.tos.length < 20 || b.tos.length > 64) {
    return json({ message: "tos 时间无效" }, 400);
  }

  const payload = {
    key: b.key,
    install_id: "",
    fcm_token: "",
    tos: b.tos,
    model: "PC",
    serial_number: b.serial_number,
    os_version: "",
    key_type: "curve25519",
    tunnel_type: "wireguard",
    locale: "en_US"
  };

  return upstreamJson(`${API_ORIGIN}/${API_VERSION}/reg`, {
    method: "POST",
    headers: CF_HEADERS,
    body: JSON.stringify(payload),
    redirect: "manual"
  });
}

async function relayEnroll(request) {
  if (!allowedSameOrigin(request)) {
    return json({ message: "跨站请求已拒绝" }, 403);
  }

  if (request.headers.get("X-Usque-Intent") !== "single-register") {
    return json({ message: "缺少注册意图标记" }, 400);
  }

  let b;
  try {
    b = await readSmallJson(request);
  } catch (e) {
    return json({ message: e.message }, 400);
  }

  const id = String(b.id || "");
  const token = String(b.token || "");
  const publicKey = String(b.public_key || "");
  const name = String(b.name || "Web-Usque").slice(0, 64);

  if (!/^[A-Za-z0-9._:-]{4,256}$/.test(id)) {
    return json({ message: "device id 无效" }, 400);
  }

  if (token.length < 8 || token.length > 4096 || /[\r\n]/.test(token)) {
    return json({ message: "token 无效" }, 400);
  }

  if (!validB64(publicKey, 4096)) {
    return json({ message: "P-256 public_key 无效" }, 400);
  }

  const payload = {
    key: publicKey,
    key_type: "secp256r1",
    tunnel_type: "masque",
    name
  };

  return upstreamJson(
    `${API_ORIGIN}/${API_VERSION}/reg/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        ...CF_HEADERS,
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
      redirect: "manual"
    }
  );
}

// ---------- Hosted subscription (QR-code import) ----------
// POST /api/sub {format, content, tier} stores the generated config in KV
// (binding name: SUB_KV) under an unguessable token and returns a fetchable
// URL. tier: "24h" (default) / "7d" expire by TTL; "perm" never expires and
// supports in-place update (/api/sub/update), rotation (/api/sub/rotate,
// old link dies immediately) and revocation (/api/sub/revoke).
// GET /sub/<token> serves it to proxy clients. The stored config contains
// the user's WARP private key, so the token URL is a credential: never
// log it; the only listing is the owner-key-gated /api/sub/list,
// which returns metadata (tier / filename / expiry), never contents.
const SUB_TIERS = { "24h": 86400, "7d": 604800, "perm": 0 };
const SUB_FORMATS = {
  native: { type: "application/json; charset=UTF-8", filename: "usque-config.json" },
  clash: { type: "text/yaml; charset=UTF-8", filename: "masque-clash-smart.yaml" },
  shadowrocket: { type: "text/yaml; charset=UTF-8", filename: "masque-shadowrocket.yaml" },
  singbox: { type: "application/json; charset=UTF-8", filename: "sing-box-usque.json" },
  vless: { type: "text/plain; charset=UTF-8", filename: "usque-vless-local.txt" }
};

function subToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function createSubscription(request, env) {
  if (!env?.SUB_KV) {
    return json({ message: "订阅托管未启用：请先在 Cloudflare 给本项目绑定 KV 命名空间，变量名必须为 SUB_KV（步骤见 README「扫码获取订阅」）。" }, 503);
  }
  if (!allowedSameOrigin(request)) return json({ message: "Origin 不被允许" }, 403);
  const limited = await subRateLimit(request, env); if (limited) return limited;
  const type = request.headers.get("Content-Type") || "";
  if (!type.toLowerCase().includes("application/json")) return json({ message: "Content-Type 必须为 application/json" }, 400);
  const text = await request.text();
  if (text.length > 262144) return json({ message: "配置内容过大" }, 413);
  let body;
  try { body = JSON.parse(text || "{}"); } catch { return json({ message: "JSON 格式无效" }, 400); }
  const meta = SUB_FORMATS[body.format];
  const content = typeof body.content === "string" ? body.content : "";
  if (!meta || !content || content.length > 200000) return json({ message: "format 或 content 无效" }, 400);
  const tier = body.tier === undefined ? "24h" : body.tier;
  if (!(tier in SUB_TIERS)) return json({ message: "tier 无效（可选 24h / 7d / perm）" }, 400);
  if (tier === "perm" && !ownerKeyOk(request, env)) return ownerRequired();
  const ttl = SUB_TIERS[tier];
  const token = subToken();
  const putOptions = { metadata: { type: meta.type, filename: meta.filename, tier } };
  if (ttl > 0) putOptions.expirationTtl = ttl;
  await env.SUB_KV.put(`sub:${token}`, content, putOptions);
  const origin = new URL(request.url).origin;
  return json({ ok: true, url: `${origin}/sub/${token}`, token, tier, expiresInSeconds: ttl > 0 ? ttl : null });
}

function subKvMissing(env) {
  return !env?.SUB_KV
    ? json({ message: "订阅托管未启用：请先在 Cloudflare 给本项目绑定 KV 命名空间，变量名必须为 SUB_KV（步骤见 README「扫码获取订阅」）。" }, 503)
    : null;
}

// Public-deployment protection: when the deployer sets SUB_OWNER_KEY,
// creating or rotating a PERMANENT subscription additionally requires the
// X-Sub-Owner header to match it (short-lived tiers stay open to visitors,
// so their records expire on their own instead of piling up in KV).
// Unset = protection off (self-hosted default, unchanged behavior).
function ownerKeyOk(request, env) {
  const key = env?.SUB_OWNER_KEY;
  if (!key) return true;
  const sent = request.headers.get("X-Sub-Owner") || "";
  if (sent === key) return true;
  // Keys with non-Latin-1 characters (e.g. Chinese) cannot travel raw in an
  // HTTP header; the panel sends them as "b64:<base64 of UTF-8 bytes>".
  if (sent.startsWith("b64:")) {
    try {
      const bytes = Uint8Array.from(atob(sent.slice(4)), c => c.charCodeAt(0));
      if (new TextDecoder().decode(bytes) === key) return true;
    } catch { /* malformed base64: fall through to false */ }
  }
  return false;
}

function ownerRequired() {
  return json({ message: "常驻订阅仅部署者可用：需要部署者口令（部署者在 Cloudflare 设置的 SUB_OWNER_KEY）。", code: "owner_required" }, 403);
}

// Simple per-IP hourly cap on subscription writes (create/update/rotate).
// Best-effort (KV is eventually consistent); for stricter protection add a
// Cloudflare Rate Limiting rule on /api/sub* — see README.
const SUB_WRITE_LIMIT_PER_HOUR = 60;

async function subRateLimit(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const bucket = `rl:${ip}:${Math.floor(Date.now() / 3600000)}`;
  const current = parseInt((await env.SUB_KV.get(bucket)) || "0", 10) || 0;
  if (current >= SUB_WRITE_LIMIT_PER_HOUR) {
    return json({ message: "操作太频繁：这个 IP 一小时内的订阅写入次数已达上限，请稍后再试。" }, 429);
  }
  await env.SUB_KV.put(bucket, String(current + 1), { expirationTtl: 3700 });
  return null;
}

async function readSubJson(request) {
  const type = request.headers.get("Content-Type") || "";
  if (!type.toLowerCase().includes("application/json")) return { error: json({ message: "Content-Type 必须为 application/json" }, 400) };
  const text = await request.text();
  if (text.length > 262144) return { error: json({ message: "请求内容过大" }, 413) };
  try { return { body: JSON.parse(text || "{}") }; } catch { return { error: json({ message: "JSON 格式无效" }, 400) }; }
}

async function loadPermSubscription(env, token) {
  if (!/^[a-f0-9]{48}$/.test(token || "")) return { error: json({ message: "token 无效" }, 400) };
  const got = await env.SUB_KV.getWithMetadata(`sub:${token}`);
  if (!got || !got.value) return { error: json({ message: "订阅不存在或已过期，请重新生成。" }, 404) };
  if ((got.metadata || {}).tier !== "perm") return { error: json({ message: "只有常驻订阅支持此操作。" }, 400) };
  return { got };
}

async function updateSubscription(request, env) {
  const missing = subKvMissing(env); if (missing) return missing;
  if (!allowedSameOrigin(request)) return json({ message: "Origin 不被允许" }, 403);
  const limited = await subRateLimit(request, env); if (limited) return limited;
  const parsed = await readSubJson(request); if (parsed.error) return parsed.error;
  const loaded = await loadPermSubscription(env, parsed.body.token); if (loaded.error) return loaded.error;
  const meta = SUB_FORMATS[parsed.body.format];
  const content = typeof parsed.body.content === "string" ? parsed.body.content : "";
  if (!meta || !content || content.length > 200000) return json({ message: "format 或 content 无效" }, 400);
  await env.SUB_KV.put(`sub:${parsed.body.token}`, content, {
    metadata: { type: meta.type, filename: meta.filename, tier: "perm" }
  });
  return json({ ok: true });
}

async function rotateSubscription(request, env) {
  const missing = subKvMissing(env); if (missing) return missing;
  if (!allowedSameOrigin(request)) return json({ message: "Origin 不被允许" }, 403);
  if (!ownerKeyOk(request, env)) return ownerRequired();
  const limited = await subRateLimit(request, env); if (limited) return limited;
  const parsed = await readSubJson(request); if (parsed.error) return parsed.error;
  const loaded = await loadPermSubscription(env, parsed.body.token); if (loaded.error) return loaded.error;
  const token = subToken();
  await env.SUB_KV.put(`sub:${token}`, loaded.got.value, { metadata: loaded.got.metadata });
  await env.SUB_KV.delete(`sub:${parsed.body.token}`);
  const origin = new URL(request.url).origin;
  return json({ ok: true, url: `${origin}/sub/${token}`, token, tier: "perm", expiresInSeconds: null });
}

async function revokeSubscription(request, env) {
  const missing = subKvMissing(env); if (missing) return missing;
  if (!allowedSameOrigin(request)) return json({ message: "Origin 不被允许" }, 403);
  const parsed = await readSubJson(request); if (parsed.error) return parsed.error;
  const token = parsed.body.token;
  if (!/^[a-f0-9]{48}$/.test(token || "")) return json({ message: "token 无效" }, 400);
  await env.SUB_KV.delete(`sub:${token}`);
  return json({ ok: true });
}

// Deployer-only overview of issued subscriptions (P1): metadata only,
// never the stored config contents. Deliberately gated behind
// SUB_OWNER_KEY — without an owner key there is no safe way to tell the
// deployer from any visitor, so listing stays disabled (403) until the
// deployer sets one.
async function listSubscriptions(request, env) {
  const missing = subKvMissing(env); if (missing) return missing;
  if (!allowedSameOrigin(request)) return json({ message: "Origin 不被允许" }, 403);
  if (!env?.SUB_OWNER_KEY) {
    return json({ message: "查看全部订阅需要部署者先设置 SUB_OWNER_KEY（否则任何访客都能列出全部订阅链接）。设置方法见 README「公开部署保护」。" , code: "owner_key_not_set" }, 403);
  }
  if (!ownerKeyOk(request, env)) return ownerRequired();
  const listed = await env.SUB_KV.list({ prefix: "sub:", limit: 200 });
  const subscriptions = (listed.keys || []).map((k) => ({
    token: k.name.slice(4),
    tier: (k.metadata || {}).tier || "24h",
    filename: (k.metadata || {}).filename || "",
    expiresAt: k.expiration ? new Date(k.expiration * 1000).toISOString() : null
  }));
  subscriptions.sort((a, b) =>
    (a.tier === "perm" ? 0 : 1) - (b.tier === "perm" ? 0 : 1) ||
    String(a.expiresAt || "9999").localeCompare(String(b.expiresAt || "9999")));
  return json({ ok: true, subscriptions, truncated: listed.list_complete === false });
}

async function serveSubscription(request, env, token) {
  if (!env?.SUB_KV) return new Response("Subscription hosting is not enabled.", { status: 503 });
  if (!/^[a-f0-9]{48}$/.test(token)) return new Response("Not Found", { status: 404 });
  const got = await env.SUB_KV.getWithMetadata(`sub:${token}`);
  if (!got || !got.value) return new Response("Subscription not found or expired.", { status: 404 });
  const meta = got.metadata || {};
  const headers = {
    "Content-Type": meta.type || "text/plain; charset=UTF-8",
    "Content-Disposition": `inline; filename="${meta.filename || "subscription.txt"}"`,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  };
  if (meta.tier === "perm") headers["profile-update-interval"] = "24";
  return new Response(got.value, { status: 200, headers });
}

export default {
  async fetch(request, env, ctx) {
// 1. Session Gateway Authentication (Strict Zero-Hardcode Mode)
if (env.AUTH_PASS) {
  const __auth_url = new URL(request.url);
  const expectedToken = await getAuthToken(env.AUTH_PASS, env.AUTH_USER);
  const userToken = getSessionCookie(request);

  // 登录校验端点：完全严格匹配环境变量，代码中没有任何默认账号名
  if (__auth_url.pathname === "/api/sys/auth" && request.method === "POST") {
    try {
      const body = await request.json();
      if (body.username === env.AUTH_USER && body.password === env.AUTH_PASS) {
        return new Response(JSON.stringify({ success: true, message: "OK" }), {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Set-Cookie": "sys_auth_token=" + expectedToken + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000"
          }
        });
      }
      return new Response(JSON.stringify({ success: false, message: "账号或密钥校验失败，请核对后重试" }), {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, message: "无效的请求格式" }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
  }

  // 未登录拦截
  if (userToken !== expectedToken) {
    if (__auth_url.pathname.startsWith("/api/")) {
      return json({ message: "Authentication required", code: 401 }, 401);
    }
    return new Response(LOGIN_PAGE_HTML, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}

    const url = new URL(request.url);

    // Quick deployment test:
    // https://YOUR-PROJECT.pages.dev/api/health
    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "usque-register-relay",
        worker: "running"
      });
    }

    if (url.pathname === "/api/warp/register") {
      if (request.method !== "POST") {
        return json({ message: "Method Not Allowed" }, 405, { "Allow": "POST" });
      }
      return relayRegister(request);
    }

    if (url.pathname === "/api/warp/enroll") {
      if (request.method !== "POST") {
        return json({ message: "Method Not Allowed" }, 405, { "Allow": "POST" });
      }
      return relayEnroll(request);
    }

    if (url.pathname === "/api/sub") {
      if (request.method !== "POST") {
        return json({ message: "Method Not Allowed" }, 405, { "Allow": "POST" });
      }
      return createSubscription(request, env);
    }

    if (url.pathname === "/api/sub/list") {
      if (request.method !== "GET") {
        return json({ message: "Method Not Allowed" }, 405, { "Allow": "GET" });
      }
      return listSubscriptions(request, env);
    }

    if (url.pathname === "/api/sub/update" || url.pathname === "/api/sub/rotate" || url.pathname === "/api/sub/revoke") {
      if (request.method !== "POST") {
        return json({ message: "Method Not Allowed" }, 405, { "Allow": "POST" });
      }
      if (url.pathname.endsWith("update")) return updateSubscription(request, env);
      if (url.pathname.endsWith("rotate")) return rotateSubscription(request, env);
      return revokeSubscription(request, env);
    }

    if (url.pathname.startsWith("/sub/")) {
      if (request.method !== "GET") {
        return json({ message: "Method Not Allowed" }, 405, { "Allow": "GET" });
      }
      return serveSubscription(request, env, url.pathname.slice(5));
    }

    return env.ASSETS ? env.ASSETS.fetch(request) : json({ message: "API Not Found" }, 404);
  }
};