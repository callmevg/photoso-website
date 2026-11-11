(() => {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const motionToggle = document.getElementById("motion-toggle");
  const shell = document.getElementById("hero-shell");
  const canvas = document.getElementById("ascii-field");
  const context = canvas.getContext("2d");
  let userPaused = false;
  let inView = true;
  let frame = 0;
  let lastFrame = 0;
  let phase = 0;
  let placePlayback;
  const motionAllowed = () => !reducedMotion.matches && !userPaused;

  const downloadDock = document.querySelector(".download-dock");
  const updateDownloadDock = () => {
    downloadDock.hidden = window.scrollY <= 0;
  };
  window.addEventListener("scroll", updateDownloadDock, { passive: true });
  window.addEventListener("pageshow", updateDownloadDock);
  updateDownloadDock();

  const updateThemeColor = () => {
    document.querySelector('meta[name="theme-color"]').content =
      getComputedStyle(document.documentElement).getPropertyValue("--cp-stage").trim();
  };
  updateThemeColor();

  const drawAscii = () => {
    if (!context) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const columns = width < 600 ? 48 : 100;
    const rows = 46;
    const chars = " .·:+*#@";
    const cells = Array.from({ length: rows }, () => Array(columns).fill(" "));
    const depth = new Float32Array(columns * rows);
    const sin = Math.sin(phase * .27);
    const cos = Math.cos(phase * .27);
    for (let a = 0; a < Math.PI * 2; a += .075) {
      for (let b = 0; b < Math.PI * 2; b += .16) {
        const radius = 2.4 + Math.cos(b);
        const x = radius * Math.cos(a);
        const y = radius * Math.sin(a);
        const z = Math.sin(b);
        const ry = y * cos - z * sin;
        const rz = y * sin + z * cos;
        const perspective = 1 / (6 + rz);
        const col = Math.floor(columns / 2 + columns * .65 * x * perspective);
        const row = Math.floor(rows / 2 + rows * .7 * ry * perspective);
        if (row < 0 || row >= rows || col < 0 || col >= columns) continue;
        const index = row * columns + col;
        if (perspective > depth[index]) {
          depth[index] = perspective;
          const light = (Math.cos(a - phase * .2) + Math.sin(b) + 2) / 4;
          cells[row][col] = chars[Math.min(chars.length - 1, 1 + Math.floor(light * 6))];
        }
      }
    }
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = getComputedStyle(shell).getPropertyValue("--cp-stage-line").trim();
    context.font = `${Math.max(9, width / columns * .95)}px Consolas, "Courier New", monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    for (let row = 0; row < rows; row++) {
      context.fillText(cells[row].join(""), width / 2, height * .38 + row * height / 68);
    }
  };
  const animateAscii = (time) => {
    if (time - lastFrame >= 100) {
      phase += .065;
      drawAscii();
      lastFrame = time;
    }
    frame = requestAnimationFrame(animateAscii);
  };
  const resetParallax = () => {
    for (const name of ["--tilt-x", "--tilt-y"]) shell.style.removeProperty(name);
  };
  const syncMotion = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    const paused = !motionAllowed();
    document.documentElement.dataset.motionPaused = String(paused);
    motionToggle.setAttribute("aria-pressed", String(paused));
    motionToggle.setAttribute("aria-label", reducedMotion.matches ? "Motion reduced by your device settings" : userPaused ? "Resume decorative motion" : "Pause decorative motion");
    document.getElementById("motion-icon").setAttribute("d", paused ? "m8 5 10 7-10 7Z" : "M9 5v14m6-14v14");
    motionToggle.title = motionToggle.getAttribute("aria-label");
    motionToggle.disabled = reducedMotion.matches || !context;
    if (paused) resetParallax();
    drawAscii();
    if (context && !paused && inView && !document.hidden) frame = requestAnimationFrame(animateAscii);
    placePlayback?.sync();
  };
  motionToggle.addEventListener("click", () => {
    userPaused = !userPaused;
    if (userPaused && animation) animation.finish();
    syncMotion();
  });
  document.addEventListener("visibilitychange", syncMotion);
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncMotion(); }, { threshold: 0 }).observe(shell);
  new ResizeObserver(drawAscii).observe(shell);
  if (!context) {
    console.error("Photoso: Canvas 2D is unavailable. Decorative ASCII motion is disabled.");
    canvas.hidden = true;
  }
  syncMotion();
  shell.addEventListener("pointermove", (event) => {
    if (!motionAllowed() || !finePointer.matches || event.pointerType !== "mouse" || dragging || busy) return;
    const rect = shell.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    shell.style.setProperty("--tilt-x", `${-y * 14}deg`);
    shell.style.setProperty("--tilt-y", `${x * 18}deg`);
  });
  shell.addEventListener("pointerleave", resetParallax);
  finePointer.addEventListener("change", resetParallax);

  const setupPlaceReveal = () => {
    const screen = document.getElementById("place-screen");
    const world = document.getElementById("place-world");
    const pin = document.getElementById("place-photo-pin");
    const photos = document.getElementById("place-photos");
    const slides = [...document.querySelectorAll(".place-slide")];
    const play = document.getElementById("place-play");
    const progress = document.getElementById("place-progress");
    const status = document.getElementById("place-status");
    const duration = Number(progress.max);
    const stages = [
      { key: "country", scale: "A whole country", title: "Start with a place." },
      { key: "city", scale: "Your city", title: "Get a little closer." },
      { key: "pin", scale: "That exact spot", title: "There's the memory." },
      { key: "photos", scale: "Your moments", title: "Worth going back for." }
    ];
    let elapsed = 0;
    let playing = false;
    let visible = false;
    let request = 0;
    let previous = null;
    const clamp = value => Math.max(0, Math.min(1, value));
    const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
    const updateButton = () => {
      play.textContent = playing ? "Pause the preview" : elapsed >= duration ? "Replay the place reveal ↗" : elapsed > 0 ? "Resume the preview ↗" : "Play the place reveal ↗";
      play.setAttribute("aria-pressed", String(playing));
    };
    const renderPlace = () => {
      const step = elapsed < 1800 ? 0 : elapsed < 3600 ? 1 : elapsed < 5000 ? 2 : 3;
      const stage = stages[step];
      if (screen.dataset.step !== stage.key) {
        screen.dataset.step = stage.key;
        document.getElementById("place-scale").textContent = stage.scale;
        document.getElementById("place-title").textContent = stage.title;
        status.textContent = `${stage.scale}. ${stage.title} Illustrated preview with sample photos.`;
      }
      const zoom = 1 + ease(elapsed / 4800) * 3;
      world.style.transform = `scale(${zoom})`;
      const drop = ease((elapsed - 3600) / 650);
      pin.style.opacity = String(drop);
      pin.style.transform = `translateY(${(1 - drop) * -40}px) scale(${.7 + drop * .3})`;
      const reveal = ease((elapsed - 5000) / 800);
      photos.style.opacity = reveal > 0 ? "1" : "0";
      photos.style.clipPath = `circle(${reveal * 150}% at 50% 53.33%)`;
      const photoTime = Math.max(0, elapsed - 5800);
      const index = Math.min(slides.length - 1, Math.floor(photoTime / 1734));
      slides.forEach((slide, i) => {
        slide.style.opacity = i === index ? "1" : "0";
        slide.style.transform = motionAllowed() ? `scale(${1.06 - clamp((photoTime % 1734) / 1734) * .06})` : "none";
      });
      progress.value = elapsed;
    };
    const tick = (time) => {
      if (previous !== null) elapsed = Math.min(duration, elapsed + Math.min(time - previous, 100));
      previous = time;
      renderPlace();
      if (elapsed >= duration) {
        playing = false;
        request = 0;
        previous = null;
        status.textContent = "Preview complete. Replay it, or get Photoso to reveal your own places.";
        updateButton();
      } else {
        request = requestAnimationFrame(tick);
      }
    };
    const sync = () => {
      cancelAnimationFrame(request);
      request = 0;
      previous = null;
      if (!motionAllowed()) playing = false;
      updateButton();
      if (playing && visible && !document.hidden) request = requestAnimationFrame(tick);
    };
    play.disabled = false;
    play.addEventListener("click", () => {
      if (!motionAllowed()) {
        elapsed = duration;
        playing = false;
        renderPlace();
        status.textContent = "Motion is off. Showing a static sample memory instead of the animated map.";
      } else {
        if (elapsed >= duration) elapsed = 0;
        playing = !playing;
      }
      sync();
    });
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0 }).observe(screen);
    renderPlace();
    return { sync };
  };
  placePlayback = setupPlaceReveal();

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const selectTab = (selected, focus = false) => {
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !active;
    }
    if (focus) selected.focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
      if (event.key === "Home") next = tabs[0];
      if (event.key === "End") next = tabs.at(-1);
      if (next) { event.preventDefault(); selectTab(next, true); }
    });
  });
  const deviceButtons = [...document.querySelectorAll(".device-picker button")];
  deviceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const device = button.dataset.device;
      document.getElementById("gallery-layout").dataset.device = device;
      deviceButtons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      document.querySelectorAll(".gallery-panel img").forEach((image) => {
        image.src = image.dataset[device];
        const sizes = { phone: [560, 1213], duo: [960, 675], ipad: [720, 960] };
        [image.width, image.height] = sizes[device];
      });
      const pockets = document.querySelector("#panel-pockets img");
      pockets.alt = device === "phone" ? "Photoso library with related photos grouped into Pockets" : `Photoso library on ${button.textContent}`;
      document.querySelector("#panel-pockets figcaption").textContent = device === "phone"
        ? "Your related shots, together."
        : "Library view. Switch to iPhone for Pocket detail.";
      document.getElementById("device-status").textContent = `Showing the ${button.textContent} app screenshots.`;
    });
  });

  const samples = [
    { src: "assets/camera-concert.jpg", alt: "A view from a concert crowd, with hands raised into the stage lights", title: "The part you remember." },
    { src: "assets/camera-pizza.jpg", alt: "Hands reaching for pizza around a busy dinner table", title: "Just one more slice." },
    { src: "assets/camera-dog.jpg", alt: "A golden retriever stretched out on a green sofa at home", title: "The actual main character." }
  ];
  const stage = document.getElementById("photo-stage");
  const card = document.getElementById("photo-card");
  const image = document.getElementById("demo-image");
  const stamp = document.getElementById("photo-stamp");
  const complete = document.getElementById("demo-complete");
  const keep = document.getElementById("keep-button");
  const bin = document.getElementById("bin-button");
  const undo = document.getElementById("undo-button");
  const status = document.getElementById("demo-status");
  const decisions = [];
  let busy = false;
  let dragging = null;
  let animation = null;
  const resetTransform = () => { card.style.transform = ""; stamp.style.opacity = "0"; };
  const render = () => {
    const done = decisions.length === samples.length;
    const sample = samples[decisions.length];
    card.hidden = done;
    complete.hidden = !done;
    document.getElementById("demo-position").textContent =
      `${String(Math.min(decisions.length + 1, samples.length)).padStart(2, "0")} / 03`;
    keep.disabled = bin.disabled = done || busy;
    undo.disabled = decisions.length === 0 || busy;
    if (done) {
      const kept = decisions.filter(d => d === "keep").length;
      document.getElementById("demo-summary").textContent =
        `${kept} kept. ${samples.length - kept} in the demo bin. Your real photos haven't been touched.`;
    } else {
      image.src = sample.src;
      image.alt = sample.alt;
      document.getElementById("photo-title").textContent = sample.title;
      card.classList.remove("arriving");
      requestAnimationFrame(() => { if (!card.hidden) card.classList.add("arriving"); });
    }
    resetTransform();
  };
  const decide = async (choice) => {
    if (busy || decisions.length >= samples.length) return;
    const activeControl = document.activeElement;
    busy = true;
    keep.setAttribute("aria-disabled", "true");
    bin.setAttribute("aria-disabled", "true");
    undo.disabled = true;
    stamp.textContent = choice === "keep" ? "KEEP" : "BIN";
    stamp.style.opacity = "1";
    if (motionAllowed()) {
      animation = card.animate(
        [{ transform: card.style.transform || "rotate(-4deg)", opacity: 1 },
         { transform: `translateX(${choice === "keep" ? 280 : -280}px) rotate(${choice === "keep" ? 24 : -24}deg) scale(.8)`, opacity: 0 }],
        { duration: 230, easing: "ease-in" }
      );
      await animation.finished;
      animation = null;
    }
    decisions.push(choice);
    busy = false;
    keep.removeAttribute("aria-disabled");
    bin.removeAttribute("aria-disabled");
    render();
    const count = decisions.length;
    if (count === samples.length && (activeControl === keep || activeControl === bin)) {
      complete.querySelector("a").focus({ preventScroll: true });
    }
    status.textContent = count === samples.length
      ? "Sample complete. Your own camera roll is next. Undo or play again any time."
      : `${choice === "keep" ? "Kept" : "Moved to the demo bin"}. ${samples.length - count} sample ${samples.length - count === 1 ? "photo" : "photos"} to go.`;
  };
  keep.addEventListener("click", () => decide("keep"));
  bin.addEventListener("click", () => decide("bin"));
  undo.addEventListener("click", () => {
    if (busy || !decisions.length) return;
    decisions.pop();
    render();
    status.textContent = "Last decision undone. Give that sample another look.";
    if (document.activeElement === undo && undo.disabled) stage.focus({ preventScroll: true });
  });
  document.getElementById("demo-reset").addEventListener("click", () => {
    decisions.length = 0;
    render();
    status.textContent = "A fresh sample stack. Drag a photo or tap a button.";
    stage.focus({ preventScroll: true });
  });
  stage.addEventListener("keydown", (event) => {
    if (event.target !== stage) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      decide(event.key === "ArrowRight" ? "keep" : "bin");
    }
  });
  card.addEventListener("pointerdown", (event) => {
    if (busy || dragging || event.button !== 0 || !event.isPrimary) return;
    dragging = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, dy: 0 };
    card.classList.remove("arriving");
    resetParallax();
    card.setPointerCapture(event.pointerId);
  });
  card.addEventListener("pointermove", (event) => {
    if (!dragging || dragging.id !== event.pointerId) return;
    dragging.dx = event.clientX - dragging.x;
    dragging.dy = event.clientY - dragging.y;
    const dx = dragging.dx;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 14 - 4}deg)`;
    stamp.textContent = dx > 0 ? "KEEP" : "BIN";
    stamp.style.opacity = String(Math.min(Math.abs(dx) / 70, 1));
  });
  const release = (event) => {
    if (!dragging || dragging.id !== event.pointerId) return;
    const { dx, dy } = dragging;
    dragging = null;
    if (card.hasPointerCapture(event.pointerId)) card.releasePointerCapture(event.pointerId);
    if (Math.abs(dx) >= 70 && Math.abs(dx) > Math.abs(dy)) decide(dx > 0 ? "keep" : "bin");
    else resetTransform();
  };
  card.addEventListener("pointerup", release);
  card.addEventListener("pointercancel", () => { dragging = null; resetTransform(); });
  card.addEventListener("lostpointercapture", () => { if (dragging) { dragging = null; resetTransform(); } });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches && animation) animation.finish();
    syncMotion();
  });
})();
