const state = {
  specs: [],
  encounters: { patch: "12.1", season: 2, raid: [], mythicplus: [] },
  classId: 6,
  specId: 250,
  tab: "bis",
  talentCtx: "singleTarget",
  trinketCtx: "raid",
  bossCtx: "raid",
  dropCtx: "raid",
  query: "",
  locked: false,
};

const el = {
  picker: document.getElementById("spec-picker"),
  lockBtn: document.getElementById("lock-btn"),
  hideBtn: document.getElementById("hide-btn"),
  hotkeyBtn: document.getElementById("hotkey-btn"),
  search: document.getElementById("search"),
  subnav: document.getElementById("subnav"),
  banner: document.getElementById("banner"),
  rebindBanner: document.getElementById("rebind-banner"),
  content: document.getElementById("content"),
  meta: document.getElementById("meta"),
  footer: document.getElementById("footer"),
};

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.href;
  } catch {
    return "";
  }
}

function hay(...parts) {
  return parts
    .flat(Infinity)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matches(text) {
  const q = state.query.trim().toLowerCase();
  if (!q) return true;
  return String(text).toLowerCase().includes(q);
}

function placeholderSpec(classId, specId) {
  const wowhead = [{ name: "Wowhead", url: "https://www.wowhead.com" }];
  return {
    patch: "12.1",
    season: 2,
    updatedAt: "",
    classId,
    specId,
    className: "Unknown",
    specName: `Spec ${specId}`,
    status: "placeholder",
    bisCrafts: [],
    bisDrops: { raid: [], mplus: [] },
    talents: {
      singleTarget: [{ heroTree: "", loadoutCode: null, bullets: ["Not curated yet."], sources: wowhead }],
      mplus: [{ heroTree: "", loadoutCode: null, bullets: ["Not curated yet."], sources: wowhead }],
      delves: [{ heroTree: "", loadoutCode: null, bullets: ["Not curated yet."], sources: wowhead }],
    },
    trinkets: { raid: [], mplus: [] },
  };
}

function currentSpec() {
  return (
    state.specs.find((s) => s.classId === state.classId && s.specId === state.specId) ||
    placeholderSpec(state.classId, state.specId)
  );
}

function specLabel(spec) {
  return `${spec.className} — ${spec.specName}`;
}

function sourcesHtml(sources) {
  if (!sources || !sources.length) return "";
  const buttons = sources
    .map((s) => {
      const url = safeUrl(s.url);
      if (!url) return "";
      return `<button type="button" class="source" data-url="${esc(url)}">${esc(s.name)}</button>`;
    })
    .filter(Boolean)
    .join("");
  return buttons ? `<div class="sources">${buttons}</div>` : "";
}

function empty(text) {
  return `<p class="empty">${esc(text)}</p>`;
}

function fillPicker() {
  const specs = [...state.specs];
  const hasCurrent = specs.some((s) => s.classId === state.classId && s.specId === state.specId);
  if (!hasCurrent) specs.push(placeholderSpec(state.classId, state.specId));
  el.picker.innerHTML = specs
    .map((s) => {
      const selected = s.classId === state.classId && s.specId === state.specId ? " selected" : "";
      return `<option value="${s.classId}|${s.specId}"${selected}>${esc(specLabel(s))}</option>`;
    })
    .join("");
}

function setLockUi(locked) {
  state.locked = locked;
  document.body.classList.toggle("locked", locked);
  el.lockBtn.classList.toggle("active", locked);
  el.lockBtn.textContent = locked ? "Locked" : "Lock";
}

function setHotkeyUi(hotkey) {
  state.hotkey = hotkey || "F8";
  el.hotkeyBtn.textContent = state.hotkey;
  el.hotkeyBtn.title = "Change toggle hotkey";
  el.hideBtn.title = `Hide panel (${state.hotkey})`;
  el.footer.textContent = `${state.hotkey} toggle · click-through when hidden`;
}

function setRebindUi(active) {
  el.rebindBanner.classList.toggle("hidden", !active);
  el.hotkeyBtn.classList.toggle("active", active);
}

function subnavHtml() {
  const tabs = {
    talents: [
      ["singleTarget", "Single Target"],
      ["mplus", "M+"],
      ["delves", "Delves"],
    ],
    drops: [
      ["raid", "Raid"],
      ["mplus", "M+"],
    ],
    trinkets: [
      ["raid", "Raid"],
      ["mplus", "M+"],
    ],
    bosses: [
      ["raid", "Raid"],
      ["mythicplus", "M+"],
    ],
  };
  const pairs = tabs[state.tab];
  if (!pairs) {
    el.subnav.classList.add("hidden");
    el.subnav.innerHTML = "";
    return;
  }
  el.subnav.classList.remove("hidden");
  const current =
    state.tab === "talents"
      ? state.talentCtx
      : state.tab === "drops"
        ? state.dropCtx
        : state.tab === "trinkets"
          ? state.trinketCtx
          : state.bossCtx;
  el.subnav.innerHTML = pairs
    .map(
      ([id, label]) =>
        `<button type="button" class="pill${id === current ? " active" : ""}" data-ctx="${id}">${label}</button>`
    )
    .join("");
}

function renderBanner(spec) {
  if (spec.status === "curated") {
    el.banner.classList.add("hidden");
    el.banner.textContent = "";
    return;
  }
  el.banner.classList.remove("hidden");
  el.banner.textContent = "This spec is not curated yet. Use the source links — BIS is not invented here.";
}

function renderBis(spec) {
  const rows = (spec.bisCrafts || []).filter((row) =>
    matches(hay(row.slot, row.item, row.notes, (row.sources || []).map((s) => s.name)))
  );
  if (!rows.length) {
    el.content.innerHTML = empty(spec.bisCrafts && spec.bisCrafts.length ? "No matches." : "No craft BIS listed yet.");
    return;
  }
  el.content.innerHTML = rows
    .map(
      (row) => `
      <article class="card">
        <div class="slot">${esc(row.slot)}</div>
        <h3>${esc(row.item)}</h3>
        <p class="notes">${esc(row.notes)}</p>
        ${sourcesHtml(row.sources)}
      </article>`
    )
    .join("");
}

function renderTalents(spec) {
  const list = (spec.talents && spec.talents[state.talentCtx]) || [];
  const rows = list.filter((loadout) =>
    matches(
      hay(
        loadout.heroTree,
        loadout.loadoutCode,
        loadout.bullets,
        (loadout.sources || []).map((s) => s.name)
      )
    )
  );
  if (!rows.length) {
    el.content.innerHTML = empty(list.length ? "No matches." : "No talent notes yet.");
    return;
  }
  el.content.innerHTML = rows
    .map((loadout) => {
      const rec = loadout.recommended ? `<span class="badge">Recommended</span>` : "";
      const bullets = (loadout.bullets || []).map((b) => `<li>${esc(b)}</li>`).join("");
      const code = loadout.loadoutCode
        ? `<div class="row-top"><code class="loadout">${esc(loadout.loadoutCode)}</code>
         <button type="button" class="copy-btn" data-copy="${esc(loadout.loadoutCode)}">Copy</button></div>`
        : "";
      return `
    <article class="card">
      <div class="hero">Hero tree</div>
      <h3>${esc(loadout.heroTree || "Not set")}${rec}</h3>
      ${code}
      <ul class="bullets">${bullets}</ul>
      ${sourcesHtml(loadout.sources)}
    </article>`;
    })
    .join("");
}

function renderDrops(spec) {
  const list = ((spec.bisDrops && spec.bisDrops[state.dropCtx]) || [])
    .slice()
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));
  const rows = list.filter((row) =>
    matches(
      hay(
        row.boss,
        row.instance,
        row.notes,
        (row.items || []).map((item) => [item.slot, item.item, item.from]),
        (row.sources || []).map((s) => s.name)
      )
    )
  );
  if (!rows.length) {
    el.content.innerHTML = empty(list.length ? "No matches." : "No drop targets listed yet.");
    return;
  }
  el.content.innerHTML = rows
    .map((row) => {
      const items = (row.items || [])
        .map((item) => {
          const from = item.from ? `<div class="from">Kill ${esc(item.from)}</div>` : "";
          return `<li><strong>${esc(item.slot)}</strong> · ${esc(item.item)}${from}</li>`;
        })
        .join("");
      return `
      <article class="card">
        <div class="prio">Farm ${esc(row.priority)}</div>
        <div class="slot">${esc(row.instance || "")}</div>
        <h3>${esc(row.boss)}</h3>
        <ul class="drops">${items}</ul>
        <p class="notes">${esc(row.notes)}</p>
        ${sourcesHtml(row.sources)}
      </article>`;
    })
    .join("");
}

function renderTrinkets(spec) {
  const list = (spec.trinkets && spec.trinkets[state.trinketCtx]) || [];
  const rows = list.filter((row) => matches(hay(row.tier, row.item, row.whenToUse, (row.sources || []).map((s) => s.name))));
  if (!rows.length) {
    el.content.innerHTML = empty(list.length ? "No matches." : "No trinket ranks listed yet.");
    return;
  }
  el.content.innerHTML = rows
    .map(
      (row) => `
      <article class="card">
        <h3><span class="tier ${esc(row.tier)}">${esc(row.tier)}</span>${esc(row.item)}</h3>
        <p class="when">${esc(row.whenToUse)}</p>
        ${sourcesHtml(row.sources)}
      </article>`
    )
    .join("");
}

function renderBosses() {
  const list = (state.encounters[state.bossCtx] || []).slice();
  const spec = currentSpec();
  const rows = list.filter((enc) => {
    const note = enc.specNotes && enc.specNotes[String(spec.specId)];
    return matches(hay(enc.name, enc.instance, enc.kind, enc.lines, note, (enc.sources || []).map((s) => s.name)));
  });
  if (!rows.length) {
    el.content.innerHTML = empty(list.length ? "No matches." : "No boss notes for this season yet.");
    return;
  }
  el.content.innerHTML = rows
    .map((enc) => {
      const note = enc.specNotes && enc.specNotes[String(spec.specId)];
      const lines = (enc.lines || []).map((line) => `<p class="line">${esc(line)}</p>`).join("");
      const specLine = note ? `<p class="notes">${esc(spec.specName)}: ${esc(note)}</p>` : "";
      const inst = enc.instance ? ` · ${enc.instance}` : "";
      return `
        <article class="card">
          <div class="slot">${esc(enc.kind || "")}${esc(inst)}</div>
          <h3>${esc(enc.name)}</h3>
          ${lines}
          ${specLine}
          ${sourcesHtml(enc.sources)}
        </article>`;
    })
    .join("");
}

function render() {
  const spec = currentSpec();
  el.meta.textContent = `${spec.patch || "12.1"} · S${spec.season || state.encounters.season || 2}`;
  fillPicker();
  subnavHtml();
  renderBanner(spec);
  if (state.tab === "bis") renderBis(spec);
  else if (state.tab === "drops") renderDrops(spec);
  else if (state.tab === "talents") renderTalents(spec);
  else if (state.tab === "trinkets") renderTrinkets(spec);
  else renderBosses();
}

function selectSpec(classId, specId) {
  state.classId = classId;
  state.specId = specId;
  window.wqr.setSpec(classId, specId);
  render();
}

document.querySelector(".tabs").addEventListener("click", (event) => {
  const btn = event.target.closest(".tab");
  if (!btn) return;
  state.tab = btn.dataset.tab;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab === btn));
  render();
});

el.subnav.addEventListener("click", (event) => {
  const btn = event.target.closest(".pill");
  if (!btn) return;
  const ctx = btn.dataset.ctx;
  if (state.tab === "talents") state.talentCtx = ctx;
  else if (state.tab === "drops") state.dropCtx = ctx;
  else if (state.tab === "trinkets") state.trinketCtx = ctx;
  else state.bossCtx = ctx;
  render();
});

el.content.addEventListener("click", (event) => {
  const source = event.target.closest(".source");
  if (source && source.dataset.url) {
    window.wqr.openExternal(source.dataset.url);
    return;
  }
  const copy = event.target.closest(".copy-btn");
  if (copy && copy.dataset.copy) {
    navigator.clipboard.writeText(copy.dataset.copy);
    copy.textContent = "Copied";
    setTimeout(() => {
      copy.textContent = "Copy";
    }, 900);
  }
});

el.picker.addEventListener("change", () => {
  const [classId, specId] = el.picker.value.split("|").map(Number);
  selectSpec(classId, specId);
});

el.lockBtn.addEventListener("click", async () => {
  const locked = await window.wqr.setLocked(!state.locked);
  setLockUi(locked);
});

el.hideBtn.addEventListener("click", () => window.wqr.hide());
el.hotkeyBtn.addEventListener("click", () => window.wqr.startRebind());
el.search.addEventListener("input", () => {
  state.query = el.search.value;
  render();
});

window.wqr.onOpenSpec((payload) => {
  selectSpec(payload.classId, payload.specId);
});

window.wqr.onLockChanged((locked) => setLockUi(locked));
window.wqr.onRebindHotkey((active) => setRebindUi(active));
window.wqr.onHotkeyChanged((hotkey) => setHotkeyUi(hotkey));

async function boot() {
  const [data, settings] = await Promise.all([window.wqr.getData(), window.wqr.getSettings()]);
  state.specs = data.specs || [];
  state.encounters = data.encounters || state.encounters;
  state.classId = settings.classId || 6;
  state.specId = settings.specId || 250;
  setLockUi(Boolean(settings.locked));
  setHotkeyUi(settings.hotkey || "F8");
  render();
}

boot();
