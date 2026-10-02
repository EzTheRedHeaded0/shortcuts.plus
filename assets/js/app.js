const DATA_URL = "./data/shortcuts.json";
const FAV_KEY = "sp-favs";
const THEME_KEY = "sp-theme";

const ICONS = {
  music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V6l12-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.4"/><path d="M21 16l-5.5-5.5L7 19"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3h8l5 5v13H7z"/><path d="M15 3v5h5M9 13h6M9 17h4"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>',
  scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3"/><path d="M7 12h10"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8z"/></svg>'
};

const CATEGORY_ICON = {
  featured: "spark",
  productivity: "calendar",
  utilities: "scan",
  wellness: "bell"
};

let catalog = {};
let activeCategory = "all";
let query = "";

const $ = (sel) => document.querySelector(sel);

function favs() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); }
  catch { return []; }
}
function isFav(id) { return favs().includes(id); }
function toggleFav(id) {
  const next = isFav(id) ? favs().filter((x) => x !== id) : [...favs(), id];
  localStorage.setItem(FAV_KEY, JSON.stringify(next));
  render();
}

function slug(item, category) {
  return `${category}:${(item.title || "").toLowerCase().replace(/\s+/g, "-")}`;
}

function flatten() {
  const out = [];
  Object.entries(catalog).forEach(([category, items]) => {
    (items || []).forEach((item, index) => {
      out.push({
        ...item,
        category,
        id: slug(item, category) + "-" + index
      });
    });
  });
  return out;
}

function filtered() {
  const q = query.trim().toLowerCase();
  return flatten().filter((item) => {
    const inCat =
      activeCategory === "all" ||
      (activeCategory === "saved" && isFav(item.id)) ||
      item.category === activeCategory;
    const hay = `${item.title} ${item.desc} ${item.badge} ${item.category}`.toLowerCase();
    return inCat && (!q || hay.includes(q));
  });
}

function iconFor(item) {
  return ICONS[item.icon] || ICONS[CATEGORY_ICON[item.category]] || ICONS.spark;
}

function cardHTML(item) {
  const saved = isFav(item.id);
  return `
    <article class="card">
      <div class="card-top">
        <div class="icon-bubble">${iconFor(item)}</div>
        <button class="fav ${saved ? "on" : ""}" data-fav="${item.id}" aria-label="${saved ? "Remove from saved" : "Save shortcut"}">
          ${saved ? "★" : "☆"}
        </button>
      </div>
      ${item.badge ? `<div class="badge">${item.badge}</div>` : `<div class="badge">${item.category}</div>`}
      <h3>${escapeHtml(item.title || "Untitled")}</h3>
      <p>${escapeHtml(item.desc || "")}</p>
      <div class="btns">
        <a class="btn primary" href="${escapeAttr(item.link || "#")}" target="_blank" rel="noopener">Get Shortcut</a>
        <button class="btn ghost" data-copy="${escapeAttr(item.link || "")}">Copy Link</button>
      </div>
    </article>`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function escapeAttr(s) {
  return escapeHtml(s).replaceAll("'", "&#39;");
}

function group(items) {
  const order = Object.keys(catalog);
  const map = {};
  items.forEach((item) => {
    (map[item.category] ||= []).push(item);
  });
  return order
    .filter((key) => map[key]?.length)
    .map((key) => ({ key, items: map[key] }));
}

function pretty(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function renderChips() {
  const cats = ["all", ...Object.keys(catalog), "saved"];
  $("#chips").innerHTML = cats
    .map((cat) => {
      const label = cat === "all" ? "All" : cat === "saved" ? "Saved" : pretty(cat);
      return `<button class="chip ${cat === activeCategory ? "active" : ""}" data-cat="${cat}">${label}</button>`;
    })
    .join("");
}

function render() {
  const items = filtered();
  $("#count").textContent = `${items.length} shortcut${items.length === 1 ? "" : "s"}`;
  renderChips();

  const app = $("#app");
  if (!items.length) {
    app.innerHTML = `<div class="empty">No shortcuts match that search. Try another word, or switch categories.</div>`;
    return;
  }

  if (activeCategory === "saved" || activeCategory !== "all" && catalog[activeCategory]) {
    app.innerHTML = `<div class="grid">${items.map(cardHTML).join("")}</div>`;
  } else {
    app.innerHTML = group(items)
      .map(
        ({ key, items: list }) => `
        <section id="${key}">
          <div class="section-head">
            <h2>${pretty(key)}</h2>
            <div class="meta">${list.length}</div>
          </div>
          <div class="grid">${list.map(cardHTML).join("")}</div>
        </section>`
      )
      .join("");
  }
}

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 1800);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Link copied");
  } catch {
    toast("Could not copy");
  }
}

function applyTheme(mode) {
  document.body.classList.toggle("light", mode === "light");
  localStorage.setItem(THEME_KEY, mode);
  $("#theme-btn").innerHTML = mode === "light" ? moon() : sun();
}
function sun() {
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
}
function moon() {
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/></svg>';
}

async function loadData() {
  const tryUrls = [DATA_URL, "./data/shortcuts.json", "./shortcuts.json"];
  let lastError;
  for (const url of tryUrls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      const json = await res.json();
      if (json && typeof json === "object") return json;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Could not load shortcuts");
}

function bind() {
  $("#search").addEventListener("input", (e) => {
    query = e.target.value;
    render();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
      e.preventDefault();
      $("#search").focus();
    }
  });
  $("#chips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    render();
  });
  $("#app").addEventListener("click", (e) => {
    const favBtn = e.target.closest("[data-fav]");
    if (favBtn) toggleFav(favBtn.dataset.fav);
    const copyBtn = e.target.closest("[data-copy]");
    if (copyBtn) copyText(copyBtn.dataset.copy);
  });
  $("#theme-btn").addEventListener("click", () => {
    applyTheme(document.body.classList.contains("light") ? "dark" : "light");
  });
  $("#menu-btn").addEventListener("click", () => {
    $("#nav-links").classList.toggle("open");
  });
}

async function init() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(savedTheme || "dark");
  bind();
  try {
    catalog = await loadData();
    render();
  } catch (err) {
    console.error(err);
    $("#app").innerHTML = `<div class="empty">Could not load the shortcut library. Check that data/shortcuts.json is deployed.</div>`;
  }
}

init();
