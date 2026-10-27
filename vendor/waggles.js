(function () {
  "use strict";

  var canvas = document.getElementById("canvas");
  var toggle = document.getElementById("toggle");
  var panel = document.getElementById("panel");
  var whereEl = document.getElementById("where");
  var blurbEl = document.getElementById("blurb");
  var jumps = document.getElementById("jumps");
  var ctx = canvas.getContext("2d");

  var WORLDS = [
    { name: "Waggle pond", blurb: "Drag the water. The school waggles toward your finger.", tone: 466 },
    { name: "Lantern orchard", blurb: "Tap a lantern, or drag a breeze through the trees.", tone: 392 },
    { name: "Cloud terrace", blurb: "Drag to drift across the floating shelves.", tone: 554 },
    { name: "Glass tide", blurb: "Touch the glass. Ripples shove the beads.", tone: 311 }
  ];

  var FISH = [
    { ph: 0.2, len: 28, col: "#f4d7b0", ax: 0.34, ay: 0.62, amp: 0.16 },
    { ph: 1.1, len: 22, col: "#ef8b62", ax: 0.48, ay: 0.70, amp: 0.13 },
    { ph: 2.0, len: 34, col: "#f2c14e", ax: 0.58, ay: 0.60, amp: 0.15 },
    { ph: 2.7, len: 20, col: "#f7efe4", ax: 0.28, ay: 0.74, amp: 0.11 },
    { ph: 3.4, len: 26, col: "#e97858", ax: 0.66, ay: 0.72, amp: 0.14 },
    { ph: 4.2, len: 18, col: "#f4d7b0", ax: 0.42, ay: 0.78, amp: 0.10 },
    { ph: 5.0, len: 30, col: "#f0a45c", ax: 0.52, ay: 0.66, amp: 0.17 },
    { ph: 5.6, len: 16, col: "#ffe7c4", ax: 0.22, ay: 0.64, amp: 0.09 },
    { ph: 6.3, len: 24, col: "#ef8b62", ax: 0.72, ay: 0.64, amp: 0.12 },
    { ph: 0.8, len: 21, col: "#f2c14e", ax: 0.38, ay: 0.84, amp: 0.08 },
    { ph: 1.8, len: 27, col: "#f7efe4", ax: 0.60, ay: 0.80, amp: 0.12 },
    { ph: 3.1, len: 19, col: "#e97858", ax: 0.46, ay: 0.58, amp: 0.10 }
  ];

  var PADS = [
    { x: 0.26, y: 0.60, rx: 0.09, ry: 0.045, rot: -0.4, bloom: "#f4b4c4" },
    { x: 0.58, y: 0.67, rx: 0.11, ry: 0.05, rot: 0.3, bloom: "#fff1d6" },
    { x: 0.40, y: 0.78, rx: 0.08, ry: 0.04, rot: 0.8, bloom: "" },
    { x: 0.74, y: 0.74, rx: 0.07, ry: 0.036, rot: -0.6, bloom: "#f7c6d4" },
    { x: 0.18, y: 0.72, rx: 0.06, ry: 0.03, rot: 0.2, bloom: "" }
  ];

  var TREES = [
    { x: 0.16, y: 0.50, s: 0.20 },
    { x: 0.38, y: 0.46, s: 0.24 },
    { x: 0.62, y: 0.50, s: 0.22 },
    { x: 0.84, y: 0.52, s: 0.18 }
  ];
  var LANTERNS = [
    { tree: 0, ox: -0.03, drop: 0.07, kick: 0 },
    { tree: 1, ox: 0.02, drop: 0.09, kick: 0 },
    { tree: 1, ox: -0.06, drop: 0.06, kick: 0 },
    { tree: 2, ox: 0.03, drop: 0.08, kick: 0 },
    { tree: 2, ox: -0.04, drop: 0.05, kick: 0 },
    { tree: 3, ox: 0.0, drop: 0.07, kick: 0 },
    { tree: 0, ox: 0.05, drop: 0.05, kick: 0 }
  ];

  var ISLES = [
    { x: 0.30, y: 0.30, s: 0.95, d: 0.35 },
    { x: 0.72, y: 0.42, s: 1.15, d: 0.62 },
    { x: 0.28, y: 0.60, s: 1.05, d: 0.85 },
    { x: 0.70, y: 0.76, s: 0.9, d: 1 }
  ];

  var JEWELS = ["#7ee0d0", "#f0c14e", "#f08aa0", "#b9a6f2", "#8fd0ff", "#f3a35c"];
  var BEADS = [];
  var STARS = [];
  var PETALS = [];

  function mulberry(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var starRnd = mulberry(7);
  var i;
  for (i = 0; i < 42; i++) {
    STARS.push({ x: starRnd(), y: starRnd() * 0.52, r: 0.5 + starRnd() * 1.4, tw: starRnd() * 6.28 });
  }
  var petalRnd = mulberry(3);
  for (i = 0; i < 16; i++) {
    PETALS.push({
      x: petalRnd(),
      y: petalRnd(),
      s: 2 + petalRnd() * 3.2,
      sp: 0.018 + petalRnd() * 0.028,
      ph: petalRnd() * 6.28,
      c: petalRnd() > 0.45 ? "#f3c1c8" : "#f7efe4"
    });
  }
  for (var r = 0; r < 5; r++) {
    for (var c = 0; c < 4; c++) {
      BEADS.push({
        x: 0.16 + c * 0.2 + (r % 2) * 0.09,
        y: 0.16 + r * 0.15,
        rad: 0.042 + ((r + c) % 3) * 0.008,
        col: JEWELS[(r * 4 + c) % JEWELS.length],
        ph: r * 1.3 + c * 0.7
      });
    }
  }

  var world = 0;
  var slide = 0;
  var anim = null;
  var cssW = 0;
  var cssH = 0;
  var dpr = 1;
  var sim = 0;
  var prevStamp = 0;
  var readySent = false;
  var ptr = null;
  var wind = 0;
  var viewX = 0;
  var viewY = 0;
  var kiteBoost = 0;
  var pulse = null;
  var ripples = [];
  var actx = null;

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function shield(el) {
    var evs = ["pointerdown", "pointermove", "pointerup", "touchstart", "touchmove", "touchend", "mousedown", "click"];
    for (var n = 0; n < evs.length; n++) {
      el.addEventListener(evs[n], function (e) { e.stopPropagation(); });
    }
  }

  function tone(freq) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      if (!actx) actx = new AC();
      if (actx.state === "suspended") actx.resume();
      var t = actx.currentTime;
      var o = actx.createOscillator();
      var g = actx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.04, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g);
      g.connect(actx.destination);
      o.start(t);
      o.stop(t + 0.32);
    } catch (err) {}
  }

  function syncUi() {
    var info = WORLDS[world];
    whereEl.textContent = info.name;
    blurbEl.textContent = info.blurb;
    var buttons = jumps.querySelectorAll("button");
    for (var n = 0; n < buttons.length; n++) {
      buttons[n].classList.toggle("on", n === world);
    }
  }

  function buildJumps() {
    for (var n = 0; n < WORLDS.length; n++) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = WORLDS[n].name;
      b.setAttribute("data-i", String(n));
      jumps.appendChild(b);
    }
    syncUi();
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    cssW = rect.width || window.innerWidth || 390;
    cssH = rect.height || window.innerHeight || 844;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pw = Math.round(cssW * dpr);
    var ph = Math.round(cssH * dpr);
    if (pw < 2) pw = 2;
    if (ph < 2) ph = 2;
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  function pingReady() {
    if (readySent) return;
    var box = window.__gbSandbox;
    if (box && typeof box.ready === "function") {
      readySent = true;
      box.ready();
    }
  }

  function localPoint(e) {
    var rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function attractor(index) {
    if (ptr && ptr.mode === "play" && world === index) return { x: ptr.x, y: ptr.y };
    if (pulse && pulse.world === index && sim - pulse.t < 0.55) return { x: pulse.x, y: pulse.y };
    return null;
  }

  function addRipple(x, y) {
    ripples.push({ x: x, y: y, t: sim, w: world });
    if (ripples.length > 10) ripples.shift();
  }

  function finishAnim() {
    if (!anim) return;
    if (anim.kind === "go") world = anim.next;
    slide = 0;
    anim = null;
    syncUi();
  }

  function commit(dir) {
    var next = (world + dir + WORLDS.length) % WORLDS.length;
    anim = {
      t0: performance.now(),
      dur: 280,
      from: slide,
      to: dir > 0 ? -1 : 1,
      next: next,
      kind: "go"
    };
    tone(WORLDS[next].tone);
  }

  function springBack() {
    anim = { t0: performance.now(), dur: 200, from: slide, to: 0, next: world, kind: "back" };
  }

  function lanternSpot(lan, w, h) {
    var tree = TREES[lan.tree];
    var s = h * tree.s;
    return {
      x: tree.x * w + lan.ox * w,
      hang: tree.y * h - s * 0.06,
      drop: s * (0.22 + lan.drop * 1.4)
    };
  }

  function nearestLantern(x, y, w, h) {
    var best = null;
    var bestD = 78;
    for (var n = 0; n < LANTERNS.length; n++) {
      var spot = lanternSpot(LANTERNS[n], w, h);
      var d = Math.hypot(x - spot.x, y - (spot.hang + spot.drop));
      if (d < bestD) {
        bestD = d;
        best = LANTERNS[n];
      }
    }
    return best;
  }

  function tapAt(x, y) {
    pulse = { x: x, y: y, t: sim, world: world };
    tone(WORLDS[world].tone);
    if (world === 0 || world === 3) addRipple(x, y);
    if (world === 1) {
      var lan = nearestLantern(x, y, cssW, cssH);
      if (lan) lan.kick = 0.85;
      else wind = 0.42;
    }
    if (world === 2) kiteBoost = 1;
  }

  function puff(ctx2, x, y, s, alpha) {
    ctx2.fillStyle = "rgba(255, 236, 220, " + alpha + ")";
    ctx2.beginPath();
    ctx2.ellipse(x, y, s, s * 0.42, 0, 0, 6.2832);
    ctx2.ellipse(x - s * 0.46, y + s * 0.08, s * 0.62, s * 0.32, 0, 0, 6.2832);
    ctx2.ellipse(x + s * 0.5, y + s * 0.1, s * 0.55, s * 0.28, 0, 0, 6.2832);
    ctx2.fill();
  }

  function bird(ctx2, x, y, s, flap) {
    ctx2.strokeStyle = "rgba(36, 22, 24, 0.72)";
    ctx2.lineWidth = 1.4;
    ctx2.lineCap = "round";
    ctx2.beginPath();
    ctx2.moveTo(x - s, y);
    ctx2.quadraticCurveTo(x - s * 0.45, y - flap, x, y);
    ctx2.quadraticCurveTo(x + s * 0.45, y - flap, x + s, y);
    ctx2.stroke();
  }

  function vignette(ctx2, w, h) {
    var u = Math.min(w, h);
    var vg = ctx2.createRadialGradient(w * 0.5, h * 0.45, u * 0.2, w * 0.5, h * 0.5, u * 0.95);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.26)");
    ctx2.fillStyle = vg;
    ctx2.fillRect(0, 0, w, h);
  }

  function drawFish(ctx2, x, y, ang, len, color) {
    ctx2.save();
    ctx2.translate(x, y);
    ctx2.rotate(ang);
    ctx2.fillStyle = color;
    ctx2.beginPath();
    ctx2.moveTo(len * 0.55, 0);
    ctx2.bezierCurveTo(len * 0.12, len * 0.28, -len * 0.22, len * 0.18, -len * 0.4, 0);
    ctx2.bezierCurveTo(-len * 0.22, -len * 0.18, len * 0.12, -len * 0.28, len * 0.55, 0);
    ctx2.fill();
    ctx2.beginPath();
    ctx2.moveTo(-len * 0.32, 0);
    ctx2.lineTo(-len * 0.66, len * 0.2);
    ctx2.lineTo(-len * 0.48, 0);
    ctx2.lineTo(-len * 0.66, -len * 0.2);
    ctx2.closePath();
    ctx2.fill();
    ctx2.fillStyle = "rgba(255,255,255,0.5)";
    ctx2.beginPath();
    ctx2.ellipse(len * 0.1, -len * 0.05, len * 0.12, len * 0.045, 0, 0, 6.2832);
    ctx2.fill();
    ctx2.fillStyle = "#24160f";
    ctx2.beginPath();
    ctx2.arc(len * 0.3, -len * 0.02, Math.max(1.1, len * 0.045), 0, 6.2832);
    ctx2.fill();
    ctx2.restore();
  }

  function drawPad(ctx2, x, y, rx, ry, rot, bloom) {
    ctx2.save();
    ctx2.translate(x, y);
    ctx2.rotate(rot);
    ctx2.fillStyle = "#1c6b48";
    ctx2.beginPath();
    ctx2.ellipse(0, 0, rx, ry, 0, 0.45, 5.9);
    ctx2.fill();
    ctx2.strokeStyle = "rgba(10, 50, 32, 0.55)";
    ctx2.lineWidth = 1;
    ctx2.beginPath();
    ctx2.moveTo(-rx * 0.1, 0);
    ctx2.lineTo(rx * 0.72, ry * 0.05);
    ctx2.moveTo(0, 0);
    ctx2.lineTo(-rx * 0.2, -ry * 0.7);
    ctx2.stroke();
    if (bloom) {
      ctx2.fillStyle = bloom;
      ctx2.beginPath();
      ctx2.arc(rx * 0.15, -ry * 0.1, rx * 0.22, 0, 6.2832);
      ctx2.fill();
      ctx2.fillStyle = "#fff8ea";
      ctx2.beginPath();
      ctx2.arc(rx * 0.15, -ry * 0.1, rx * 0.08, 0, 6.2832);
      ctx2.fill();
    }
    ctx2.restore();
  }

  function drawReeds(ctx2, x, y0, time, side) {
    ctx2.strokeStyle = "#143528";
    ctx2.lineCap = "round";
    ctx2.lineWidth = 2;
    for (var n = 0; n < 7; n++) {
      var xx = x + n * 7 * side;
      var sway = Math.sin(time * 1.5 + n) * 7;
      ctx2.beginPath();
      ctx2.moveTo(xx, y0 + 28);
      ctx2.quadraticCurveTo(xx + sway, y0 - 16, xx + sway * 1.5, y0 - 48 - n * 5);
      ctx2.stroke();
    }
  }

  function drawRipples(ctx2, index, flat) {
    for (var n = 0; n < ripples.length; n++) {
      var rip = ripples[n];
      if (rip.w !== index) continue;
      var age = sim - rip.t;
      if (age < 0 || age > 1.5) continue;
      ctx2.globalAlpha = (1 - age / 1.5) * 0.55;
      ctx2.strokeStyle = "#f4fbff";
      ctx2.lineWidth = 1.4;
      ctx2.beginPath();
      if (flat) ctx2.arc(rip.x, rip.y, age * 90, 0, 6.2832);
      else ctx2.ellipse(rip.x, rip.y, age * 78, age * 26, 0, 0, 6.2832);
      ctx2.stroke();
      ctx2.globalAlpha = 1;
    }
  }

  function drawPond(ctx2, w, h, time, at) {
    var g = ctx2.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#1b2744");
    g.addColorStop(0.26, "#6d3d58");
    g.addColorStop(0.44, "#e39255");
    g.addColorStop(0.5, "#17656c");
    g.addColorStop(1, "#071c22");
    ctx2.fillStyle = g;
    ctx2.fillRect(0, 0, w, h);

    var sx = w * 0.74;
    var sy = h * 0.3;
    var sr = Math.min(w, h) * 0.085;
    var sg = ctx2.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 3.4);
    sg.addColorStop(0, "rgba(255, 236, 196, 0.95)");
    sg.addColorStop(0.22, "rgba(255, 170, 90, 0.4)");
    sg.addColorStop(1, "rgba(255, 170, 90, 0)");
    ctx2.fillStyle = sg;
    ctx2.beginPath();
    ctx2.arc(sx, sy, sr * 3.4, 0, 6.2832);
    ctx2.fill();
    ctx2.fillStyle = "#ffe6c0";
    ctx2.beginPath();
    ctx2.arc(sx, sy, sr, 0, 6.2832);
    ctx2.fill();

    puff(ctx2, w * 0.22 + Math.sin(time * 0.15) * 8, h * 0.15, w * 0.13, 0.55);
    puff(ctx2, w * 0.46 + Math.sin(time * 0.12 + 1) * 10, h * 0.1, w * 0.09, 0.4);

    ctx2.fillStyle = "#2c3a52";
    ctx2.beginPath();
    ctx2.moveTo(0, h * 0.5);
    ctx2.quadraticCurveTo(w * 0.2, h * 0.38, w * 0.4, h * 0.48);
    ctx2.quadraticCurveTo(w * 0.62, h * 0.58, w * 0.8, h * 0.42);
    ctx2.quadraticCurveTo(w * 0.92, h * 0.34, w, h * 0.46);
    ctx2.lineTo(w, h * 0.56);
    ctx2.lineTo(0, h * 0.56);
    ctx2.fill();

    var water = ctx2.createLinearGradient(0, h * 0.47, 0, h);
    water.addColorStop(0, "#1a7480");
    water.addColorStop(0.35, "#0e4c56");
    water.addColorStop(1, "#062026");
    ctx2.fillStyle = water;
    ctx2.fillRect(0, h * 0.47, w, h);

    ctx2.strokeStyle = "rgba(255, 228, 196, 0.55)";
    ctx2.lineWidth = 1.6;
    ctx2.beginPath();
    ctx2.moveTo(0, h * 0.478);
    ctx2.bezierCurveTo(w * 0.3, h * 0.468, w * 0.6, h * 0.49, w, h * 0.474);
    ctx2.stroke();

    ctx2.fillStyle = "rgba(255, 196, 120, 0.16)";
    ctx2.beginPath();
    ctx2.ellipse(sx, h * 0.66, sr * 0.7, h * 0.14, 0, 0, 6.2832);
    ctx2.fill();

    ctx2.strokeStyle = "rgba(190, 236, 224, 0.16)";
    ctx2.lineWidth = 1.4;
    for (var n = 0; n < 6; n++) {
      var y = h * (0.56 + n * 0.06);
      ctx2.beginPath();
      for (var x = 0; x <= w; x += 14) {
        var yy = y + Math.sin(x * 0.02 + time * 1.3 + n) * 2.6;
        if (x === 0) ctx2.moveTo(x, yy);
        else ctx2.lineTo(x, yy);
      }
      ctx2.stroke();
    }

    drawReeds(ctx2, w * 0.06, h * 0.46, time, 1);
    drawReeds(ctx2, w * 0.9, h * 0.45, time, -1);

    var u = Math.min(w, h);
    for (n = 0; n < PADS.length; n++) {
      var pad = PADS[n];
      drawPad(ctx2, pad.x * w, pad.y * h, pad.rx * w, pad.ry * h, pad.rot + Math.sin(time * 0.6 + n) * 0.04, pad.bloom);
    }

    drawRipples(ctx2, 0, false);

    for (n = 0; n < FISH.length; n++) {
      var f = FISH[n];
      var p = f.ph + time * 0.72;
      var x = w * (f.ax + Math.sin(p) * f.amp);
      var y = h * (f.ay + Math.sin(p * 2) * f.amp * 0.42);
      var vx = Math.cos(p) * f.amp * w;
      var vy = Math.cos(p * 2) * f.amp * 0.42 * h;
      var ang = Math.atan2(vy, vx);
      if (at) {
        x = x + (at.x - x) * 0.72;
        y = y + (at.y - y) * 0.72;
        ang = Math.atan2(at.y - y, at.x - x);
      }
      var wob = Math.sin(time * 11 + f.ph * 5) * 0.45;
      ang += wob;
      var len = f.len * (u / 390);
      var ox = Math.cos(ang + 1.5708) * Math.sin(time * 12 + f.ph * 4) * len * 0.18;
      var oy = Math.sin(ang + 1.5708) * Math.sin(time * 12 + f.ph * 4) * len * 0.18;
      drawFish(ctx2, x + ox, y + oy, ang, len, f.col);
    }

    var flap = 4 + Math.sin(time * 6) * 3;
    bird(ctx2, w * 0.18 + time * 8 % (w * 0.3), h * 0.22, 9, flap);
    bird(ctx2, w * 0.3 + (time * 6) % (w * 0.25), h * 0.18, 6, flap * 0.8);

    vignette(ctx2, w, h);
  }

  function drawTree(ctx2, x, y, s) {
    ctx2.fillStyle = "#1a120c";
    ctx2.fillRect(x - s * 0.06, y, s * 0.12, s * 0.55);
    ctx2.fillStyle = "#163628";
    ctx2.beginPath();
    ctx2.arc(x, y, s * 0.42, 0, 6.2832);
    ctx2.arc(x - s * 0.28, y + s * 0.08, s * 0.32, 0, 6.2832);
    ctx2.arc(x + s * 0.3, y + s * 0.06, s * 0.3, 0, 6.2832);
    ctx2.fill();
    ctx2.fillStyle = "#1f4a34";
    ctx2.beginPath();
    ctx2.arc(x - s * 0.08, y - s * 0.12, s * 0.24, 0, 6.2832);
    ctx2.fill();
  }

  function drawLantern(ctx2, x, hangY, drop, swing, hot, u) {
    ctx2.save();
    ctx2.translate(x, hangY);
    ctx2.rotate(swing);
    ctx2.strokeStyle = "rgba(255, 214, 160, 0.75)";
    ctx2.lineWidth = 1;
    ctx2.beginPath();
    ctx2.moveTo(0, 0);
    ctx2.lineTo(0, drop);
    ctx2.stroke();
    var glow = ctx2.createRadialGradient(0, drop, 2, 0, drop, u * 0.12 + hot * 20);
    glow.addColorStop(0, "rgba(255, 186, 90, " + (0.55 + hot * 0.35) + ")");
    glow.addColorStop(1, "rgba(255, 140, 40, 0)");
    ctx2.fillStyle = glow;
    ctx2.beginPath();
    ctx2.arc(0, drop, u * 0.12 + hot * 20, 0, 6.2832);
    ctx2.fill();
    ctx2.fillStyle = hot > 0.2 ? "#ffe1a8" : "#f0a04a";
    var bw = u * 0.028;
    var bh = u * 0.04;
    ctx2.beginPath();
    ctx2.moveTo(-bw, drop - bh * 0.2);
    ctx2.lineTo(-bw * 0.7, drop + bh);
    ctx2.lineTo(bw * 0.7, drop + bh);
    ctx2.lineTo(bw, drop - bh * 0.2);
    ctx2.closePath();
    ctx2.fill();
    ctx2.fillStyle = "rgba(255,255,255,0.35)";
    ctx2.fillRect(-bw * 0.15, drop - bh * 0.05, bw * 0.18, bh * 0.7);
    ctx2.restore();
  }

  function drawOrchard(ctx2, w, h, time, at) {
    var g = ctx2.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0c1430");
    g.addColorStop(0.45, "#1a2748");
    g.addColorStop(1, "#10180f");
    ctx2.fillStyle = g;
    ctx2.fillRect(0, 0, w, h);

    var mx = w * 0.78;
    var my = h * 0.16;
    var mr = Math.min(w, h) * 0.07;
    var mg = ctx2.createRadialGradient(mx, my, mr * 0.2, mx, my, mr * 3);
    mg.addColorStop(0, "rgba(230, 236, 255, 0.9)");
    mg.addColorStop(0.3, "rgba(180, 198, 240, 0.25)");
    mg.addColorStop(1, "rgba(180, 198, 240, 0)");
    ctx2.fillStyle = mg;
    ctx2.beginPath();
    ctx2.arc(mx, my, mr * 3, 0, 6.2832);
    ctx2.fill();
    ctx2.fillStyle = "#f4f7ff";
    ctx2.beginPath();
    ctx2.arc(mx, my, mr, 0, 6.2832);
    ctx2.fill();

    for (var n = 0; n < STARS.length; n++) {
      var s = STARS[n];
      var tw = 0.35 + Math.sin(time * 2 + s.tw) * 0.35;
      ctx2.globalAlpha = 0.35 + tw * 0.65;
      ctx2.fillStyle = "#f7fbff";
      ctx2.beginPath();
      ctx2.arc(s.x * w, s.y * h, s.r, 0, 6.2832);
      ctx2.fill();
    }
    ctx2.globalAlpha = 1;

    ctx2.fillStyle = "#121c12";
    ctx2.beginPath();
    ctx2.moveTo(0, h * 0.62);
    ctx2.quadraticCurveTo(w * 0.25, h * 0.56, w * 0.5, h * 0.62);
    ctx2.quadraticCurveTo(w * 0.75, h * 0.68, w, h * 0.58);
    ctx2.lineTo(w, h);
    ctx2.lineTo(0, h);
    ctx2.fill();
    ctx2.fillStyle = "#1c2a16";
    ctx2.beginPath();
    ctx2.moveTo(w * 0.42, h * 0.64);
    ctx2.quadraticCurveTo(w * 0.5, h * 0.9, w * 0.58, h);
    ctx2.lineTo(w * 0.38, h);
    ctx2.quadraticCurveTo(w * 0.4, h * 0.82, w * 0.42, h * 0.64);
    ctx2.fill();

    var u = Math.min(w, h);
    for (n = 0; n < TREES.length; n++) {
      var tree = TREES[n];
      drawTree(ctx2, tree.x * w, tree.y * h, h * tree.s);
    }

    var breeze = wind;
    if (at) breeze += clamp((at.x - w * 0.5) / w, -0.4, 0.4);
    for (n = 0; n < LANTERNS.length; n++) {
      var lan = LANTERNS[n];
      var spot = lanternSpot(lan, w, h);
      var swing = Math.sin(time * 1.7 + n) * 0.08 + breeze * 0.45 + lan.kick;
      drawLantern(ctx2, spot.x, spot.hang, spot.drop, swing, lan.kick, u);
    }

    for (n = 0; n < PETALS.length; n++) {
      var petal = PETALS[n];
      var py = (petal.y + time * petal.sp) % 1;
      var px = petal.x + Math.sin(time * 0.8 + petal.ph) * 0.04 + breeze * 0.05;
      ctx2.save();
      ctx2.translate(px * w, py * h);
      ctx2.rotate(time + petal.ph);
      ctx2.fillStyle = petal.c;
      ctx2.beginPath();
      ctx2.ellipse(0, 0, petal.s, petal.s * 0.55, 0, 0, 6.2832);
      ctx2.fill();
      ctx2.restore();
    }
    vignette(ctx2, w, h);
  }

  function drawIsle(ctx2, x, y, s) {
    ctx2.fillStyle = "rgba(40, 32, 24, 0.22)";
    ctx2.beginPath();
    ctx2.ellipse(x + 6, y + s * 0.55, s * 1.35, s * 0.28, 0, 0, 6.2832);
    ctx2.fill();
    ctx2.fillStyle = "#8d6b4c";
    ctx2.beginPath();
    ctx2.ellipse(x, y + s * 0.18, s * 1.15, s * 0.42, 0, 0, 6.2832);
    ctx2.fill();
    ctx2.fillStyle = "#6ea35a";
    ctx2.beginPath();
    ctx2.ellipse(x, y, s * 1.22, s * 0.36, 0, 0, 6.2832);
    ctx2.fill();
    ctx2.fillStyle = "#f3e2c4";
    ctx2.fillRect(x - s * 0.22, y - s * 0.55, s * 0.44, s * 0.38);
    ctx2.fillStyle = "#c45b3e";
    ctx2.beginPath();
    ctx2.moveTo(x - s * 0.36, y - s * 0.5);
    ctx2.lineTo(x, y - s * 0.95);
    ctx2.lineTo(x + s * 0.36, y - s * 0.5);
    ctx2.fill();
    ctx2.fillStyle = "#5c3a28";
    ctx2.fillRect(x - s * 0.06, y - s * 0.32, s * 0.12, s * 0.16);
    ctx2.fillStyle = "#2f6d48";
    ctx2.beginPath();
    ctx2.arc(x + s * 0.55, y - s * 0.08, s * 0.22, 0, 6.2832);
    ctx2.fill();
    ctx2.fillStyle = "#3e8a5c";
    ctx2.beginPath();
    ctx2.arc(x - s * 0.62, y - s * 0.02, s * 0.18, 0, 6.2832);
    ctx2.fill();
  }

  function drawFalls(ctx2, x, y0, len, time) {
    var span = Math.max(18, len);
    ctx2.save();
    ctx2.strokeStyle = "rgba(186, 220, 240, 0.62)";
    ctx2.lineWidth = 2.2;
    ctx2.lineCap = "round";
    ctx2.beginPath();
    ctx2.moveTo(x - 3, y0);
    ctx2.quadraticCurveTo(x + 2, y0 + span * 0.5, x - 1, y0 + span);
    ctx2.moveTo(x + 4, y0 + 2);
    ctx2.quadraticCurveTo(x + 8, y0 + span * 0.55, x + 3, y0 + span * 0.92);
    ctx2.stroke();
    for (var k = 0; k < 4; k++) {
      var yy = y0 + ((time * 36 + k * span / 4) % span);
      ctx2.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx2.fillRect(x - 1, yy, 2.2, 5);
    }
    ctx2.fillStyle = "rgba(220, 238, 255, 0.32)";
    ctx2.beginPath();
    ctx2.ellipse(x + 1, y0 + span + 2, 12, 4.5, 0, 0, 6.2832);
    ctx2.fill();
    ctx2.restore();
  }

  function drawKite(ctx2, x, y, s, rot) {
    ctx2.save();
    ctx2.translate(x, y);
    ctx2.rotate(rot);
    ctx2.fillStyle = "#e25b4a";
    ctx2.beginPath();
    ctx2.moveTo(0, -s);
    ctx2.lineTo(s * 0.55, 0);
    ctx2.lineTo(0, s * 1.15);
    ctx2.lineTo(-s * 0.55, 0);
    ctx2.closePath();
    ctx2.fill();
    ctx2.fillStyle = "#f2d15a";
    ctx2.beginPath();
    ctx2.moveTo(0, -s * 0.15);
    ctx2.lineTo(s * 0.26, 0);
    ctx2.lineTo(0, s * 0.4);
    ctx2.lineTo(-s * 0.26, 0);
    ctx2.closePath();
    ctx2.fill();
    ctx2.restore();
    ctx2.strokeStyle = "rgba(70, 48, 30, 0.4)";
    ctx2.lineWidth = 1;
    ctx2.beginPath();
    ctx2.moveTo(x, y + s * 0.8);
    ctx2.quadraticCurveTo(x + 12, y + s * 2.4, x - 14, y + s * 4);
    ctx2.stroke();
  }

  function drawTerrace(ctx2, w, h, time) {
    var g = ctx2.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#8ec8ea");
    g.addColorStop(0.45, "#f6d7b0");
    g.addColorStop(1, "#f3e6cf");
    ctx2.fillStyle = g;
    ctx2.fillRect(0, 0, w, h);

    var sx = w * 0.78;
    var sy = h * 0.12;
    var sr = Math.min(w, h) * 0.06;
    ctx2.fillStyle = "rgba(255, 244, 210, 0.9)";
    ctx2.beginPath();
    ctx2.arc(sx, sy, sr, 0, 6.2832);
    ctx2.fill();

    puff(ctx2, (w * 0.2 + time * 12 + viewX * 0.2) % (w + 80) - 40, h * 0.16, w * 0.1, 0.7);
    puff(ctx2, (w * 0.55 + time * 8) % (w + 100) - 50, h * 0.22, w * 0.14, 0.55);
    puff(ctx2, (w * 1.1 - time * 10) % (w + 90) - 30, h * 0.34, w * 0.08, 0.45);

    var u = Math.min(w, h);
    for (var n = 0; n < ISLES.length; n++) {
      var isle = ISLES[n];
      var x = isle.x * w + viewX * isle.d;
      var y = isle.y * h + viewY * isle.d * 0.35;
      var s = u * 0.11 * isle.s;
      drawIsle(ctx2, x, y, s);
      drawFalls(ctx2, x + s * 0.46, y + s * 0.22, s * 0.9, time + n * 1.7);
    }

    var lift = kiteBoost * 28;
    for (n = 0; n < 3; n++) {
      var kx = w * (0.18 + n * 0.28) + Math.sin(time * 0.7 + n) * 18 + viewX * 0.3;
      var ky = h * (0.1 + n * 0.04) + Math.sin(time * 1.4 + n * 2) * 12 - lift;
      var rot = Math.sin(time * 1.8 + n) * 0.35;
      drawKite(ctx2, kx, ky, 12 + n * 2, rot);
    }

    var flap = 5 + Math.sin(time * 5) * 3;
    bird(ctx2, w * 0.12 + (time * 18) % (w * 0.5), h * 0.2, 8, flap);
    bird(ctx2, w * 0.4 + (time * 14) % (w * 0.4), h * 0.14, 6, flap * 0.7);
    vignette(ctx2, w, h);
  }

  function beadShift(x, y) {
    var ox = 0;
    var oy = 0;
    for (var n = 0; n < ripples.length; n++) {
      var rip = ripples[n];
      if (rip.w !== 3) continue;
      var age = sim - rip.t;
      if (age < 0 || age > 1.6) continue;
      var reach = age * Math.min(cssW, cssH) * 0.55;
      var dx = x - rip.x;
      var dy = y - rip.y;
      var dist = Math.hypot(dx, dy) || 1;
      var band = Math.abs(dist - reach);
      if (band < 24) {
        var push = (1 - band / 24) * (1 - age / 1.6) * 16;
        ox += (dx / dist) * push;
        oy += (dy / dist) * push;
      }
    }
    return { x: x + ox, y: y + oy };
  }

  function drawTide(ctx2, w, h, time, at) {
    var u = Math.min(w, h);
    var g = ctx2.createRadialGradient(w * 0.5, h * 0.42, u * 0.08, w * 0.5, h * 0.5, u * 1.05);
    g.addColorStop(0, "#1a3c56");
    g.addColorStop(0.42, "#0d182c");
    g.addColorStop(1, "#05070e");
    ctx2.fillStyle = g;
    ctx2.fillRect(0, 0, w, h);

    ctx2.lineWidth = 1.2;
    for (var n = 0; n < 5; n++) {
      ctx2.strokeStyle = "rgba(130, 220, 255, " + (0.06 + n * 0.015) + ")";
      ctx2.beginPath();
      for (var x = 0; x <= w; x += 10) {
        var y = h * (0.18 + n * 0.15) + Math.sin(x * 0.016 + time * 1.1 + n) * 16;
        if (x === 0) ctx2.moveTo(x, y);
        else ctx2.lineTo(x, y);
      }
      ctx2.stroke();
    }

    var cx = w * 0.5;
    var cy = h * 0.48;
    for (n = 0; n < 3; n++) {
      var rr = (time * 36 + n * 70) % (u * 0.85);
      ctx2.strokeStyle = "rgba(170, 230, 255, 0.08)";
      ctx2.beginPath();
      ctx2.arc(cx, cy, rr, 0, 6.2832);
      ctx2.stroke();
    }

    drawRipples(ctx2, 3, true);

    for (n = 0; n < BEADS.length; n++) {
      var bead = BEADS[n];
      var x = bead.x * w;
      var y = bead.y * h + Math.sin(time * 2.1 + bead.ph) * 5;
      if (at) {
        var dx = x - at.x;
        var dy = y - at.y;
        var dist = Math.hypot(dx, dy) || 1;
        var push = Math.max(0, 96 - dist) / 96 * 22;
        x += (dx / dist) * push;
        y += (dy / dist) * push;
      }
      var shifted = beadShift(x, y);
      x = shifted.x;
      y = shifted.y;
      var rad = bead.rad * u;
      ctx2.fillStyle = bead.col;
      ctx2.beginPath();
      ctx2.arc(x, y, rad, 0, 6.2832);
      ctx2.fill();
      ctx2.fillStyle = "rgba(255,255,255,0.55)";
      ctx2.beginPath();
      ctx2.arc(x - rad * 0.28, y - rad * 0.32, rad * 0.26, 0, 6.2832);
      ctx2.fill();
      ctx2.strokeStyle = "rgba(255,255,255,0.62)";
      ctx2.lineWidth = 1.5;
      ctx2.beginPath();
      ctx2.arc(x - rad * 0.08, y - rad * 0.1, rad * 0.62, 3.7, 5.3);
      ctx2.stroke();
    }
    vignette(ctx2, w, h);
  }

  var DRAW = [drawPond, drawOrchard, drawTerrace, drawTide];

  function drawWorld(index, ox) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, 0, cssW + 1, cssH);
    ctx.clip();
    ctx.translate(ox, 0);
    var at = attractor(index);
    if (index === 2) DRAW[index](ctx, cssW, cssH, sim);
    else DRAW[index](ctx, cssW, cssH, sim, at);
    ctx.restore();
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (Math.abs(slide) < 0.004) {
      drawWorld(world, 0);
      return;
    }
    var dir = slide < 0 ? 1 : -1;
    var neighbor = (world + dir + WORLDS.length) % WORLDS.length;
    var off = slide < 0 ? cssW : -cssW;
    drawWorld(world, slide * cssW);
    drawWorld(neighbor, slide * cssW + off);
  }

  function stepAnim(now) {
    if (!anim) return;
    var u = (now - anim.t0) / anim.dur;
    if (u >= 1) {
      finishAnim();
      return;
    }
    var e = u * u * (3 - 2 * u);
    slide = anim.from + (anim.to - anim.from) * e;
  }

  function decay(dt) {
    wind *= Math.exp(-dt * 1.5);
    kiteBoost *= Math.exp(-dt * 2.4);
    for (var n = 0; n < LANTERNS.length; n++) {
      LANTERNS[n].kick *= Math.exp(-dt * 2.6);
    }
    while (ripples.length && sim - ripples[0].t > 1.7) ripples.shift();
  }

  function loop(now) {
    resize();
    if (!prevStamp) prevStamp = now;
    var dt = Math.min(0.05, (now - prevStamp) / 1000);
    prevStamp = now;
    sim += dt;
    decay(dt);
    stepAnim(now);
    if (cssW > 2 && cssH > 2) {
      paint();
      pingReady();
    }
    requestAnimationFrame(loop);
  }

  canvas.addEventListener("pointerdown", function (e) {
    if (e.button) return;
    finishAnim();
    var p = localPoint(e);
    ptr = { id: e.pointerId, x: p.x, y: p.y, sx: p.x, sy: p.y, mode: "play" };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  });

  canvas.addEventListener("pointermove", function (e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    var p = localPoint(e);
    var dx = p.x - ptr.sx;
    var dy = p.y - ptr.sy;
    var mx = p.x - ptr.x;
    var my = p.y - ptr.y;
    if (ptr.mode !== "swipe" && Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      ptr.mode = "swipe";
    }
    if (ptr.mode === "swipe") {
      anim = null;
      slide = clamp(dx / cssW, -1, 1);
    } else if (world === 1) {
      wind = clamp(wind + mx * 0.012, -0.55, 0.55);
    } else if (world === 2) {
      viewX = clamp(viewX + mx * 0.35, -80, 80);
      viewY = clamp(viewY + my * 0.35, -60, 60);
    }
    ptr.x = p.x;
    ptr.y = p.y;
  });

  function endPointer(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    var dx = ptr.x - ptr.sx;
    var dy = ptr.y - ptr.sy;
    var dist = Math.hypot(dx, dy);
    if (ptr.mode === "swipe" && Math.abs(dx) > cssW * 0.18) commit(dx < 0 ? 1 : -1);
    else if (ptr.mode === "swipe") springBack();
    else if (dist < 22) tapAt(ptr.x, ptr.y);
    ptr = null;
  }

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  shield(toggle);
  shield(panel);
  toggle.addEventListener("click", function () {
    var on = !panel.classList.contains("open");
    panel.classList.toggle("open", on);
    toggle.setAttribute("aria-expanded", on ? "true" : "false");
    toggle.setAttribute("aria-label", on ? "Close" : "Worlds");
  });
  jumps.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null;
    if (!b) return;
    finishAnim();
    world = parseInt(b.getAttribute("data-i"), 10) || 0;
    slide = 0;
    syncUi();
    tone(WORLDS[world].tone);
  });

  buildJumps();
  requestAnimationFrame(loop);
})();
