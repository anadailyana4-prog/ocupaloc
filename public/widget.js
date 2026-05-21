/**
 * OcupaLoc embeddable booking widget (zero third-party deps).
 * Usage:
 * <script src="https://ocupaloc.ro/widget.js" data-slug="salonul-tau" async></script>
 *
 * Optional: data-button-text, data-primary-color, data-font-family
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;

  var slug = (script.getAttribute("data-slug") || "").trim();
  if (!slug) {
    console.warn("[OcupaLoc widget] Missing data-slug on script tag.");
    return;
  }

  var btnLabel = script.getAttribute("data-button-text") || "Programează-te";
  var primary = script.getAttribute("data-primary-color") || "#0F766E";
  var fontFamily = script.getAttribute("data-font-family") || 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  var base = "";
  try {
    base = new URL(script.src).origin;
  } catch {
    return;
  }

  var css =
    "#ocw-fab{position:fixed;z-index:2147483000;right:18px;bottom:18px;border:none;border-radius:9999px;padding:14px 20px;" +
    "font:600 15px " +
    fontFamily +
    ";cursor:pointer;box-shadow:0 10px 28px rgba(0,0,0,.18);color:#fff;background:" +
    primary +
    ";}" +
    "#ocw-overlay{position:fixed;inset:0;z-index:2147483001;background:rgba(0,0,0,.45);display:none;align-items:center;justify-content:center;padding:16px;}" +
    "#ocw-box{width:min(420px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:16px;font:14px " +
    fontFamily +
    ";color:#111;box-shadow:0 24px 48px rgba(0,0,0,.2);}" +
    "#ocw-head{padding:16px 18px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between;}" +
    "#ocw-title{font-weight:700;font-size:17px;}" +
    "#ocw-x{border:none;background:transparent;font-size:22px;line-height:1;cursor:pointer;color:#666;padding:4px;}" +
    "#ocw-body{padding:16px 18px 20px;}" +
    ".ocw-muted{color:#666;font-size:12px;margin-bottom:10px;}" +
    ".ocw-btn{display:block;width:100%;text-align:left;padding:10px 12px;margin-bottom:8px;border:1px solid #e5e5e5;border-radius:10px;background:#fafafa;cursor:pointer;font:inherit;}" +
    ".ocw-btn:hover{border-color:" +
    primary +
    ";background:#f0fdf9;}" +
    ".ocw-grid{display:flex;flex-wrap:wrap;gap:8px;}" +
    ".ocw-slot{padding:8px 12px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font:inherit;font-size:13px;}" +
    ".ocw-slot:hover{border-color:" +
    primary +
    ";}" +
    ".ocw-input{width:100%;padding:10px 12px;margin-bottom:10px;border:1px solid #ccc;border-radius:8px;font:inherit;box-sizing:border-box;}" +
    ".ocw-submit{width:100%;padding:12px;border:none;border-radius:10px;background:" +
    primary +
    ";color:#fff;font:600 15px inherit;cursor:pointer;margin-top:6px;}" +
    ".ocw-link{display:inline-block;margin-top:12px;color:" +
    primary +
    ";font-size:13px;}" +
    ".ocw-err{color:#b91c1c;font-size:13px;margin-top:8px;}";

  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  function ymdRoDaysAhead(n) {
    var out = [];
    var i;
    var d;
    for (i = 0; i < n; i++) {
      d = new Date();
      d.setDate(d.getDate() + i);
      out.push(d.toLocaleDateString("en-CA", { timeZone: "Europe/Bucharest" }));
    }
    return out;
  }

  function fmtTime(iso) {
    try {
      return new Date(iso).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" });
    } catch {
      return iso;
    }
  }

  function fmtDayLabel(ymd) {
    try {
      var p = ymd.split("-");
      var dt = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
      return dt.toLocaleDateString("ro-RO", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
    } catch {
      return ymd;
    }
  }

  var fab = document.createElement("button");
  fab.type = "button";
  fab.id = "ocw-fab";
  fab.textContent = btnLabel;
  document.body.appendChild(fab);

  var overlay = document.createElement("div");
  overlay.id = "ocw-overlay";
  overlay.innerHTML =
    '<div id="ocw-box" role="dialog" aria-modal="true">' +
    '<div id="ocw-head"><span id="ocw-title">Rezervare</span><button type="button" id="ocw-x" aria-label="Închide">×</button></div>' +
    '<div id="ocw-body"></div></div>';

  document.body.appendChild(overlay);

  var bodyEl = overlay.querySelector("#ocw-body");
  var titleEl = overlay.querySelector("#ocw-title");

  function close() {
    overlay.style.display = "none";
  }

  function open() {
    overlay.style.display = "flex";
    stepServices();
  }

  fab.addEventListener("click", open);
  overlay.querySelector("#ocw-x").addEventListener("click", close);
  overlay.addEventListener("click", function (ev) {
    if (ev.target === overlay) close();
  });

  var svcList = [];
  var selSvc = null;
  var selDate = null;
  var selSlot = null;

  function setTitle(t) {
    titleEl.textContent = t;
  }

  function showErr(msg) {
    var e = document.createElement("div");
    e.className = "ocw-err";
    e.textContent = msg;
    bodyEl.appendChild(e);
  }

  function clearBody() {
    bodyEl.innerHTML = "";
  }

  function stepServices() {
    clearBody();
    setTitle("Alege serviciul");
    bodyEl.innerHTML = '<p class="ocw-muted">Se încarcă…</p>';
    fetch(base + "/api/public/services?slug=" + encodeURIComponent(slug))
      .then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok, j: j };
        });
      })
      .then(function (x) {
        clearBody();
        if (!x.ok || !x.j.services) {
          showErr((x.j && x.j.error) || "Nu am putut încărca serviciile.");
          linkFull();
          return;
        }
        svcList = x.j.services;
        if (!svcList.length) {
          showErr("Nu există servicii active.");
          linkFull();
          return;
        }
        svcList.forEach(function (s) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "ocw-btn";
          var line = s.nume + " · " + s.durata_minute + " min";
          if (s.pret != null) line += " · " + s.pret + " RON";
          b.textContent = line;
          b.addEventListener("click", function () {
            selSvc = s;
            stepDates();
          });
          bodyEl.appendChild(b);
        });
        linkFull();
      })
      .catch(function () {
        clearBody();
        showErr("Eroare de rețea.");
        linkFull();
      });
  }

  function stepDates() {
    clearBody();
    setTitle("Alege ziua");
    var days = ymdRoDaysAhead(14);
    days.forEach(function (d) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ocw-btn";
      b.textContent = fmtDayLabel(d) + " — " + d;
      b.addEventListener("click", function () {
        selDate = d;
        stepSlots();
      });
      bodyEl.appendChild(b);
    });
    linkFull();
  }

  function stepSlots() {
    clearBody();
    setTitle("Alege ora");
    bodyEl.innerHTML = '<p class="ocw-muted">Se încarcă sloturi…</p>';
    var url =
      base +
      "/api/widget/slots?slug=" +
      encodeURIComponent(slug) +
      "&serviciuId=" +
      encodeURIComponent(selSvc.id) +
      "&date=" +
      encodeURIComponent(selDate);
    fetch(url)
      .then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok, j: j };
        });
      })
      .then(function (x) {
        clearBody();
        if (!x.ok || !x.j.slots) {
          showErr((x.j && x.j.error) || "Nu am putut încărca orele.");
          linkFull();
          return;
        }
        if (!x.j.slots.length) {
          showErr("Nu sunt locuri libere în această zi. Încearcă altă dată.");
          var back = document.createElement("button");
          back.type = "button";
          back.className = "ocw-btn";
          back.textContent = "← Altă zi";
          back.addEventListener("click", stepDates);
          bodyEl.appendChild(back);
          linkFull();
          return;
        }
        var grid = document.createElement("div");
        grid.className = "ocw-grid";
        x.j.slots.forEach(function (iso) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "ocw-slot";
          b.textContent = fmtTime(iso);
          b.addEventListener("click", function () {
            selSlot = iso;
            stepForm();
          });
          grid.appendChild(b);
        });
        bodyEl.appendChild(grid);
        linkFull();
      })
      .catch(function () {
        clearBody();
        showErr("Eroare de rețea.");
        linkFull();
      });
  }

  function stepForm() {
    clearBody();
    setTitle("Date de contact");
    bodyEl.innerHTML =
      '<label class="ocw-muted">Nume</label>' +
      '<input class="ocw-input" id="ocw-name" autocomplete="name" />' +
      '<label class="ocw-muted">Telefon</label>' +
      '<input class="ocw-input" id="ocw-phone" autocomplete="tel" placeholder="07xx xxx xxx" />' +
      '<label class="ocw-muted">Email (opțional)</label>' +
      '<input class="ocw-input" id="ocw-email" type="email" autocomplete="email" />' +
      '<button type="button" class="ocw-submit" id="ocw-send">Confirmă rezervarea</button>';

    bodyEl.querySelector("#ocw-send").addEventListener("click", function () {
      var name = bodyEl.querySelector("#ocw-name").value.trim();
      var phone = bodyEl.querySelector("#ocw-phone").value.trim();
      var email = bodyEl.querySelector("#ocw-email").value.trim();
      if (name.length < 2) {
        alert("Introdu numele complet.");
        return;
      }
      if (phone.replace(/\D/g, "").length < 10) {
        alert("Introdu un număr de telefon valid (minim 10 cifre).");
        return;
      }
      fetch(base + "/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgSlug: slug,
          serviceId: selSvc.id,
          startTime: selSlot,
          clientName: name,
          clientPhone: phone,
          clientEmail: email || null
        })
      })
        .then(function (r) {
          return r.json().then(function (j) {
            return { ok: r.ok, j: j };
          });
        })
        .then(function (x) {
          clearBody();
          if (x.j && x.j.success) {
            setTitle("Gata!");
            bodyEl.innerHTML =
              "<p>Rezervarea a fost înregistrată. Vei primi confirmare pe email dacă ai introdus adresa.</p>";
            linkFull();
          } else {
            var err =
              x.j && x.j.error
                ? typeof x.j.error === "string"
                  ? x.j.error
                  : "Date invalide."
                : "Nu am putut salva. Încearcă din nou.";
            showErr(err);
            linkFull();
          }
        })
        .catch(function () {
          clearBody();
          showErr("Eroare de rețea.");
          linkFull();
        });
    });
    linkFull();
  }

  function linkFull() {
    var a = document.createElement("a");
    a.className = "ocw-link";
    a.href = base + "/" + encodeURIComponent(slug);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Deschide pagina completă de rezervare →";
    bodyEl.appendChild(a);
  }
})();
