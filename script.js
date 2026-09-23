(function () {
  "use strict";

  var body = document.body;
  var opening = document.getElementById("opening");
  var tapBtn = document.getElementById("tapToOpenBtn");
  var bgMusic = document.getElementById("bgMusic");
  var scrollContainer = document.getElementById("scrollContainer");
  var sections = Array.prototype.slice.call(document.querySelectorAll(".section"));

  var hasOpened = false;
  var autoTimer = null;
  var activeSection = null;

  /* -----------------------------------------------------
     Opening / curtain interaction
     ----------------------------------------------------- */

  function preloadArabicVideo() {
    var video = document.querySelector("#section-arabic .section-video");
    if (!video) return;
    video.play().catch(function () {
      /* autoplay may be deferred until the tap gesture; safe to ignore */
    });
  }

  function openInvitation() {
    if (hasOpened) return;
    hasOpened = true;

    opening.classList.add("is-opening");

    bgMusic.play().catch(function () {
      /* music playback is best-effort; site must keep working without it */
    });
    preloadArabicVideo();

    var finalVideo = document.querySelector("#section-final .section-video");
    if (finalVideo) {
      finalVideo.play().catch(function () {});
    }

    window.setTimeout(function () {
      opening.classList.add("opening-hidden");
      body.classList.remove("locked");
      if (activeSection) {
        markActive(activeSection);
      }
    }, 1650);
  }

  tapBtn.addEventListener("click", openInvitation);
  tapBtn.addEventListener(
    "touchend",
    function (e) {
      e.preventDefault();
      openInvitation();
    },
    { passive: false }
  );

  preloadArabicVideo();

  /* -----------------------------------------------------
     Section activation, reveal animation & auto-scroll
     ----------------------------------------------------- */

  function clearAutoTimer() {
    if (autoTimer) {
      window.clearTimeout(autoTimer);
      autoTimer = null;
    }
  }

  function scheduleAutoAdvance(section) {
    clearAutoTimer();
    if (!hasOpened) return;
    var duration = parseInt(section.getAttribute("data-duration") || "0", 10);
    if (!duration) return;
    autoTimer = window.setTimeout(function () {
      var idx = sections.indexOf(section);
      var next = sections[idx + 1];
      if (next) {
        next.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, duration);
  }

  function markActive(section) {
    activeSection = section;
    section.classList.add("in-view");

    if (section.id === "section-quran") {
      runQuranCrossfade(section);
    }

    if (hasOpened) {
      scheduleAutoAdvance(section);
    }
  }

  var sectionObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
          markActive(entry.target);
        }
      });
    },
    { threshold: [0, 0.55, 1] }
  );

  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });

  /* -----------------------------------------------------
     Qur'an internal crossfade between the two passages
     ----------------------------------------------------- */

  var quranTimer = null;

  function runQuranCrossfade(section) {
    if (quranTimer) {
      window.clearTimeout(quranTimer);
      quranTimer = null;
    }
    var slides = section.querySelectorAll(".quran-slide");
    if (slides.length < 2) return;

    slides.forEach(function (slide, i) {
      slide.classList.toggle("active", i === 0);
    });

    quranTimer = window.setTimeout(function () {
      slides[0].classList.remove("active");
      slides[1].classList.add("active");
    }, 3200);
  }

  /* -----------------------------------------------------
     Scratch-to-reveal (Reception date)
     ----------------------------------------------------- */

  function initScratchCard() {
    var canvas = document.getElementById("scratchCanvas");
    if (!canvas) return;
    var card = canvas.closest(".scratch-card");
    var ctx = canvas.getContext("2d");
    var revealed = false;
    var scratching = false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function drawOverlay(w, h) {
      var grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#8c1a37");
      grad.addColorStop(1, "#3d0715");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(230, 205, 148, 0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 8, w - 16, h - 16);

      ctx.fillStyle = "rgba(230, 205, 148, 0.9)";
      ctx.font = "600 15px 'Playfair Display', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SCRATCH TO REVEAL", w / 2, h / 2 - 10);
      ctx.font = "italic 13px 'Cormorant Garamond', serif";
      ctx.fillText("♥ the reception date ♥", w / 2, h / 2 + 14);
    }

    function resize() {
      var rect = card.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!revealed) {
        drawOverlay(rect.width, rect.height);
      }
    }

    function getPoint(evt) {
      var rect = canvas.getBoundingClientRect();
      var clientX, clientY;
      if (evt.touches && evt.touches.length) {
        clientX = evt.touches[0].clientX;
        clientY = evt.touches[0].clientY;
      } else {
        clientX = evt.clientX;
        clientY = evt.clientY;
      }
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function scratchAt(x, y) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    function checkRevealProgress() {
      if (revealed) return;
      var rect = card.getBoundingClientRect();
      var w = Math.max(1, Math.round(rect.width * dpr));
      var h = Math.max(1, Math.round(rect.height * dpr));
      var data;
      try {
        data = ctx.getImageData(0, 0, w, h).data;
      } catch (e) {
        return;
      }
      var cleared = 0;
      var sampled = 0;
      var step = 4 * 43;
      for (var i = 3; i < data.length; i += step) {
        sampled++;
        if (data[i] === 0) cleared++;
      }
      if (sampled > 0 && cleared / sampled > 0.42) {
        revealed = true;
        canvas.style.transition = "opacity 0.7s ease";
        canvas.style.opacity = "0";
        canvas.style.pointerEvents = "none";
      }
    }

    canvas.addEventListener("pointerdown", function (e) {
      if (revealed) return;
      scratching = true;
      pauseAutoScroll();
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
      var p = getPoint(e);
      scratchAt(p.x, p.y);
      checkRevealProgress();
    });

    canvas.addEventListener("pointermove", function (e) {
      if (!scratching || revealed) return;
      var p = getPoint(e);
      scratchAt(p.x, p.y);
      checkRevealProgress();
    });

    ["pointerup", "pointercancel", "pointerleave"].forEach(function (evtName) {
      canvas.addEventListener(evtName, function () {
        scratching = false;
        checkRevealProgress();
      });
    });

    window.addEventListener("resize", resize);
    resize();
  }

  function pauseAutoScroll() {
    clearAutoTimer();
    if (activeSection) {
      window.setTimeout(function () {
        scheduleAutoAdvance(activeSection);
      }, 1200);
    }
  }

  scrollContainer.addEventListener(
    "touchstart",
    function () {
      clearAutoTimer();
    },
    { passive: true }
  );

  scrollContainer.addEventListener(
    "wheel",
    function () {
      clearAutoTimer();
    },
    { passive: true }
  );

  initScratchCard();

  /* -----------------------------------------------------
     Countdown to 25 Oct 2026, 4:30 PM IST
     ----------------------------------------------------- */

  function initCountdown() {
    var target = Date.UTC(2026, 9, 25, 11, 0, 0); // 4:30 PM IST == 11:00 UTC
    var daysEl = document.getElementById("cdDays");
    var hoursEl = document.getElementById("cdHours");
    var minutesEl = document.getElementById("cdMinutes");
    var secondsEl = document.getElementById("cdSeconds");
    if (!daysEl) return;

    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }

    function tick() {
      var now = Date.now();
      var diff = target - now;
      if (diff <= 0) {
        daysEl.textContent = "00";
        hoursEl.textContent = "00";
        minutesEl.textContent = "00";
        secondsEl.textContent = "00";
        window.clearInterval(intervalId);
        return;
      }
      var totalSeconds = Math.floor(diff / 1000);
      var days = Math.floor(totalSeconds / 86400);
      var hours = Math.floor((totalSeconds % 86400) / 3600);
      var minutes = Math.floor((totalSeconds % 3600) / 60);
      var seconds = totalSeconds % 60;

      daysEl.textContent = pad(days);
      hoursEl.textContent = pad(hours);
      minutesEl.textContent = pad(minutes);
      secondsEl.textContent = pad(seconds);
    }

    tick();
    var intervalId = window.setInterval(tick, 1000);
  }

  initCountdown();

  /* -----------------------------------------------------
     Rose petals
     ----------------------------------------------------- */

  function initPetals() {
    var layers = Array.prototype.slice.call(document.querySelectorAll(".petal-layer"));
    if (!layers.length) return;

    layers.forEach(function (layer) {
      var density = layer.getAttribute("data-petals") === "soft" ? 4200 : 6000;

      function spawn() {
        var petal = document.createElement("span");
        petal.className = "petal";
        var size = 8 + Math.random() * 10;
        var startX = Math.random() * 100;
        var drift = (Math.random() * 2 - 1) * 90;
        var duration = 8 + Math.random() * 7;
        var delay = Math.random() * 0.6;

        petal.style.left = startX + "%";
        petal.style.width = size + "px";
        petal.style.height = size * 0.8 + "px";
        petal.style.setProperty("--drift", drift + "px");
        petal.style.animationDuration = duration + "s";
        petal.style.animationDelay = delay + "s";
        petal.style.opacity = "0";

        layer.appendChild(petal);

        window.setTimeout(function () {
          if (petal.parentNode) petal.parentNode.removeChild(petal);
        }, (duration + delay) * 1000 + 200);
      }

      spawn();
      window.setInterval(spawn, density / 3);
    });
  }

  initPetals();

  /* -----------------------------------------------------
     Guest response form
     ----------------------------------------------------- */

  function initGuestForm() {
    var form = document.getElementById("guestForm");
    if (!form) return;

    var nameInput = document.getElementById("guestName");
    var submitBtn = document.getElementById("guestSubmit");
    var message = document.getElementById("formMessage");
    var selections = { response: null, side: null };

    var buttons = Array.prototype.slice.call(form.querySelectorAll(".choice-btn"));
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var field = btn.getAttribute("data-field");
        var value = btn.getAttribute("data-value");
        selections[field] = value;
        buttons
          .filter(function (b) {
            return b.getAttribute("data-field") === field;
          })
          .forEach(function (b) {
            b.classList.toggle("selected", b === btn);
          });
      });
    });

    function setMessage(text, isError) {
      message.textContent = text;
      message.classList.toggle("error", !!isError);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = nameInput.value.trim();
      if (!name) {
        setMessage("Please enter your name.", true);
        nameInput.focus();
        return;
      }
      if (!selections.response) {
        setMessage("Please let us know if you will attend.", true);
        return;
      }
      if (!selections.side) {
        setMessage("Please select Groom or Bride.", true);
        return;
      }

      submitBtn.disabled = true;
      setMessage("Sending your response…", false);

      fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          side: selections.side,
          response: selections.response,
        }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          return res.json();
        })
        .then(function () {
          setMessage("Thank you, " + name + ". Your response has been received. 🤍", false);
          form.reset();
          selections.response = null;
          selections.side = null;
          buttons.forEach(function (b) {
            b.classList.remove("selected");
          });
        })
        .catch(function () {
          setMessage("Something went wrong. Please try again.", true);
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }

  initGuestForm();
})();
