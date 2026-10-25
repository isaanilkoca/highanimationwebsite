import { animate, scroll, inView, stagger } from "motion";
import "./style.css";
import { artSVG } from "./art.js";
import { Halftone, loadSVG, svgSource, textSource } from "./halftone.js";
import { categories, products, chapters, cities, buyers, tl } from "./data.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const byId = (id) => products.find((p) => p.id === Number(id));

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduced) document.documentElement.classList.add("anim");

// Reduced motion: every Motion call resolves instantly to its final state.
const A = (t, kf, o = {}) => animate(t, kf, reduced ? { duration: 0 } : o);
const EASE = [0.22, 1, 0.36, 1];
const SNAP = [0.76, 0, 0.24, 1];

const small = () => innerWidth < 700;
const gapFor = (n) => (small() ? n - 1 : n);

/* ------------------------------------------------------------------ yardımcılar */

// Metni kelime maskelerine böler (<em> gibi iç elemanlar korunur); kayan iç span'leri döndürür.
function splitWords(el) {
  const inners = [];
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) return frag.append(tok);
          const w = document.createElement("span");
          w.className = "w clip";
          const i = document.createElement("span");
          i.className = "wi";
          i.textContent = tok;
          w.append(i);
          inners.push(i);
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  const label = el.textContent;
  walk(el);
  el.setAttribute("aria-label", label);
  $$(".w", el).forEach((w) => w.setAttribute("aria-hidden", "true"));
  return inners;
}

function tween(el, from, to, fmt = (v) => Math.round(v), duration = 1) {
  A(from, to, { duration, ease: "easeOut", onUpdate: (v) => (el.textContent = fmt(v)) });
}

/* ------------------------------------------------------------------ kurulum */

$$("[data-lines]").forEach((el) => {
  el._w = splitWords(el);
  if (!reduced) A(el._w, { y: "115%" }, { duration: 0 });
});
$$("[data-lines]:not(.hero-title)").forEach((el) => {
  inView(el, () => { A(el._w, { y: ["115%", "0%"] }, { duration: 1.1, delay: stagger(0.07), ease: EASE }); }, { amount: 0.6 });
});

// Şerit
const tickerWords = ["Zeytinyağı", "Zeytin", "Avokado", "Limon", "Soğuk sıkım", "Bahçeden kapına"];
$("#ticker").innerHTML = tickerWords.map((w) => `<span>${w}</span>`).join("").repeat(4);

(() => {
  if (reduced) return;
  const track = $("#ticker");
  let x = 0, half = 0, lastY = scrollY;
  const measure = () => (half = track.scrollWidth / 2);
  measure();
  addEventListener("resize", measure);
  document.fonts?.ready.then(measure);
  const tick = () => {
    const dy = Math.abs(scrollY - lastY);
    lastY = scrollY;
    x -= 0.6 + dy * 0.2;
    if (half && x <= -half) x += half;
    track.style.transform = `translate3d(${x}px,0,0)`;
    requestAnimationFrame(tick);
  };
  tick();
})();

// Nav
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("solid", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true });
onScroll();
if (!reduced) scroll(animate(".progress", { scaleX: [0, 1] }, { ease: "linear" }));

/* ------------------------------------------------------------------ hero */

const heroField = new Halftone($("#hero-canvas"), {
  gap: gapFor(6), radius: small() ? 70 : 110, strength: 2.8, reduced, zone: $(".hero-stage"),
});

async function heroIntro() {
  A(nav, { opacity: [0, 1], y: [-16, 0] }, { duration: 0.9, ease: EASE });
  const title = $(".hero-title");
  A(title._w, { y: ["115%", "0%"] }, { duration: 1.2, delay: stagger(0.08, { startDelay: 0.05 }), ease: EASE });
  A("[data-hero]", { opacity: [0, 1], y: [18, 0] }, { duration: 1, delay: stagger(0.1, { startDelay: 0.5 }), ease: EASE });
  const img = await loadSVG(artSVG("avocado"));
  heroField.setSource(svgSource(img, 0.04), { assemble: true });

  if (reduced) return;
  const hero = $("#hero");
  // Kaydırdıkça nokta alanı dağılır.
  scroll((p) => heroField.setDisperse(p * 1.25), { target: hero, offset: ["start start", "end start"] });
  scroll(animate(".hero-copy", { y: [0, 60], opacity: [1, 0.15] }, { ease: "linear" }), { target: hero, offset: ["start start", "end start"] });
}

/* ------------------------------------------------------------------ koleksiyon */

(() => {
  const section = $("#lezzetler");
  const canvas = $("#col-canvas");
  const list = $("#col-list");
  const detail = $("#col-detail");
  const indexEl = $("#col-index");
  const field = new Halftone(canvas, { gap: gapFor(6), radius: small() ? 70 : 100, strength: 2.6, reduced, zone: $(".col-stage") });

  list.innerHTML = chapters.map((c, i) => `<li><button type="button" data-i="${i}"><small>0${i + 1}</small>${c.name}</button></li>`).join("");
  detail.innerHTML = chapters.map((c) => `<div class="cd"><p class="k">${c.kicker}</p><h3>${c.title}</h3><p>${c.text}</p></div>`).join("");
  const items = $$("li", list), cds = $$(".cd", detail);
  A(cds, { opacity: 0 }, { duration: 0 });

  const sources = Promise.all(chapters.map((c) => loadSVG(artSVG(c.art, c.v)).then((img) => svgSource(img, 0.06))));
  let cur = -1, started = false, last = 0;

  async function show(i, first) {
    const prev = cur;
    cur = i;
    items.forEach((li, j) => li.classList.toggle("on", j === i));
    indexEl.textContent = `0${i + 1} / 0${chapters.length}`;
    const src = (await sources)[i];
    field.setSource(src, { morph: !first, assemble: first });
    cds.forEach((el, j) => {
      if (j === i) A([el, ...$$("p, h3", el)], { opacity: 1 }, { duration: 0 }), A($$("p, h3", el), { opacity: [0, 1], y: [24, 0] }, { duration: 0.9, delay: stagger(0.08, { startDelay: 0.2 }), ease: EASE });
      else if (j === prev) A($$("p, h3", el), { opacity: 0, y: -14 }, { duration: 0.35, ease: "easeIn" });
    });
  }

  const update = (p) => {
    last = p;
    if (!started) return;
    const i = Math.min(chapters.length - 1, Math.floor(p * chapters.length));
    if (i !== cur) show(i, cur < 0);
  };
  scroll(update, { target: section, offset: ["start start", "end end"] });
  inView(section, () => { started = true; update(last); }, { amount: 0.1 });

  list.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const i = Number(b.dataset.i);
    const range = section.offsetHeight - innerHeight;
    scrollTo({ top: section.offsetTop + ((i + 0.5) / chapters.length) * range, behavior: reduced ? "auto" : "smooth" });
  });
})();

/* ------------------------------------------------------------------ dükkân */

const cart = new Map();

(() => {
  const tabs = $("#tabs"), ind = $("#tab-ind"), cardsEl = $("#cards");
  tabs.insertAdjacentHTML("afterbegin", categories.map((c, i) => `<button class="tab" role="tab" aria-selected="${i === 0}" data-cat="${c.id}">${c.label}</button>`).join(""));
  const tabEls = $$(".tab", tabs);
  const moveInd = (el, instant) => A(ind, { x: el.offsetLeft, width: el.offsetWidth }, instant ? { duration: 0 } : { duration: 0.6, ease: EASE });
  moveInd(tabEls[0], true);
  document.fonts?.ready.then(() => moveInd($('.tab[aria-selected="true"]', tabs), true));
  addEventListener("resize", () => moveInd($('.tab[aria-selected="true"]', tabs), true));

  cardsEl.innerHTML = products.map((p, i) => `
    <article class="card" data-id="${p.id}" data-cat="${p.cat}">
      <div class="card-stage">
        <canvas aria-hidden="true"></canvas>
        ${p.tag ? `<span class="tag">${p.tag}</span>` : ""}<span class="idx">0${i + 1}</span>
      </div>
      <div class="card-info">
        <div><h3>${p.name}</h3><small>${p.size}</small></div>
        <div class="card-buy"><span class="price">${tl(p.price)}</span><button class="add" data-add="${p.id}">Sepete ekle +</button></div>
      </div>
    </article>`).join("");
  const cards = $$(".card", cardsEl);

  // Her kart görününce kendi nokta alanını kurar.
  cards.forEach((card, idx) => {
    inView(card, async () => {
      if (card._ht) return;
      const p = byId(card.dataset.id);
      card._ht = new Halftone($("canvas", card), { gap: gapFor(5), radius: 70, strength: 2.4, reduced, zone: card });
      A(card, { opacity: [0, 1], y: [40, 0] }, { duration: 1, delay: (idx % 4) * 0.08, ease: EASE });
      const img = await loadSVG(artSVG(p.art, p.v));
      setTimeout(() => card._ht.setSource(svgSource(img, 0.12), { assemble: true }), reduced ? 0 : 150 + (idx % 4) * 90);
    }, { amount: 0.25 });
  });

  tabs.addEventListener("click", async (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;
    tabEls.forEach((t) => t.setAttribute("aria-selected", t === tab));
    moveInd(tab);
    const cat = tab.dataset.cat;
    const visible = cards.filter((c) => !c.classList.contains("hide"));
    await A(visible, { opacity: 0, y: 14 }, { duration: 0.25, delay: stagger(0.02), ease: "easeIn" }).finished;
    cards.forEach((c) => c.classList.toggle("hide", cat !== "all" && c.dataset.cat !== cat));
    A(cards.filter((c) => !c.classList.contains("hide")), { opacity: [0, 1], y: [30, 0] }, { duration: 0.8, delay: stagger(0.07), ease: EASE });
  });
})();

/* ------------------------------------------------------------------ sepet */

const cartBtn = $("#cart-btn"), cartCount = $("#cart-count"), drawer = $("#drawer"), overlay = $("#overlay");
const linesEl = $("#lines"), totalEl = $("#total");
let shownTotal = 0, drawerOpen = false;

const cartTotal = () => [...cart].reduce((s, [id, q]) => s + byId(id).price * q, 0);
const cartQty = () => [...cart.values()].reduce((a, b) => a + b, 0);

function renderCart(animateIn = false) {
  cartCount.textContent = cartQty();
  if (!cart.size) linesEl.innerHTML = `<li class="empty">Sepet boş</li>`;
  else {
    linesEl.innerHTML = [...cart].map(([id, q]) => {
      const p = byId(id);
      return `<li class="line" data-id="${id}">
        <div><b>${p.name}</b><small>${p.size} · ${tl(p.price)}</small>
          <div class="qty"><button data-dec="${id}" aria-label="Azalt">−</button><span>${q}</span><button data-inc="${id}" aria-label="Artır">+</button></div></div>
        <span class="sum">${tl(p.price * q)}</span></li>`;
    }).join("");
    if (animateIn) A($$(".line", linesEl), { opacity: [0, 1], y: [20, 0] }, { duration: 0.7, delay: stagger(0.06, { startDelay: 0.2 }), ease: EASE });
  }
  const t = cartTotal();
  tween(totalEl, shownTotal, t, tl, 0.7);
  shownTotal = t;
}

function openDrawer() {
  drawerOpen = true;
  drawer.setAttribute("aria-hidden", "false");
  overlay.style.pointerEvents = "auto";
  document.body.classList.add("locked");
  A(overlay, { opacity: [0, 1] }, { duration: 0.4 });
  A(drawer, { x: ["105%", "0%"] }, { duration: 0.7, ease: EASE });
  renderCart(true);
  $("#drawer-close").focus({ preventScroll: true });
}
function closeDrawer() {
  drawerOpen = false;
  drawer.setAttribute("aria-hidden", "true");
  overlay.style.pointerEvents = "none";
  document.body.classList.remove("locked");
  A(overlay, { opacity: 0 }, { duration: 0.35 });
  A(drawer, { x: "105%" }, { duration: 0.5, ease: SNAP });
  cartBtn.focus({ preventScroll: true });
}
cartBtn.addEventListener("click", openDrawer);
$("#drawer-close").addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);
addEventListener("keydown", (e) => e.key === "Escape" && drawerOpen && closeDrawer());

linesEl.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-inc],[data-dec]");
  if (!b) return;
  const id = Number(b.dataset.inc || b.dataset.dec);
  const q = (cart.get(id) || 0) + (b.dataset.inc ? 1 : -1);
  if (q <= 0) {
    await A($(`.line[data-id="${id}"]`, linesEl), { opacity: 0, x: 40 }, { duration: 0.3, ease: "easeIn" }).finished;
    cart.delete(id);
  } else cart.set(id, q);
  renderCart();
});

$("#checkout").addEventListener("click", (e) => {
  const btn = e.currentTarget;
  if (!cart.size) return A(btn, { x: [0, -8, 8, -4, 4, 0] }, { duration: 0.4 });
  btn.textContent = "Teşekkürler";
  setTimeout(() => {
    cart.clear();
    renderCart();
    btn.textContent = "Siparişi tamamla";
    closeDrawer();
  }, 1100);
});

// Sepete ekle: kartın nokta alanında bir şok halkası + buton geri bildirimi
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-add]");
  if (!b) return;
  const card = b.closest(".card");
  const id = Number(b.dataset.add);
  cart.set(id, (cart.get(id) || 0) + 1);
  renderCart();
  A(cartCount, { y: ["45%", "0%"], opacity: [0, 1] }, { duration: 0.6, ease: EASE });
  const c = card._ht;
  if (c) c.pulse(c.w / 2, c.h / 2);
  b.classList.add("done");
  b.textContent = "Eklendi ✓";
  clearTimeout(b._t);
  b._t = setTimeout(() => { b.classList.remove("done"); b.textContent = "Sepete ekle +"; }, 1500);
});
renderCart();

/* ------------------------------------------------------------------ süreç (dolan şişe) */

(() => {
  const oil = $("#oil");
  const mh = $("#m-hour"), ma = $("#m-acid"), mp = $("#m-poly");
  if (!reduced) {
    animate("#wave1", { x: [0, 100] }, { duration: 3.2, repeat: Infinity, ease: "linear" });
    animate("#wave2", { x: [0, -100] }, { duration: 4.6, repeat: Infinity, ease: "linear" });
    animate("#drop", { y: [0, 6, 100, 100], opacity: [0, 1, 1, 0], scale: [0.4, 1, 1, 0.6] }, { duration: 1.5, times: [0, 0.2, 0.9, 1], repeat: Infinity, repeatDelay: 0.8, ease: "easeIn" });
  }
  scroll((p) => {
    const f = reduced ? 1 : p;
    oil.setAttribute("transform", `translate(0 ${360 - f * 245})`);
    mh.textContent = Math.round(f * 6);
    ma.textContent = (f * 0.2).toFixed(2);
    mp.textContent = Math.round(f * 450);
  }, { target: $("#surec"), offset: ["start start", "end end"] });
})();

/* ------------------------------------------------------------------ satıcı paneli */

(() => {
  const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const vals = [42, 58, 51, 76, 69, 94, 88];
  const bars = $("#bars");
  bars.innerHTML = vals.map((v, i) => `<div class="bar" title="${tl(v * 310)}"><i style="height:${v * 0.78}%"></i><span>${days[i]}</span></div>`).join("");
  if (!reduced) $$("i", bars).forEach((i) => (i.style.transform = "scaleY(0)"));
  inView(bars, () => { A($$("i", bars), { scaleY: [0, 1] }, { duration: 1.1, delay: stagger(0.07), ease: EASE }); });

  const segs = [
    { n: "Zeytinyağı", v: 38, c: "#D9A441" },
    { n: "Zeytin", v: 27, c: "#A3B54A" },
    { n: "Avokado", v: 20, c: "#6B8F3F" },
    { n: "Limon", v: 15, c: "#ECE7D6" },
  ];
  const C = 2 * Math.PI * 46;
  let acc = 0;
  const donut = $("#donut");
  const circles = segs.map((s) => {
    const len = (s.v / 100) * C;
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", 60); c.setAttribute("cy", 60); c.setAttribute("r", 46);
    c.setAttribute("stroke", s.c);
    c.setAttribute("stroke-dashoffset", -acc);
    c.style.strokeDasharray = reduced ? `${len - 2} ${C - len + 2}` : `0 ${C}`;
    acc += len;
    donut.append(c);
    return { c, len };
  });
  $("#legend").innerHTML = segs.map((s) => `<li><i style="background:${s.c}"></i>${s.n} · %${s.v}</li>`).join("");
  inView(donut, () => {
    circles.forEach(({ c, len }, i) => A(c, { strokeDasharray: [`0 ${C}`, `${len - 2} ${C - len + 2}`] }, { duration: 1.4, delay: i * 0.15, ease: EASE }));
  });

  let rev = 18420, ord = 47;
  const kRev = $("#k-rev"), kOrd = $("#k-ord"), kAvg = $("#k-avg");
  const paint = (from, instant) => {
    const to = { rev, ord, avg: rev / ord };
    if (instant) { kRev.textContent = tl(to.rev); kOrd.textContent = to.ord; kAvg.textContent = tl(to.avg); return; }
    tween(kRev, from.rev, to.rev, tl, 1.6);
    tween(kOrd, from.ord, to.ord, (v) => Math.round(v), 1.6);
    tween(kAvg, from.avg, to.avg, tl, 1.6);
  };
  paint(null, true);

  const feed = $("#feed");
  const clock = () => new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const row = (p, qty, who, city, time) => `
    <span class="t">${time}</span>
    <span class="who"><b>${who}</b><small>${qty} × ${p.name} ${p.size} · ${city}</small></span>
    <span class="amt">${tl(p.price * qty)}</span>`;
  for (let i = 0; i < 4; i++) {
    const li = document.createElement("li");
    li.innerHTML = row(pick(products), 1 + (i % 3), pick(buyers), pick(cities), clock());
    feed.append(li);
  }

  const newOrder = () => {
    if (document.hidden) return;
    const p = pick(products), qty = 1 + Math.floor(Math.random() * 3);
    const li = document.createElement("li");
    li.innerHTML = row(p, qty, pick(buyers), pick(cities), clock());
    feed.prepend(li);
    A(li, { opacity: [0, 1], y: [-14, 0], backgroundColor: ["rgba(217,164,65,0.18)", "rgba(217,164,65,0)"] }, { duration: 1.4, ease: EASE });
    const items = $$("li", feed);
    if (items.length > 5) { const last = items.at(-1); A(last, { opacity: 0 }, { duration: 0.4 }).finished.then(() => last.remove()); }
    const prev = { rev, ord, avg: rev / ord };
    rev += p.price * qty; ord += 1;
    paint(prev);
  };

  inView(".panel-grid", () => {
    A($$("[data-tile]"), { opacity: [0, 1], y: [40, 0] }, { duration: 1, delay: stagger(0.08), ease: EASE });
    paint({ rev: 0, ord: 0, avg: 0 });
    const timer = setInterval(newOrder, 3600);
    return () => clearInterval(timer);
  }, { amount: 0.2 });
})();

/* ------------------------------------------------------------------ footer */

(() => {
  const canvas = $("#foot-canvas");
  const field = new Halftone(canvas, { gap: gapFor(6), radius: small() ? 70 : 100, strength: 2.8, reduced, zone: $(".foot-stage") });
  inView(canvas, async () => {
    if (field.drawFn) return;
    const font = '"Inter Tight", "Helvetica Neue", Arial, sans-serif';
    try { await document.fonts.load(`800 100px ${font}`); } catch {}
    field.setSource(textSource("zeytin", { font, weight: 800, crop: 0.2 }), { assemble: true });
  }, { amount: 0.2 });
  $("#to-top").addEventListener("click", () => scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }));
})();

/* ------------------------------------------------------------------ açılış */

async function boot() {
  const loader = $("#loader");
  if (reduced) { loader.remove(); heroIntro(); return; }
  document.body.classList.add("locked");
  scrollTo(0, 0);
  const num = $("#ld-num");
  await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1200))]);

  animate(".ld-bar i", { scaleX: [0, 1] }, { duration: 1.7, ease: SNAP });
  await animate(0, 100, { duration: 1.7, ease: SNAP, onUpdate: (v) => (num.textContent = Math.round(v)) }).finished;

  setTimeout(heroIntro, 450);
  await animate(loader, { clipPath: ["inset(0% 0 0 0)", "inset(0 0 100% 0)"] }, { duration: 1, ease: SNAP }).finished;
  loader.remove();
  document.body.classList.remove("locked");
}
boot();
