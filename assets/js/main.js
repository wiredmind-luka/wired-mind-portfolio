/* wired-mind portfolio · minimal JS
   Kein Tracking, keine Cookies, keine externen Requests. */

(function () {
  "use strict";

  /* ---------- Aktuelles Jahr im Footer ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile-Navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Menü schließen, wenn ein Link geklickt wurde
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Terminal-Typing im Hero ---------- */
  var cmdEl = document.getElementById("typed-cmd");
  var outEl = document.getElementById("term-output");
  var cursorEl = document.getElementById("term-cursor");
  // Kurzform auf schmalen Screens: die Zeile ist nowrap und würde sonst abgeschnitten
  var command = window.matchMedia("(max-width: 700px)").matches
    ? "build --infra --learn"
    : "build --infra --learn --automate";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var startTyping = null;

  if (cmdEl && outEl) {
    if (reduceMotion) {
      // Ohne Animation: alles sofort anzeigen
      cmdEl.textContent = command;
      outEl.classList.add("visible");
    } else {
      startTyping = function () {
        var i = 0;
        var typeNext = function () {
          if (i < command.length) {
            cmdEl.textContent += command.charAt(i);
            i++;
            setTimeout(typeNext, 38 + Math.random() * 45);
          } else {
            setTimeout(function () {
              outEl.classList.add("visible");
              if (cursorEl) cursorEl.style.display = "none";
            }, 350);
          }
        };
        setTimeout(typeNext, 400);
      };
    }
  }

  /* ---------- Boot-Sequenz (nur Startseite, einmal pro Session) ----------
     sessionStorage statt Cookie: bleibt im Browser, wird beim Schließen
     des Tabs verworfen und nie übertragen – datenschutzneutral.
     Bei prefers-reduced-motion oder ohne JS existiert das Overlay nicht. */
  var bootSeen = true;
  try {
    bootSeen = window.sessionStorage.getItem("wm-boot") === "1";
  } catch (e) { /* Storage blockiert → keine Boot-Sequenz */ }

  var runBoot = function (onDone) {
    try { window.sessionStorage.setItem("wm-boot", "1"); } catch (e) {}

    var overlay = document.createElement("div");
    overlay.className = "boot-overlay";
    overlay.setAttribute("aria-hidden", "true");
    var inner = document.createElement("div");
    inner.className = "boot-inner";
    overlay.appendChild(inner);

    var lineWrap = document.createElement("div");
    var barEl = document.createElement("p");
    barEl.className = "boot-line boot-bar";
    inner.appendChild(lineWrap);
    inner.appendChild(barEl);

    var renderBar = function (pct) {
      var cells = 22;
      var filled = Math.round((pct / 100) * cells);
      var bar = "";
      for (var c = 0; c < cells; c++) bar += c < filled ? "#" : "·";
      barEl.textContent = "[" + bar + "] " + (pct < 10 ? "  " : pct < 100 ? " " : "") + pct + "%";
    };
    renderBar(0);

    var lines = [
      "booting wired-mind.net …",
      "[ ok ] mounting /srv/portfolio",
      "[ ok ] starting nginx",
      "[ ok ] cloudflared tunnel up"
    ];
    var timers = [];
    lines.forEach(function (text, idx) {
      timers.push(setTimeout(function () {
        var p = document.createElement("p");
        p.className = "boot-line";
        if (text.indexOf("[ ok ]") === 0) {
          var tag = document.createElement("span");
          tag.className = "boot-ok";
          tag.textContent = "[ ok ]";
          p.appendChild(tag);
          p.appendChild(document.createTextNode(text.slice(6)));
        } else {
          p.className += " boot-head";
          p.textContent = text;
        }
        lineWrap.appendChild(p);
      }, idx * 170));
    });

    var done = false;
    var finish = function () {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", finish);
      renderBar(100);
      overlay.classList.add("done");
      document.documentElement.classList.remove("booting");
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 320);
      onDone();
    };
    overlay.addEventListener("click", finish);
    window.addEventListener("keydown", finish);

    var start = null;
    var step = function (ts) {
      if (done) return;
      if (start === null) start = ts;
      var pct = Math.min(100, Math.round(((ts - start) / 900) * 100));
      renderBar(pct);
      if (pct < 100) {
        window.requestAnimationFrame(step);
      } else {
        setTimeout(finish, 180);
      }
    };
    timers.push(setTimeout(function () {
      window.requestAnimationFrame(step);
    }, 150));

    document.documentElement.classList.add("booting");
    document.body.appendChild(overlay);
  };

  if (!reduceMotion && !bootSeen && cmdEl) {
    runBoot(function () { if (startTyping) startTyping(); });
  } else if (startTyping) {
    startTyping();
  }

  /* ---------- Scroll-Reveal (einmalig, dezent) ----------
     Klassen werden nur per JS gesetzt: ohne JS und bei
     prefers-reduced-motion bleibt alles sofort sichtbar. */
  var sections = document.querySelectorAll("main .section");
  if (!reduceMotion && "IntersectionObserver" in window && sections.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -60px", threshold: 0.05 });

    sections.forEach(function (section) {
      section.classList.add("reveal");
      revealObserver.observe(section);
    });
  }

  /* ---------- Topologie: zeichnet sich einmal, wenn sichtbar ----------
     Ohne JS oder mit reduced-motion bleibt der Graph statisch komplett. */
  var topology = document.querySelector(".topology");
  if (topology && !reduceMotion && "IntersectionObserver" in window) {
    var topoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          topology.classList.add("topo-live");
          topoObserver.disconnect();
        }
      });
    }, { threshold: 0.25 });
    topoObserver.observe(topology);
  }

  /* ---------- Scroll-Spy: aktive Links in Nav UND Sektions-Indikator ---------- */
  var spyLinks = document.querySelectorAll(".nav-menu a[href^='#'], .toc-rail a[href^='#']");
  if ("IntersectionObserver" in window && spyLinks.length) {
    // Pro Sektions-ID können mehrere Links existieren (Nav-Menü + toc-rail)
    var linksById = {};
    spyLinks.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      (linksById[id] = linksById[id] || []).push(link);
    });

    var setActive = function (id) {
      spyLinks.forEach(function (link) { link.classList.remove("active"); });
      (linksById[id] || []).forEach(function (link) { link.classList.add("active"); });
    };

    // Der Hero hat keine eigene ID (#start liegt auf <main>) –
    // er zählt für den Indikator als "start".
    var hero = document.querySelector("main .hero");

    var spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id || (entry.target === hero ? "start" : "");
        if (linksById[id]) setActive(id);
      });
    }, { rootMargin: "-30% 0px -60%" });

    document.querySelectorAll("main section[id]").forEach(function (section) {
      if (linksById[section.id]) spyObserver.observe(section);
    });
    if (hero && linksById.start) spyObserver.observe(hero);
  }
})();
