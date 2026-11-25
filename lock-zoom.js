// Kunci zoom di HP untuk semua halaman game.
// Safari iOS mengabaikan "user-scalable=no", jadi zoom harus ditahan lewat CSS dan event sentuh.
// Pasang di <head>, setelah <meta name="viewport"> dan sebelum CSS halaman.
(() => {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    const rules = viewport.content.split(",").map((rule) => rule.trim())
      .filter((rule) => rule && !/^(maximum-scale|user-scalable)\s*=/.test(rule));
    viewport.content = [...rules, "maximum-scale=1", "user-scalable=no"].join(", ");
  }

  // :where() berbobot nol, jadi aturan touch-action milik game tetap menang.
  const style = document.createElement("style");
  style.textContent = `
    :where(html) { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
    :where(html, body, body *) { touch-action: manipulation; }
    @media (pointer: coarse) {
      :where(html, body) { overscroll-behavior: none; -webkit-tap-highlight-color: transparent; }
      :where(body, body *) { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
      :where(input, textarea, [data-selectable], [data-selectable] *) { -webkit-user-select: text; user-select: text; -webkit-touch-callout: default; }
      /* Safari nge-zoom otomatis saat fokus ke kolom dengan huruf di bawah 16px. */
      input, textarea, select { font-size: 16px !important; }
    }`;
  document.head.appendChild(style);

  const block = (event) => { if (event.cancelable) event.preventDefault(); };

  // Cubit dua jari (event khusus Safari).
  for (const type of ["gesturestart", "gesturechange", "gestureend"]) document.addEventListener(type, block, { passive: false });
  // Hanya menahan zoom; event sentuh untuk joystick + tombol tetap sampai ke game.
  document.addEventListener("touchmove", (event) => { if (event.touches.length > 1) block(event); }, { passive: false });

  // Ketuk dua kali: ketukan cepat kedua dibatalkan, lalu klik-nya dikirim ulang
  // supaya menekan tombol berkali-kali tetap terbaca.
  const TAP_GAP = 350; // ms antar ketukan
  const TAP_RADIUS = 45; // px
  let start = null;
  let last = null;

  document.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    // Kalau game sudah memanggil preventDefault, browser memang tidak akan membuat klik.
    start = event.touches.length === 1
      ? { x: touch.clientX, y: touch.clientY, time: event.timeStamp, handled: event.defaultPrevented }
      : null;
  }, { passive: true });

  document.addEventListener("touchend", (event) => {
    const begin = start;
    start = null;
    if (!begin || event.touches.length) return;
    const touch = event.changedTouches[0];
    const isTap = event.timeStamp - begin.time < 500 && Math.hypot(touch.clientX - begin.x, touch.clientY - begin.y) < 12;
    if (!isTap) { last = null; return; }

    const previous = last;
    last = { x: touch.clientX, y: touch.clientY, time: event.timeStamp };
    if (!previous || last.time - previous.time > TAP_GAP) return;
    if (Math.hypot(last.x - previous.x, last.y - previous.y) > TAP_RADIUS) return;

    const target = event.target;
    // Kolom isian dibiarkan supaya keyboard dan kursor tetap normal.
    if (begin.handled || event.defaultPrevented || !event.cancelable || target.closest?.("input, textarea, select, label")) return;
    event.preventDefault();
    target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window, clientX: touch.clientX, clientY: touch.clientY }));
  }, { passive: false });

  document.addEventListener("dblclick", block, { passive: false });
})();
