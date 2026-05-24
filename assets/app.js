async function loadData() {
  const paths = CONFIG.useLiveData ? CONFIG.sheets : {
    skus: "data/skus.csv",
    transactions: "data/transactions.csv",
    warehouses: "data/warehouses.csv",
    audits: "data/audits.csv",
    bom: "data/bom.csv"
  };

  try {
    const [skus, transactions, warehouses, audits, bom] = await Promise.all([
      fetchCsv(paths.skus),
      fetchCsv(paths.transactions),
      fetchCsv(paths.warehouses),
      fetchCsv(paths.audits),
      fetchCsv(paths.bom)
    ]);
    return { skus, transactions, warehouses, audits, bom };
  } catch (err) {
    showError("資料載入失敗：" + err.message);
    return { skus: [], transactions: [], warehouses: [], audits: [], bom: [] };
  }
}

async function fetchCsv(url) {
  if (!url) return [];
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status + " 於 " + url);
  const text = await res.text();
  return parseCsv(text);
}

function parseCsv(text) {
  const lines = text.replace(/﻿/g, "").trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map(line => {
    if (!line.trim()) return null;
    const cells = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => row[h] = (cells[i] || "").trim());
    return row;
  }).filter(Boolean);
}

function splitCsvLine(line) {
  const cells = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      cells.push(cur); cur = "";
    } else {
      cur += c;
    }
  }
  cells.push(cur);
  return cells;
}

function computeStock(data) {
  const stock = {};
  data.skus.forEach(s => {
    stock[s.SKU] = {};
    data.warehouses.forEach(w => { stock[s.SKU][w["代碼"]] = 0; });
  });

  data.transactions.forEach(t => {
    const qty = Number(t["數量"]) || 0;
    if (!stock[t.SKU]) return;
    if (t["目的倉"] && stock[t.SKU][t["目的倉"]] !== undefined) {
      stock[t.SKU][t["目的倉"]] += qty;
    }
    if (t["來源倉"] && stock[t.SKU][t["來源倉"]] !== undefined) {
      stock[t.SKU][t["來源倉"]] -= qty;
    }
  });

  return stock;
}

function totalStock(stockMap, sku) {
  if (!stockMap[sku]) return 0;
  return Object.values(stockMap[sku]).reduce((a, b) => a + b, 0);
}

function stockStatus(current, safety) {
  safety = Number(safety) || 0;
  if (safety === 0) return { level: "neutral", label: "無門檻", pill: "pill-neutral" };
  if (current < safety) return { level: "danger", label: "低於安全庫存", pill: "pill-danger" };
  if (current < safety * 1.2) return { level: "warn", label: "接近下限", pill: "pill-warn" };
  return { level: "ok", label: "正常", pill: "pill-ok" };
}

function nextCamp(today) {
  today = today || new Date();
  const future = (CONFIG.camps || [])
    .map(c => Object.assign({}, c, { dateObj: new Date(c.date) }))
    .filter(c => c.dateObj >= today)
    .sort((a, b) => a.dateObj - b.dateObj);
  return future[0] || null;
}

function daysBetween(from, to) {
  return Math.ceil((to - from) / (1000 * 60 * 60 * 24));
}

function lastMovedDate(data, sku) {
  const txs = data.transactions.filter(t => t.SKU === sku);
  if (txs.length === 0) return null;
  return txs
    .map(t => new Date(t["日期"]))
    .filter(d => !isNaN(d))
    .sort((a, b) => b - a)[0] || null;
}

function monthsSince(date) {
  if (!date) return Infinity;
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

function fmtNum(n) {
  const num = Number(n);
  if (isNaN(num)) return "—";
  return num.toLocaleString("en-US");
}

function fmtDate(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date)) return String(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function renderNav(active) {
  const links = [
    { href: "index.html", key: "dashboard", label: "儀表板" },
    { href: "items.html", key: "items", label: "品項清單" },
    { href: "calculator.html", key: "calculator", label: "組裝試算" },
    { href: "stale.html", key: "stale", label: "呆滯品" },
    { href: "manuals.html", key: "manuals", label: "作業文件" }
  ];
  const linksHtml = links.map(l =>
    '<a class="nav-link ' + (l.key === active ? "active" : "") + '" href="' + l.href + '">' + l.label + "</a>"
  ).join("");
  const navEl = document.getElementById("nav-container");
  if (!navEl) return;
  const source = CONFIG.useLiveData ? "即時資料" : "示範資料";

  let bannerHtml = "";
  if (CONFIG.demoMode) {
    bannerHtml =
      '<div class="demo-banner">' +
        '<span class="demo-banner-icon">📍</span>' +
        '<strong>示範環境</strong>' +
        '<span class="demo-banner-sep">·</span>' +
        '<span>資料為虛擬範例，僅供功能體驗，<strong>非公司真實庫存</strong></span>' +
      '</div>';
  }

  navEl.innerHTML =
    bannerHtml +
    '<nav class="nav">' +
      '<div class="nav-brand">教材庫存管理' + (CONFIG.demoMode ? " · DEMO" : "") + '</div>' +
      '<div class="nav-links">' + linksHtml + "</div>" +
      '<div class="updated">' + source + " · " + new Date().toLocaleString("zh-TW", { hour12: false }) + "</div>" +
    "</nav>";
}

function getSku(data, sku) {
  return data.skus.find(s => s.SKU === sku);
}

function getWarehouse(data, code) {
  return data.warehouses.find(w => w["代碼"] === code);
}

function showError(msg) {
  const main = document.getElementById("main") || document.body;
  const div = document.createElement("div");
  div.className = "error";
  div.textContent = msg;
  main.prepend(div);
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function typeSkuClass(t) {
  return { "成品": "finished", "元件": "component", "通用材料": "raw", "原料": "raw", "半成品": "wip" }[t] || "";
}
function pillSkuType(t) {
  const cls = typeSkuClass(t);
  return t ? '<span class="pill ' + (cls ? "pill-sku-" + cls : "pill-neutral") + '">' + escapeHtml(t) + "</span>" : "";
}
function gradeClass(g) {
  return { "國小": "elementary", "國中": "junior" }[g] || "";
}
function purposeClass(p) {
  return {
    "探索包": "explore",
    "小專題": "project",
    "思考課": "thinking",
    "題本書籍": "book",
    "行銷文宣": "marketing",
    "文創禮品": "gift",
    "行政文具": "admin",
    "教具材料": "teach",
    "課程行政": "admin",
    "其它": "other"
  }[p] || "";
}
function typeClass(t) {
  return { "入庫": "in", "出庫": "out", "調撥": "move", "盤點調整": "adjust" }[t] || "";
}
function pillGrade(grade) {
  const cls = gradeClass(grade);
  return grade ? '<span class="pill ' + (cls ? "pill-grade-" + cls : "pill-neutral") + '">' + escapeHtml(grade) + "</span>" : "";
}
function pillPurpose(purpose) {
  const cls = purposeClass(purpose);
  return purpose ? '<span class="pill ' + (cls ? "pill-purpose-" + cls : "pill-neutral") + '">' + escapeHtml(purpose) + "</span>" : "";
}
function pillType(type) {
  const cls = typeClass(type);
  return type ? '<span class="pill ' + (cls ? "pill-type-" + cls : "pill-neutral") + '">' + escapeHtml(type) + "</span>" : "";
}
function whDot(code) {
  return code ? '<span class="wh-dot wh-dot-' + escapeHtml(code) + '"></span>' : "";
}
