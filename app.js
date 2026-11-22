(() => {
"use strict";
const COLS = 25, ROWS = 16, CELLS = COLS * ROWS;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const UI = {
  ru: {
    raised: "Собрано", of: "из", supporters: "Поддержали", buckets: "Квадратики", day: "День эксперимента",
    soonDay: "", since: d => `с ${d}`, people: "человек", toBucket: "до следующего квадратика", toMilestone: "до следующей вехи",
    kofi: "Поддержать на Ko-fi", stripe: "Картой через Stripe", soon: "Оплата скоро заработает",
    ctaNote: "Любая сумма, хоть €1. Ko-fi принимает карты, Apple Pay, Google Pay и PayPal.",
    top: "Топ поддержки", recent: "Последние", anon: "Аноним", lead: "Главный спонсор рендера",
    emptyTop: "Пока здесь пусто. Стань первым в топе.",
    beat: m => `Чтобы обойти №1, нужно больше ${m} за всё время.`,
    topNote: "Имя берётся из Ko-fi. Не хотите светиться — отметьте поддержку как приватную. Место в топе — это благодарность, без призов. Донатьте только то, что не жалко: каждый евро двигает рендер одинаково.",
    bucketsOf: (x, f) => { const w = { one: "квадратик", few: "квадратика", many: "квадратиков" }[new Intl.PluralRules("ru-RU").select(x)] || "квадратика"; return `≈ ${f} ${w}`; },
    milestones: "Вехи", about: "Зачем это всё", updates: "Лента обновлений", faq: "Вопросы", follow: "Мои социальные сети",
    noUpdates: "Обновления появятся здесь.", watch: "смотреть выпуск",
    rendering: (p, b) => `Рендерю… ${p} · ${b} / ${CELLS}`, finished: "Рендер завершён", perBucket: b => `1 квадратик = ${b}`,
    bucketsLeft: n => `осталось ${n}`, dayN: n => `День ${n}`,
    faqItems: c => [
      ["Куда пойдут деньги?", [c.fundsUse, c.goalMeaning, c.city && "Город: " + c.city].filter(Boolean).join(" ")],
      ["Что будет, если цель не наберётся?", c.ifNotReached],
      ["Это инвестиция? Я что-то получу взамен?", "Нет. Это добровольная поддержка. Я ничего не обещаю взамен: ни долю в квартире, ни возврат денег."],
      ["Какие комиссии?", "Ko-fi не берёт комиссию с разовой поддержки. Платёжная система (Stripe или PayPal) удерживает свою, обычно несколько процентов. В ленте указана сумма до комиссий."],
      ["Как проверить, что цифры настоящие?", c.proof],
      ["Почему квадратики?", `Так считают картинку рендеры вроде V-Ray: по кусочкам, бакетами. Здесь каждый бакет оплачивают люди, а не видеокарта. Один квадратик = {bucket}.`]
    ],
    links: { tiktok: "TikTok", telegram: "Telegram", youtube: "YouTube", instagram: "Instagram", gumroad: "Купить мои 3D-ассеты" },
    foot: a => `${a}. Это добровольная поддержка, а не инвестиция и не покупка. Цифры обновляются вручную после каждого выпуска.`
  },
  en: {
    raised: "Raised", of: "of", supporters: "Supporters", buckets: "Buckets", day: "Experiment day",
    soonDay: "", since: d => `since ${d}`, people: "people", toBucket: "to the next bucket", toMilestone: "to the next milestone",
    kofi: "Support on Ko-fi", stripe: "Pay by card with Stripe", soon: "Payments open soon",
    ctaNote: "Any amount, even €1. Ko-fi takes cards, Apple Pay, Google Pay and PayPal.",
    top: "Top supporters", recent: "Latest", anon: "Anonymous", lead: "Lead render sponsor",
    emptyTop: "Nobody here yet. Be the first in the top.",
    beat: m => `To pass #1, give more than ${m} in total.`,
    topNote: "Names come from Ko-fi. Prefer to stay anonymous? Mark your support as private. A spot in the top is a thank-you only, no prizes. Give only what you can spare: every euro moves the render the same.",
    bucketsOf: (x, f) => `≈ ${f} ${x === 1 ? "bucket" : "buckets"}`,
    milestones: "Milestones", about: "Why this exists", updates: "Update log", faq: "Questions", follow: "My social media",
    noUpdates: "Updates will appear here.", watch: "watch the episode",
    rendering: (p, b) => `Rendering… ${p} · ${b} / ${CELLS}`, finished: "Render complete", perBucket: b => `1 bucket = ${b}`,
    bucketsLeft: n => `${n} left`, dayN: n => `Day ${n}`,
    faqItems: c => [
      ["Where does the money go?", [c.fundsUse, c.goalMeaning, c.city && "City: " + c.city].filter(Boolean).join(" ")],
      ["What if the goal isn't reached?", c.ifNotReached],
      ["Is this an investment? Do I get anything back?", "No. This is voluntary support. I promise nothing in return: no share of the apartment and no refunds."],
      ["What are the fees?", "Ko-fi takes no fee on one-off support. The payment processor (Stripe or PayPal) keeps its own, usually a few percent. The log shows amounts before fees."],
      ["How can I check the numbers are real?", c.proof],
      ["Why buckets?", `That's how renderers like V-Ray compute an image: piece by piece, in buckets. Here people pay for each bucket instead of a graphics card. One bucket = {bucket}.`]
    ],
    links: { tiktok: "TikTok", telegram: "Telegram", youtube: "YouTube", instagram: "Instagram", gumroad: "Buy my 3D assets" },
    foot: a => `${a}. This is voluntary support, not an investment or a purchase. Numbers are updated by hand after each episode.`
  }
};

const st = { lang: "ru", c: null, updates: [], shown: 0, anim: 0 };
try { st.lang = localStorage.getItem("lang") || ""; } catch {}
if (!UI[st.lang]) st.lang = /^(ru|uk|be|kk)/i.test(navigator.language || "") ? "ru" : "en";

const money = n => new Intl.NumberFormat(st.lang === "ru" ? "ru-RU" : "en-IE", { style: "currency", currency: st.c?.currency || "EUR", maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0));
const int = n => new Intl.NumberFormat(st.lang === "ru" ? "ru-RU" : "en-IE").format(n);
const dateFmt = iso => new Date(iso + "T12:00:00").toLocaleDateString(st.lang === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "short" });
const goal = () => Math.max(CELLS, Number(st.c?.goal) || 100000);
const bucketValue = () => goal() / CELLS;
const latest = () => st.updates[st.updates.length - 1] || null;
const raised = () => Number(latest()?.raised) || 0;
function today() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
function dayOf(iso) { const L = st.c?.launchDate; if (!L) return null; return Math.floor((Date.parse(iso) - Date.parse(L)) / 86400000) + 1; }

function spiralOrder(cols, rows) {
  const out = []; let x = Math.floor((cols - 1) / 2), y = Math.floor((rows - 1) / 2), d = 0, len = 1;
  const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const push = () => { if (x >= 0 && x < cols && y >= 0 && y < rows) out.push(y * cols + x); };
  push();
  while (out.length < cols * rows) {
    for (let k = 0; k < 2; k++) { for (let i = 0; i < len; i++) { x += dirs[d][0]; y += dirs[d][1]; push(); } d = (d + 1) % 4; }
    len++;
  }
  return out;
}
const SPIRAL = spiralOrder(COLS, ROWS);

/* ---------- frame buffer ---------- */
function paint(count) {
  const cv = $("#buf"), img = $("#clay"), r = cv.getBoundingClientRect();
  if (!r.width) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const ctx = cv.getContext("2d"); ctx.clearRect(0, 0, W, H);
  const cw = W / COLS, ch = H / ROWS;
  const ok = img.complete && img.naturalWidth > 0;
  let s = 1, sx0 = 0, sy0 = 0;
  if (ok) { s = Math.max(W / img.naturalWidth, H / img.naturalHeight); sx0 = (img.naturalWidth - W / s) / 2; sy0 = (img.naturalHeight - H / s) / 2; }
  for (let k = 0; k < count; k++) {
    const c = SPIRAL[k], cx = c % COLS, cy = Math.floor(c / COLS), dx = cx * cw, dy = cy * ch;
    if (ok) ctx.drawImage(img, sx0 + dx / s, sy0 + dy / s, cw / s, ch / s, dx, dy, cw, ch);
    else { ctx.fillStyle = "rgba(243,217,177,.75)"; ctx.fillRect(dx, dy, cw, ch); }
  }
  ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < COLS; i++) { const x = Math.round(i * cw) + .5; ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let j = 1; j < ROWS; j++) { const y = Math.round(j * ch) + .5; ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
}
function renderBuffer(animate) {
  const full = Math.min(CELLS, Math.floor(raised() / bucketValue()));
  const part = full < CELLS ? (raised() % bucketValue()) / bucketValue() : 0;
  const b = $("#bucket");
  if (full < CELLS) {
    const c = SPIRAL[full]; b.style.left = (c % COLS) * (100 / COLS) + "%"; b.style.top = Math.floor(c / COLS) * (100 / ROWS) + "%";
    $("#bucket-fill").style.height = (part * 100).toFixed(1) + "%"; b.hidden = false;
  } else b.hidden = true;
  cancelAnimationFrame(st.anim);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!animate || reduce || full === 0) { st.shown = full; paint(full); return; }
  const dur = Math.min(1600, 300 + full * 18), t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / dur); st.shown = Math.round(full * (1 - Math.pow(1 - k, 2))); paint(st.shown); if (k < 1) st.anim = requestAnimationFrame(step); };
  st.anim = requestAnimationFrame(step);
}

/* ---------- text ---------- */
function render(animate) {
  const t = UI[st.lang], c = st.c.text[st.lang] || st.c.text.ru, L = latest();
  const R = raised(), G = goal(), pct = R / G * 100, full = Math.min(CELLS, Math.floor(R / bucketValue()));
  const toBucket = bucketValue() - (R % bucketValue());
  const pctTxt = pct.toLocaleString(st.lang === "ru" ? "ru-RU" : "en-GB", { maximumFractionDigits: pct < 10 ? 2 : 1 }) + "%";
  const fill = s => String(s || "").replace("{bucket}", money(bucketValue())).replace("{cells}", CELLS);

  document.documentElement.lang = st.lang;
  document.title = c.project;
  $("#lang").textContent = st.lang === "ru" ? "EN" : "RU";
  document.querySelectorAll("[data-c]").forEach(el => { el.textContent = c[el.dataset.c] || ""; });
  document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t[el.dataset.t] || ""; });
  $("#lead").textContent = fill(c.lead);

  $("#vfb-res").textContent = `2500 × 1600 · ${t.perBucket(money(bucketValue()))}`;
  $("#vfb-status").textContent = full >= CELLS ? t.finished : t.rendering(pctTxt, full);
  $("#vfb-next").textContent = full >= CELLS ? "" : `${money(toBucket)} ${t.toBucket}`;

  const day = dayOf(today());
  $("#nums").innerHTML = `
    <div class="num big"><span>${esc(t.raised)}</span><b>${esc(money(R))} <small>${esc(t.of)} ${esc(money(G))}</small></b><div class="meter"><i style="width:${Math.min(100, pct).toFixed(2)}%"></i></div><small>${esc(pctTxt)}</small></div>
    <div class="num"><span>${esc(t.supporters)}</span><b>${L && L.supporters != null ? int(L.supporters) : "0"}</b><small>${esc(t.people)}</small></div>
    <div class="num"><span>${esc(t.buckets)}</span><b>${full}</b><small>${esc(t.bucketsLeft(CELLS - full))}</small></div>
    <div class="num"><span>${esc(t.day)}</span><b>${day != null && day >= 1 ? day : "—"}</b><small>${day != null && day >= 1 ? esc(t.since(dateFmt(st.c.launchDate))) : esc(t.soonDay)}</small></div>
    <div class="num"><span>${esc(t.toMilestone)}</span><b>${esc(money(Math.max(0, nextMilestone() - R)))}</b><small>${esc(money(nextMilestone()))}</small></div>`;

  const k = $("#kofi"), lk = st.c.links || {};
  if (lk.kofi) { k.href = lk.kofi; k.textContent = t.kofi; k.removeAttribute("aria-disabled"); }
  else { k.removeAttribute("href"); k.textContent = t.soon; k.setAttribute("aria-disabled", "true"); }
  const sb = $("#stripe"); sb.hidden = !lk.stripe; if (lk.stripe) { sb.href = lk.stripe; sb.textContent = t.stripe; }
  $("#cta-note").textContent = t.ctaNote;

  const ms = msList();
  let nextSet = false;
  $("#ladder").innerHTML = ms.map(([v, name]) => {
    let cls = ""; if (R >= v) cls = "done"; else if (!nextSet) { cls = "next"; nextSet = true; }
    return `<li class="${cls}"><b>${esc(money(v))}</b><span>${esc(name)}</span></li>`;
  }).join("");

  const D = st.donors || { top: [], recent: [] };
  const bucketsTxt = total => {
    const x = total / bucketValue(), r = x >= 10 ? Math.round(x) : Math.round(x * 10) / 10;
    if (r <= 0) return "";
    return t.bucketsOf(r, r.toLocaleString(st.lang === "ru" ? "ru-RU" : "en-GB"));
  };
  $("#top").innerHTML = D.top.length ? D.top.map((p, i) => `<li class="${i === 0 ? "first" : ""}">
      <span class="rk">${String(i + 1).padStart(2, "0")}</span>
      <span class="nm">${esc(p.name)}<small>${esc([i === 0 ? t.lead : "", bucketsTxt(p.total)].filter(Boolean).join(" · "))}</small></span>
      <span class="am">${esc(money(p.total))}</span></li>`).join("")
    : `<li class="empty">${esc(t.emptyTop)}</li>`;
  $("#recent").innerHTML = (D.recent || []).map(r => `<li><span>${esc(r.name || t.anon)}</span><span>${esc(money(r.amount))}</span></li>`).join("")
    || `<li><span class="small">—</span><span></span></li>`;
  $("#top-note").textContent = (D.top.length ? t.beat(money(D.top[0].total)) + " " : "") + t.topNote;

  $("#about").innerHTML = (c.about || []).map(p => `<p>${esc(fill(p))}</p>`).join("");

  if (!st.updates.length) $("#log").innerHTML = `<li><span class="empty">${esc(t.noUpdates)}</span></li>`;
  else $("#log").innerHTML = st.updates.map((u, i) => {
    const prev = i ? Number(st.updates[i - 1].raised) || 0 : 0, d = (Number(u.raised) || 0) - prev;
    const dn = dayOf(u.date) ?? (i + 1);
    const note = (u.note && (u.note[st.lang] || u.note.ru || u.note.en)) || "";
    return `<li><span class="d">${esc(t.dayN(dn))}<small>${esc(dateFmt(u.date))}</small></span>
      <span class="r">${esc(money(u.raised))}${d > 0 ? `<small>+${esc(money(d))}</small>` : ""}</span>
      <span class="n">${esc(note)}${u.video ? ` <a href="${esc(u.video)}" target="_blank" rel="noopener">${esc(t.watch)}</a>` : ""}</span></li>`;
  }).reverse().join("");

  $("#faq").innerHTML = t.faqItems(c).filter(([, a]) => a).map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(fill(a))}</p></details>`).join("");

  const tiktok = lk.tiktok ? (lk.tiktok.startsWith("http") ? lk.tiktok : "https://www.tiktok.com/@" + lk.tiktok.replace(/^@/, "")) : "";
  const links = { tiktok, telegram: lk.telegram, youtube: lk.youtube, instagram: lk.instagram, gumroad: lk.gumroad };
  $("#links").innerHTML = Object.entries(links).filter(([, u]) => u).map(([k2, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t.links[k2])}</a>`).join("");
  $("#foot").textContent = t.foot(st.c.author || "");

  renderBuffer(animate);
}
function msList() { const names = (st.c.text[st.lang] || st.c.text.ru).milestones || []; return [0.01, 0.05, 0.10, 0.25, 0.5, 1].map((f, i) => [goal() * f, names[i] || ""]); }
function nextMilestone() { const n = msList().map(([v]) => v).find(v => v > raised()); return n ?? goal(); }

$("#lang").addEventListener("click", () => {
  st.lang = st.lang === "ru" ? "en" : "ru";
  try { localStorage.setItem("lang", st.lang); } catch {}
  render(false);
});
let rz = 0;
window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => paint(st.shown), 120); });
$("#clay").addEventListener("load", () => paint(st.shown));

Promise.all([
  fetch("data/campaign.json", { cache: "no-store" }).then(r => r.json()),
  fetch("data/updates.json", { cache: "no-store" }).then(r => r.json()),
  fetch("data/donors.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null)
]).then(([c, u, d]) => {
  st.c = c;
  st.donors = { top: Array.isArray(d?.top) ? d.top : [], recent: Array.isArray(d?.recent) ? d.recent : [] };
  st.updates = (Array.isArray(u) ? u : []).filter(x => x && x.date).sort((a, b) => a.date.localeCompare(b.date));
  if (c.render) $("#clay").src = c.render;
  render(true);
}).catch(err => {
  console.error(err);
  $("#lead").textContent = "Не удалось загрузить данные. Обнови страницу. / Could not load data, please refresh.";
});
})();
