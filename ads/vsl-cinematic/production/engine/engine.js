/* Motor de cena do Robô de Date — renderização determinística por tempo.
 * setup(timeline, formato) monta o palco; render(t) desenha o quadro no tempo t (s).
 * Tudo é função de t (sem animações CSS), então qualquer quadro pode ser capturado.
 *
 * Câmera (keyframes da cena): {at, s, fy, x, rx, ry, rz, blur, ease, dur}
 *   s  = zoom; fy = ponto do celular (0 topo .. 1 base) que fica no foco da tela;
 *   ease rápido (expoOut, quintInOut, backOut): o movimento COMEÇA em `at` e dura `dur`;
 *   ease padrão: o movimento CHEGA em `at`, saindo do keyframe anterior.
 */
(function () {
'use strict';
const PW = 600, PH = 1280;
const LAYOUTS = {
  vertical: {W: 1080, H: 1920, phone: 1.0, focusY: 0.445, capY: 1395, capSize: 60, headTop: 250, headSize: 118,
             tag: [44, 150], kin: 124, kinW: 920, cta: 1.0, ctaDiscB: 300, splitTop: 360},
  feed:     {W: 1080, H: 1350, phone: 0.78, focusY: 0.435, capY: 1185, capSize: 52, headTop: 70, headSize: 92,
             tag: [36, 36], kin: 104, kinW: 940, cta: 0.8, ctaDiscB: 34, splitTop: 120},
};
let TL, L, stage, sceneL, capsL, hudL, curIdx = -1, cur = null, grainTiles = [], bokeh = [], glows = [];

/* ------------------------------------------------------------ utilidades */
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, p) => a + (b - a) * p;
const EASE = {
  linear: p => p,
  inOut: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
  out: p => 1 - Math.pow(1 - p, 3),
  expoOut: p => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p),
  quintInOut: p => p < .5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2,
  backOut: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
};
const FAST = {expoOut: .62, quintInOut: .9, backOut: .5};
const prog = (t, at, dur) => clamp((t - at) / dur);
function h(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function css(e, o) { for (const k in o) e.style[k] = o[k]; return e; }
function rnd(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function avStyle(who) { return `background:linear-gradient(140deg,hsl(${who.hue},70%,58%),hsl(${(who.hue + 40) % 360},65%,38%))`; }
function show(e, vis) { e.style.display = vis ? '' : 'none'; }
function pop(e, t, at, dur = .26, from = .72) {
  const p = prog(t, at, dur);
  show(e, t >= at);
  if (t >= at) { e.style.opacity = clamp(p * 2); e.style.transform = `scale(${lerp(from, 1, EASE.backOut(p))})`; }
  return p;
}

/* ---------------------------------------------------------- fundo e grão */
function buildBG() {
  const bg = document.getElementById('bg');
  const cols = ['rgba(232,72,74,.9)', 'rgba(167,139,250,.6)', 'rgba(255,90,95,.6)'];
  for (let i = 0; i < 3; i++) {
    const g = h('div', 'glow'); g.style.background = cols[i];
    bg.appendChild(g); glows.push(g);
  }
  const r = rnd(42);
  for (let i = 0; i < 16; i++) {
    const b = h('div', 'bokeh'); const s = 30 + r() * 120;
    css(b, {width: s + 'px', height: s + 'px', filter: `blur(${2 + r() * 10}px)`, opacity: .15 + r() * .35});
    bg.appendChild(b); bokeh.push({e: b, x: r(), y: r(), sp: .01 + r() * .025, ph: r() * 6.28, z: .3 + r()});
  }
  for (let k = 0; k < 4; k++) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'); const id = x.createImageData(256, 256); const rr = rnd(100 + k);
    for (let i = 0; i < id.data.length; i += 4) { const v = rr() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    x.putImageData(id, 0, 0); grainTiles.push(c.toDataURL());
  }
}
function drawBG(t, camRY = 0) {
  const {W, H} = L;
  const g = glows;
  css(g[0], {width: W * .9 + 'px', height: W * .9 + 'px', left: (W * .55 + Math.sin(t * .25) * 80 - camRY * 4) + 'px', top: (H * .12 + Math.cos(t * .2) * 60) + 'px'});
  css(g[1], {width: W * .8 + 'px', height: W * .8 + 'px', left: (-W * .35 + Math.cos(t * .22) * 70 - camRY * 3) + 'px', top: (H * .55 + Math.sin(t * .18) * 80) + 'px'});
  css(g[2], {width: W * .5 + 'px', height: W * .5 + 'px', left: (W * .2 + Math.sin(t * .3 + 1) * 60) + 'px', top: (H * .78 + Math.cos(t * .27) * 40) + 'px', opacity: .35});
  for (const b of bokeh) {
    const y = ((b.y - t * b.sp) % 1 + 1) % 1;
    css(b.e, {left: (b.x * W + Math.sin(t * .4 + b.ph) * 30 - camRY * 6 * b.z) + 'px', top: (y * H) + 'px'});
  }
  const gr = document.getElementById('grain');
  const f = Math.floor(t * 30);
  gr.style.backgroundImage = `url(${grainTiles[f % 4]})`;
  gr.style.backgroundPosition = `${(f * 73) % 256}px ${(f * 151) % 256}px`;
  document.getElementById('beam').style.opacity = .7 + .3 * Math.sin(t * .7);
}

/* ---------------------------------------------------------------- câmera */
function camState(cam, t, sc) {
  const keys = (cam || [{at: 0, s: 1}]);
  const base = {s: 1, fy: .5, x: 0, rx: 0, ry: 0, rz: 0, blur: 0};
  let st = Object.assign({}, base, keys[0]);
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i], prev = keys[i - 1];
    const ease = k.ease || 'inOut';
    let a, d;
    if (FAST[ease]) { a = k.at; d = k.dur || FAST[ease]; }
    else { a = prev.at; d = Math.max(.001, k.at - prev.at); }
    if (t < a) break;
    const p = EASE[ease](prog(t, a, d));
    const nx = {};
    for (const key in base) nx[key] = lerp(st[key], k[key] != null ? k[key] : st[key], p);
    st = nx;
  }
  return st;
}

/* ------------------------------------------------------------- celular */
function buildPhone() {
  const wrap = h('div', 'world');
  const shadow = h('div', 'shadow');
  const ph = h('div', 'phone');
  ph.appendChild(h('div', 'frame'));
  const scr = h('div', 'screen');
  ph.appendChild(scr);
  ph.appendChild(h('div', 'island'));
  const glass = h('div', 'glass'); ph.appendChild(glass);
  const rim = h('div', 'rim'); ph.appendChild(rim);
  wrap.appendChild(shadow); wrap.appendChild(ph);
  return {wrap, ph, scr, glass, rim, shadow};
}
function placePhone(P, cs, t, sc) {
  const S = cs.s * L.phone;
  let rx = cs.rx + Math.sin(t * .45) * .8, ry = cs.ry + Math.sin(t * .6) * 1.2, rz = cs.rz;
  let x = L.W / 2 + cs.x * L.phone, y = L.focusY * L.H - (cs.fy - .5) * PH * S + Math.sin(t * .5) * 5;
  if (sc.shake) { x += Math.sin(t * 13.1) * 2.5 + Math.sin(t * 7.3) * 2; y += Math.cos(t * 11.7) * 2.5; rz += Math.sin(t * 9.1) * .25; }
  P.ph.style.transform = `translate3d(${x - PW / 2}px,${y - PH / 2}px,0) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${S})`;
  P.ph.style.filter = cs.blur > .2 ? `blur(${cs.blur}px)` : 'none';
  const sweepAt = sc.sweep != null ? sc.sweep : -99;
  const sw = prog(t, sweepAt, 1.1);
  P.glass.style.backgroundPosition = `${(sw > 0 && sw < 1 ? lerp(120, -20, EASE.inOut(sw)) : 60 - ry * 2)}% 0`;
  P.rim.style.background = `linear-gradient(${100 + ry * 3}deg,rgba(255,90,95,0) 30%,rgba(255,90,95,.6) 50%,rgba(255,90,95,0) 70%)`;
  css(P.shadow, {left: (x - 260 * S) + 'px', top: (y + PH * S * .5 + 10) + 'px', transform: `scale(${S})`, opacity: .7});
  return ry;
}

/* ---------------------------------------------------------- telas: comum */
function statusBar(clock) {
  const s = h('div', 'status');
  const tm = h('span', '', clock || '22:41');
  const ic = h('div', 'icons', '<div class="sig"><i style="height:8px"></i><i style="height:12px"></i><i style="height:16px"></i><i style="height:20px"></i></div><div class="bat"></div>');
  s.appendChild(tm); s.appendChild(ic);
  return {el: s, tm};
}
function fmtClock(m) { m = ((Math.round(m) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
function toMin(s) { const [a, b] = s.split(':').map(Number); return a * 60 + b; }

function bubble(m) {
  if (m.kind === 'typing') { const b = h('div', 'b her typing', '<i></i><i></i><i></i>'); return b; }
  if (m.kind === 'image') return imageMsg(m);
  const b = h('div', 'b ' + (m.from === 'me' ? 'me' : 'her') + (m.big ? ' big' : ''), m.text + (m.time ? `<span class="tm">${m.time}</span>` : ''));
  return b;
}
function imageMsg(m) {
  const w = h('div', 'img');
  const mini = h('div', 'mini');
  const who = m.print.who;
  mini.appendChild(h('div', 'mh', `<div class="mav" style="${avStyle(who)}">${who.initial}</div><b>${who.name}</b>`));
  if (m.print.lines) m.print.lines.forEach(x => mini.appendChild(h('div', 'pl', x)));
  if (m.print.chat) m.print.chat.forEach(x => {
    const mine = !x.startsWith('— ') && m.print.chat.length > 1 && x !== m.print.chat[m.print.chat.length - 1];
    const d = h('div', 'ml', x.replace(/^— /, ''));
    if (mine && m.print.chat.length > 2) css(d, {marginLeft: 'auto', background: '#3a2696'});
    mini.appendChild(d);
  });
  w.appendChild(mini);
  w.appendChild(h('div', 'cap', '📷 print'));
  return w;
}

/* chat genérico (app de conversa) */
function buildChat(spec, P) {
  const app = h('div', 'app');
  const sb = statusBar(spec.clock ? spec.clock.from : null);
  const who = spec.who;
  const hdr = h('div', 'hdr', `<div class="back">‹</div><div class="av" style="${avStyle(who)}">${who.initial}</div>
    <div><div class="hname">${who.name}</div><div class="hsub">${spec.friend ? 'amigo' : (spec.online ? 'online' : 'visto por último hoje')}</div></div>`);
  const msgs = h('div', 'msgs');
  if (spec.note) msgs.appendChild(h('div', 'note', spec.note));
  const items = [];
  const all = (spec.msgs || []).slice();
  // mensagens enviadas pelo campo de texto
  let last = '';
  for (const ev of (spec.input || [])) {
    if (ev.type) last = ev.type; if (ev.paste) last = ev.paste;
    if (ev.send) all.push({from: 'me', text: last, at: ev.at, sent: true});
  }
  all.sort((a, b) => a.at - b.at);
  for (const m of all) { const e = bubble(m); msgs.appendChild(e); items.push({m, e}); }
  const inbar = h('div', 'inbar');
  const field = h('div', 'field', '<span class="ph">Mensagem</span>');
  const send = h('div', 'sendbtn', '➤');
  inbar.appendChild(h('div', 'ico', '＋')); inbar.appendChild(field); inbar.appendChild(send);
  const frost = h('div', 'frost');
  app.appendChild(hdr); app.appendChild(msgs); app.appendChild(inbar); app.appendChild(frost); app.appendChild(sb.el);
  const flash = css(h('div'), {position: 'absolute', inset: 0, background: '#fff', opacity: 0, zIndex: 40, pointerEvents: 'none'});
  app.appendChild(flash);
  return {
    el: app,
    update(t, sc) {
      // relógio
      if (spec.clock) {
        const p = EASE.inOut(prog(t, spec.clock.at, spec.clock.dur));
        let a = toMin(spec.clock.from), b = toMin(spec.clock.to); if (b < a) b += 1440;
        sb.tm.textContent = fmtClock(lerp(a, b, p));
      }
      // mensagens
      let push = 0;
      for (const it of items) {
        const m = it.m;
        if (m.kind === 'typing') {
          const vis = t >= m.at && t < m.until;
          show(it.e, vis);
          if (vis) { it.e.querySelectorAll('i').forEach((d, k) => d.style.transform = `translateY(${-6 * Math.max(0, Math.sin(t * 9 - k * .7))}px)`); pop(it.e, t, m.at, .2); }
          continue;
        }
        const p = pop(it.e, t, m.at, m.big ? .32 : .24, m.big ? .4 : .7);
        if (t >= m.at && p < 1) push = Math.max(push, (1 - EASE.out(p)) * (it.e.offsetHeight + 12));
      }
      msgs.style.transform = `translateY(${push}px)`;
      // campo de texto
      let text = '', active = false, pasteAt = -9, sent = false;
      for (const ev of (spec.input || [])) {
        if (t < ev.at) break;
        if (ev.type) { const n = Math.floor(ev.type.length * prog(t, ev.at, ev.dur)); text = ev.type.slice(0, n); active = t < ev.at + ev.dur; }
        else if (ev.del) { const base = text.length; const n = Math.floor(base * (1 - prog(t, ev.at, ev.dur))); text = text.slice(0, n); active = t < ev.at + ev.dur; }
        else if (ev.paste) { text = ev.paste; pasteAt = ev.at; }
        else if (ev.send) { text = ''; sent = true; }
      }
      const caretOn = active || Math.floor(t * 2.2) % 2 === 0;
      const hl = clamp(1 - (t - pasteAt) / .5);
      field.innerHTML = text ? `<span style="background:rgba(255,90,95,${.35 * hl})">${text}</span>${caretOn ? '<span class="caret"></span>' : ''}`
                             : `${caretOn && spec.input ? '<span class="caret"></span>' : ''}<span class="ph">Mensagem</span>`;
      field.style.alignItems = text.length > 40 ? 'flex-start' : 'center';
      inbar.style.height = text.length > 40 ? (text.length > 80 ? '228px' : '170px') : '118px';
      send.classList.toggle('on', !!text);
      // gelo / degelo
      let fz = 0;
      if (spec.freeze) fz = EASE.inOut(prog(t, spec.freeze.at, spec.freeze.dur));
      if (spec.thaw) fz = 1 - EASE.inOut(prog(t, sc.start, 1.0));
      frost.style.opacity = fz * .9;
      app.style.filter = fz > .01 ? `saturate(${1 - .75 * fz}) hue-rotate(${-25 * fz}deg) brightness(${1 + .12 * fz})` : 'none';
      // print (flash de captura)
      if (spec.shot) { const q = prog(t, spec.shot.at, .22); flash.style.opacity = t >= spec.shot.at ? (1 - q) * .6 : 0; }
    }
  };
}

/* app Robô de Date */
function buildRobot(spec) {
  const app = h('div', 'app rob');
  const sb = statusBar('22:43');
  const hdr = h('div', 'hdr', `<div class="back">‹</div><div class="av"></div>
     <div><div class="hname">Robô de Date</div><div class="hsub online">● online</div></div>`);
  const msgs = h('div', 'msgs');
  const items = [];
  const GREET = 'E aí! Manda o print da conversa ou me conta a situação 👊';
  const list = spec.msgs.slice();
  if (!list.some(m => m.text === GREET) && !list.some(m => m.at < -1)) list.push({from: 'bot', kind: 'text', text: GREET, at: -99});
  list.sort((a, b) => a.at - b.at);
  list.forEach((m, i) => {
    let e;
    if (m.kind === 'thinking') {
      e = h('div', 'think', '<span>analisando o print</span><i></i><i></i><i></i>');
      const nxt = list.slice(i + 1).find(x => x.from === 'bot' && x.kind !== 'thinking');
      m.until = nxt ? nxt.at : m.at + 1.2;
    } else if (m.kind === 'suggestion') {
      e = h('div', 'sug', `<div class="lab">✦ ${m.label}</div><div class="txt">${m.text}</div><div class="row"><div class="copy">Copiar</div></div>`);
    } else if (m.kind === 'why') {
      e = h('div', 'why', `<div class="lab">💡 ${m.title}</div><div class="txt">${m.text}</div>`);
    } else if (m.kind === 'chips') {
      e = h('div', 'chips'); m.chips.forEach(c => e.appendChild(h('div', 'chip', c.text)));
    } else if (m.kind === 'image') {
      e = imageMsg(m);
    } else if (m.kind === 'audio') {
      e = h('div', 'audio'); e.appendChild(h('div', 'play', '▶'));
      const wv = h('div', 'wave'); const r = rnd(9);
      for (let k = 0; k < 26; k++) { const bar = h('i'); bar.style.height = (8 + r() * 30) + 'px'; wv.appendChild(bar); }
      e.appendChild(wv); e.appendChild(h('div', 'd', m.dur));
    } else {
      e = h('div', 'b ' + (m.from === 'me' ? 'me' : 'bot'), m.text);
    }
    msgs.appendChild(e); items.push({m, e});
  });
  const inbar = h('div', 'inbar');
  inbar.appendChild(h('div', 'ico', '🖼️'));
  inbar.appendChild(h('div', 'field', '<span class="ph">Mande um print ou pergunte algo…</span>'));
  inbar.appendChild(h('div', 'ico', '🎙️'));
  app.appendChild(hdr); app.appendChild(msgs); app.appendChild(inbar); app.appendChild(sb.el);
  let jump = null;
  if (spec.jumpTo) {
    jump = buildChat(spec.jumpTo.chat);
    css(jump.el, {zIndex: 50});
    app.appendChild(jump.el);
  }
  function ripple(btn, t, at) {
    let r = btn.querySelector('.ripple');
    if (!r) { r = h('div', 'ripple'); btn.appendChild(r); }
    const p = prog(t, at, .45);
    const vis = t >= at && p < 1;
    show(r, vis);
    if (vis) css(r, {left: '50%', top: '50%', width: 20 + 160 * p + 'px', height: 20 + 160 * p + 'px', opacity: .6 * (1 - p)});
  }
  return {
    el: app,
    update(t, sc) {
      let push = 0;
      for (const it of items) {
        const m = it.m;
        if (m.kind === 'thinking') {
          const vis = t >= m.at && t < m.until; show(it.e, vis);
          if (vis) { pop(it.e, t, m.at, .2); it.e.querySelectorAll('i').forEach((d, k) => d.style.opacity = .3 + .7 * Math.max(0, Math.sin(t * 8 - k * .8))); }
          continue;
        }
        const p = pop(it.e, t, m.at, m.kind === 'suggestion' || m.kind === 'why' ? .38 : .24, m.kind === 'suggestion' ? .85 : .7);
        if (t >= m.at && p < 1) push = Math.max(push, (1 - EASE.out(p)) * (it.e.offsetHeight + 12));
        if (m.kind === 'suggestion' && m.copyAt != null) {
          const btn = it.e.querySelector('.copy');
          const done = t >= m.copyAt + .12;
          btn.classList.toggle('done', done); btn.textContent = done ? 'Copiado ✓' : 'Copiar';
          ripple(btn, t, m.copyAt);
        }
        if (m.kind === 'suggestion' && t >= m.at) {
          it.e.style.boxShadow = `0 0 ${34 + 30 * (1 - prog(t, m.at, .9))}px rgba(232,72,74,${.25 + .35 * (1 - prog(t, m.at, .9))})`;
        }
        if (m.kind === 'chips') m.chips.forEach((c, k) => {
          const el = it.e.children[k]; el.classList.toggle('tap', t >= c.tapAt); ripple(el, t, c.tapAt);
        });
        if (m.kind === 'audio' && t >= m.at) {
          const bars = it.e.querySelectorAll('.wave i'); const ph = ((t - m.at) * 9) % (bars.length + 8);
          bars.forEach((b, k) => b.style.background = k < ph ? '#fff' : 'rgba(255,255,255,.45)');
        }
      }
      msgs.style.transform = `translateY(${push}px)`;
      if (jump) {
        const p = EASE.out(prog(t, spec.jumpTo.at, .28));
        show(jump.el, t >= spec.jumpTo.at);
        jump.el.style.transform = `translateX(${(1 - p) * 100}%)`;
        jump.update(t, sc);
      }
    }
  };
}

/* tela de match */
function buildMatch(spec) {
  const m = h('div', 'match');
  const sb = statusBar('22:39'); m.appendChild(sb.el);
  const pair = h('div', 'pair');
  const a = h('div', 'mav', 'EU'); a.setAttribute('style', 'left:0;background:linear-gradient(140deg,#5a3fd6,#2b1c6e);font-size:64px');
  const b = h('div', 'mav', spec.who.initial); b.setAttribute('style', `right:0;${avStyle(spec.who)}`);
  const heart = h('div', 'heart', '❤️');
  pair.appendChild(a); pair.appendChild(b); pair.appendChild(heart);
  const sparks = [];
  const r = rnd(5);
  for (let i = 0; i < 18; i++) { const s = h('div', 'spark'); pair.appendChild(s); sparks.push({e: s, a: r() * 6.28, d: 140 + r() * 160, sz: 4 + r() * 10}); }
  const h1 = h('h1', '', 'Vocês deram<br>match!');
  const p = h('p', '', `Você e ${spec.who.name} curtiram um ao outro`);
  const btn = h('div', 'btn', 'Enviar mensagem');
  const b2 = h('div', 'btn2', 'Continuar navegando');
  [pair, h1, p, btn, b2].forEach(e => m.appendChild(e));
  return {
    el: m,
    update(t) {
      const at = spec.popAt;
      const q = EASE.backOut(prog(t, at, .55));
      a.style.transform = `translateX(${lerp(-260, 40, q)}px) rotate(${lerp(-20, -6, q)}deg)`;
      b.style.transform = `translateX(${lerp(260, -40, q)}px) rotate(${lerp(20, 6, q)}deg)`;
      const hq = EASE.backOut(prog(t, at + .25, .4));
      heart.style.transform = `scale(${hq})`;
      sparks.forEach(s => {
        const sp = prog(t, at + .25, .9);
        css(s.e, {left: (210 + Math.cos(s.a) * s.d * EASE.out(sp)) + 'px', top: (190 + Math.sin(s.a) * s.d * EASE.out(sp)) + 'px',
                  width: s.sz + 'px', height: s.sz + 'px', opacity: sp > 0 ? 1 - sp : 0});
      });
      const tq = EASE.out(prog(t, at + .35, .5));
      [h1, p, btn, b2].forEach((e, k) => { const qq = EASE.out(prog(t, at + .35 + k * .08, .5)); css(e, {opacity: qq, transform: `translateY(${(1 - qq) * 30}px)`}); });
      const pulse = t > at + 1 ? 1 + .03 * Math.sin((t - at) * 6) : 1;
      btn.style.transform += ` scale(${pulse})`;
    }
  };
}

/* caixa de entrada lotada de "oi, tudo bem?" */
function buildInbox(spec) {
  const box = h('div', 'inbox');
  const sb = statusBar('22:40'); box.appendChild(sb.el);
  box.appendChild(h('div', 'ttl', 'Mensagens'));
  box.appendChild(h('div', 'sub', `caixa de entrada de ${spec.owner}`));
  const list = h('div'); box.appendChild(list);
  const names = ['Lucas', 'Rafael', 'Thiago', 'Bruno', 'Gabriel', 'Mateus', 'Felipe', 'Diego', 'André', 'Vitor'];
  const rows = [];
  for (let i = spec.rows - 1; i >= 0; i--) {
    const n = names[i % names.length];
    const r = h('div', 'row', `<div class="av" style="${avStyle({hue: (i * 37) % 360})}">${n[0]}</div><div><div class="nm">${n}</div><div class="pv">${spec.preview}</div></div><div class="tm">agora</div>`);
    list.appendChild(r); rows.push({e: r, at: spec.startAt + (spec.rows - 1 - i) * spec.stagger});
  }
  rows.reverse();
  const you = h('div', 'row you', `<div class="av" style="background:linear-gradient(140deg,#5a3fd6,#2b1c6e)">EU</div><div><div class="nm">Você</div><div class="pv">${spec.preview}</div></div><div class="tm">22:40</div>`);
  list.appendChild(you);
  return {
    el: box,
    update(t) {
      const yq = pop(you, t, spec.sendAt, .3, .9);
      for (const r of rows) {
        const q = EASE.out(prog(t, r.at, .16));
        show(r.e, t >= r.at);
        css(r.e, {maxHeight: (q * 112) + 'px', opacity: q, overflow: 'hidden', paddingTop: (q * 16) + 'px', paddingBottom: (q * 16) + 'px'});
      }
      const n = rows.filter(r => t >= r.at + .1).length;
      you.style.opacity = t >= spec.sendAt ? (n > 0 ? lerp(1, .45, clamp(n / rows.length)) : 1) : 0;
    }
  };
}

/* ------------------------------------------------------------- cenas */
function sceneFor(sc) {
  const root = h('div', 'layer');
  let upd = () => {};
  if (sc.type === 'phone') {
    const P = buildPhone();
    root.appendChild(P.wrap);
    const spec = sc.screen;
    let scr;
    if (spec.kind === 'chat') scr = buildChat(spec, P);
    else if (spec.kind === 'robot') scr = buildRobot(spec);
    else if (spec.kind === 'match') scr = buildMatch(spec);
    else if (spec.kind === 'inbox') scr = buildInbox(spec);
    P.scr.appendChild(scr.el);
    let head = null;
    if (sc.headline) {
      head = h('div', 'headline', sc.headline.txt);
      css(head, {top: L.headTop + 'px', fontSize: L.headSize + 'px'});
      root.appendChild(head);
    }
    upd = (t) => {
      const cs = camState(sc.cam, t, sc);
      scr.update(t, sc);
      const ry = placePhone(P, cs, t, sc);
      if (head) {
        const q = prog(t, sc.headline.at, .32);
        show(head, t >= sc.headline.at);
        css(head, {opacity: clamp(q * 2), transform: `scale(${lerp(1.35, 1, EASE.expoOut(q))})`});
      }
      return ry;
    };
  } else if (sc.type === 'kinetic') {
    const k = h('div', 'kin');
    const lines = sc.lines.map(ln => {
      let e;
      if (ln.chip) { e = h('div', 'ln'); e.appendChild(h('span', 'chipk', ln.txt)); }
      else e = h('div', 'ln' + (ln.small ? ' small' : ''), ln.txt);
      e.style.fontSize = (ln.small ? L.kin * .45 : ln.chip ? L.kin * .55 : L.kin) + 'px';
      e.style.maxWidth = L.kinW + 'px';
      k.appendChild(e); return {ln, e};
    });
    let bar = null;
    if (sc.progress) { const pg = h('div', 'prog'); css(pg, {width: L.kinW * .7 + 'px'}); bar = h('i'); pg.appendChild(bar); k.appendChild(pg); }
    root.appendChild(k);
    upd = (t) => {
      lines.forEach(({ln, e}, i) => {
        const q = prog(t, ln.at, .42);
        show(e, t >= ln.at - .001 || !ln.stack);
        const vis = t >= ln.at;
        const later = lines.slice(i + 1).some(o => t >= o.ln.at);
        const dim = ln.stack && later ? .32 : 1;
        css(e, {opacity: vis ? clamp(q * 1.6) * dim : 0, transform: `translateY(${(1 - EASE.expoOut(q)) * 40}px) scale(${lerp(1.08, 1, EASE.expoOut(q))})`,
                filter: q < 1 ? `blur(${(1 - EASE.out(q)) * 14}px)` : 'none', visibility: vis ? 'visible' : 'hidden'});
      });
      if (bar) bar.style.width = (EASE.inOut(prog(t, sc.start + .3, sc.end - sc.start - .3)) * 100) + '%';
      k.style.transform = `scale(${1 + (t - sc.start) * .012})`;
      return 0;
    };
  } else if (sc.type === 'split') {
    const s = h('div', 'split');
    const cw = L.W - 140;
    const left = h('div', 'card');
    left.appendChild(h('div', 'lab', sc.left.label));
    const its = sc.left.items.map(x => { const e = h('div', 'it', x + '<s></s>'); left.appendChild(e); return e; });
    const right = h('div', 'card right');
    right.appendChild(h('div', 'lab', '✦ ' + sc.right.label));
    right.appendChild(h('div', 'stxt', sc.right.text));
    const why = h('div', 'why2', '💡 ' + sc.right.why); right.appendChild(why);
    const isFeed = L.H < 1500;
    css(left, {width: cw + 'px', left: '70px', top: L.splitTop + 'px', transform: 'scale(1)'});
    css(right, {width: cw + 'px', left: '70px', top: (L.splitTop + (isFeed ? 420 : 560)) + 'px'});
    if (isFeed) { left.style.padding = right.style.padding = '26px 30px'; }
    s.appendChild(left); s.appendChild(right); root.appendChild(s);
    upd = (t) => {
      its.forEach((e, i) => { const at = sc.leftAt + i * .25; pop(e, t, at, .25, .85);
        const st = e.querySelector('s'); st.style.transform = `scaleX(${EASE.out(prog(t, sc.strikeAt + i * .06, .25))})`;
        e.style.opacity = t >= sc.strikeAt ? .5 : (t >= at ? 1 : 0); });
      const lq = EASE.out(prog(t, sc.leftAt - .1, .4));
      left.style.opacity = lq;
      left.style.transform = `translateY(${(1 - lq) * 40}px) rotate(${-1.2 + Math.sin(t * .5) * .3}deg) scale(${t >= sc.rightAt ? lerp(1, .94, EASE.out(prog(t, sc.rightAt, .4))) : 1})`;
      left.style.filter = t >= sc.rightAt ? `saturate(${1 - .7 * prog(t, sc.rightAt, .4)}) brightness(${1 - .3 * prog(t, sc.rightAt, .4)})` : 'none';
      const rq = EASE.backOut(prog(t, sc.rightAt, .5));
      show(right, t >= sc.rightAt);
      right.style.opacity = clamp(prog(t, sc.rightAt, .25));
      right.style.transform = `translateY(${(1 - rq) * 80}px) rotate(${1 + Math.sin(t * .5 + 1) * .3}deg)`;
      why.style.opacity = clamp(prog(t, sc.whyAt, .3));
      return 0;
    };
  } else if (sc.type === 'cta') {
    const c = h('div', 'cta');
    const k = L.cta;
    const logo = css(h('div', 'logo'), {width: 170 * k + 'px', height: 170 * k + 'px'});
    const brand = css(h('div', 'brand', 'ROBÔ DE DATE'), {fontSize: 34 * k + 'px', letterSpacing: '4px'});
    const h2 = css(h('h2', '', sc.title), {fontSize: 112 * k + 'px'});
    const sub = css(h('div', 'sub', sc.sub), {fontSize: 38 * k + 'px', maxWidth: 820 + 'px'});
    const btn = css(h('div', 'btn', `${sc.button} <span style="font-size:1.1em">→</span>`), {fontSize: 46 * k + 'px', padding: `${30 * k}px ${70 * k}px`});
    const hint = css(h('div', 'hint', 'Toque no botão <b style="color:#FF5A5F">Saiba mais</b> ↓'), {fontSize: 32 * k + 'px'});
    const disc = css(h('div', 'disc', 'Conversas e interface meramente ilustrativas.'), {bottom: L.ctaDiscB + 'px', fontSize: 26 + 'px'});
    [logo, brand, h2, sub, btn, hint].forEach(e => c.appendChild(e));
    root.appendChild(c); root.appendChild(disc);
    if (L.H > 1500) c.style.paddingBottom = '260px';
    upd = (t) => {
      const t0 = sc.start;
      [logo, brand, h2, sub, btn, hint].forEach((e, i) => {
        const q = prog(t, t0 + .05 + i * .11, .5);
        css(e, {opacity: clamp(q * 1.5), transform: `translateY(${(1 - EASE.expoOut(q)) * 50}px) scale(${i === 0 ? lerp(.6, 1, EASE.backOut(q)) : 1})`});
      });
      const pulse = .5 + .5 * Math.sin((t - t0) * 5.2);
      btn.style.boxShadow = `0 0 0 ${pulse * 18}px rgba(255,90,95,${.35 * (1 - pulse)}),0 20px 60px rgba(232,72,74,.55)`;
      btn.style.transform += ` scale(${1 + .035 * pulse})`;
      disc.style.opacity = clamp(prog(t, t0 + .6, .5)) * .9;
      return 0;
    };
  }
  return {root, upd};
}

/* ------------------------------------------------------------ legendas */
let capEl = null, capIdx = -2;
function drawCaps(t, sc) {
  const off = sc && (sc.type === 'kinetic' || sc.type === 'cta' || sc.capsOff);
  const i = off ? -1 : TL.captions.findIndex(c => t >= c.start && t < c.end);
  if (i !== capIdx) {
    capsL.innerHTML = ''; capIdx = i; capEl = null;
    if (i >= 0) {
      capEl = h('div', 'cap', '<i>' + TL.captions[i].html + '</i>');
      css(capEl, {fontSize: L.capSize + 'px', top: (L.capY - L.capSize * .6) + 'px'});
      capsL.appendChild(capEl);
    }
  }
  if (capEl) {
    const c = TL.captions[i]; const q = prog(t, c.start, .09);
    capEl.style.transform = `scale(${lerp(.88, 1, EASE.backOut(q))})`; capEl.style.opacity = clamp(q * 2);
  }
}

/* ---------------------------------------------------------------- API */
window.setup = function (tl, fmt) {
  TL = tl; L = LAYOUTS[fmt];
  stage = document.getElementById('stage');
  css(stage, {width: L.W + 'px', height: L.H + 'px'});
  sceneL = document.getElementById('sceneL'); capsL = document.getElementById('caps'); hudL = document.getElementById('hud');
  buildBG();
  return true;
};
window.render = function (t) {
  const idx = TL.scenes.findIndex(s => t >= s.start && t < s.end);
  const i = idx < 0 ? TL.scenes.length - 1 : idx;
  const sc = TL.scenes[i];
  if (i !== curIdx) {
    sceneL.innerHTML = ''; hudL.innerHTML = '';
    cur = sceneFor(sc); sceneL.appendChild(cur.root); curIdx = i;
    if (sc.tag) { const tg = h('div', 'tag', sc.tag); css(tg, {left: L.tag[0] + 'px', top: L.tag[1] + 'px'}); hudL.appendChild(tg); }
  }
  const ry = cur.upd(t) || 0;
  // corte com "assentamento" e respiro de luz
  const q = prog(t, sc.start, .16);
  const first = i === 0;
  sceneL.style.transform = first ? 'none' : `scale(${lerp(1.045, 1, EASE.out(q))})`;
  sceneL.style.filter = first || q >= 1 ? 'none' : `brightness(${lerp(1.5, 1, EASE.out(q))})`;
  document.getElementById('fadeblack').style.opacity = (sc.type === 'cta' || sc.type === 'kinetic') && !first ? (1 - EASE.out(q)) * .7 : 0;
  // flash branco no print
  let fl = 0;
  if (sc.screen && sc.screen.shot) { const p = prog(t, sc.screen.shot.at, .3); fl = t >= sc.screen.shot.at ? (1 - p) * .18 : 0; }
  document.getElementById('flash').style.opacity = fl;
  hudL.style.opacity = clamp(prog(t, sc.start + .2, .4)) * .95;
  drawBG(t, ry);
  drawCaps(t, sc);
  // fade final
  const end = TL.duration;
  document.getElementById('fadeblack').style.opacity = Math.max(parseFloat(document.getElementById('fadeblack').style.opacity) || 0, clamp((t - (end - .35)) / .35) * .9);
  return true;
};
})();
