(() => {
  'use strict';

  /* =========================================================
   * 설정: 여기만 바꿔도 분위기가 많이 달라져요
   * ========================================================= */
  const CONFIG = {
    drinkDuration: 5200,       // 끝까지 마시는 데 필요한 누르기 시간(ms)
    maxChars: 80,              // 메시지 최대 글자 수
    maxLines: 4,               // 메시지 최대 줄 수
    showMug: true,             // 맥주잔 표시. 액자 모드에서는 액자 옆 '남은 맥주' 잔으로 바뀌어요
    imageFrame: true,          // 직접 넣은 이미지가 배경 있는 사각형(GIF 등)이면 둥근 액자에 담아 보여줘요
    frameLabel: '오늘의 한 잔', // 액자 위 라벨 (빈 문자열이면 숨김)
    // 직접 준비한 캐릭터 이미지 경로. 파일이 없으면 기본 캐릭터 '보리'(SVG)가 나와요.
    // 일부만 넣어도 돼요. 없는 장면은 idle 이미지로 대신 보여줘요.
    images: {
      idle: 'assets/character/idle.gif',          // 기다리는 모습
      drinking: 'assets/character/drinking.gif',  // 꿀꺽꿀꺽 마시는 모습
      finish: 'assets/character/finish.gif',      // 다 마시고 "프하~!" 하는 모습
    },
    captions: {
      idle: '시원한 맥주가 앞에 있다…',
      drinking: ['꿀꺽… 꿀꺽…', '벌컥벌컥!!', '조금만 더…!!', '마지막 한 모금…!!'],
      pause: ['후아… 아직 남았다…', '잠깐 숨 좀…', '…더 마시고 싶은 눈치다'],
      slam: '탕!',
      cheers: '크으~~ 이 맛이지!!',
      burp: '어…? 뭔가 올라온다…?!',
      reveal: '마음이 튀어나왔다!',
    },
    title: { receive: '한 잔<br>준비했대<span class="dots">…</span>', compose: '맥주 한 잔에<br>마음 담기' },
  };

  const $ = (id) => document.getElementById(id);
  const app = $('app');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 캐릭터 이미지 ---------- */
  const available = {};
  let currentPose = 'idle';
  Object.entries(CONFIG.images).forEach(([pose, src]) => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      available[pose] = src;
      app.classList.toggle('framed', !!CONFIG.imageFrame);
      setPose(currentPose, true);
    };
    img.src = src;
  });
  if (!CONFIG.showMug) $('mug').hidden = true;
  $('frameLabel').textContent = CONFIG.frameLabel || '';
  $('frameLabel').hidden = !CONFIG.frameLabel;

  function setPose(pose, force) {
    if (pose === currentPose && !force) return;
    currentPose = pose;
    $('actor').dataset.pose = pose;
    const src = available[pose] || available.idle;
    const img = $('actorImg');
    if (src) {
      if (img.getAttribute('src') !== src) img.src = src;
      img.hidden = false;
      $('actorSvg').style.display = 'none';
    } else {
      img.hidden = true;
      $('actorSvg').style.display = '';
    }
  }

  /* ---------- 효과음 (파일 없이 Web Audio로 합성) ---------- */
  let audioCtx = null;
  function audio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function tone({ type = 'sine', from, to, dur, vol = .4, delay = 0, filter }) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .02);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let node = o.connect(g);
    if (filter) { const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; node = node.connect(f); }
    node.connect(a.destination);
    o.start(t); o.stop(t + dur + .05);
  }
  function noise(dur, vol, freq) {
    const a = audio(); if (!a) return;
    const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    s.buffer = buf; f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = vol;
    s.connect(f).connect(g).connect(a.destination); s.start();
  }
  const sfx = {
    gulp: () => tone({ from: 300 + Math.random() * 60, to: 85, dur: .18, vol: .55 }),
    slam: () => { noise(.25, .9, 900); tone({ from: 140, to: 60, dur: .2, vol: .6 }); },
    ahh: () => { tone({ type: 'triangle', from: 520, to: 330, dur: .5, vol: .25 }); tone({ type: 'triangle', from: 660, to: 880, dur: .25, vol: .15, delay: .05 }); },
    burp: () => { tone({ type: 'sawtooth', from: 95, to: 70, dur: .55, vol: .35, filter: 380 }); tone({ type: 'square', from: 60, to: 48, dur: .45, vol: .12, filter: 300, delay: .05 }); },
    pop: () => { tone({ from: 500, to: 1400, dur: .09, vol: .45 }); noise(.08, .4, 3000); },
    sparkle: () => [0, .08, .16].forEach((d, i) => tone({ type: 'triangle', from: 880 * (1 + i * .25), to: 1320 * (1 + i * .25), dur: .18, vol: .12, delay: d })),
  };
  const buzz = (p) => { if (navigator.vibrate && !reduceMotion) navigator.vibrate(p); };

  /* ---------- 마시기 상태 ---------- */
  let progress = 0, holding = false, done = false, raf = 0, last = 0, nextGulp = 0, pauseIdx = 0;
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const setState = (s) => { app.dataset.state = s; };

  function render() {
    const level = 1 - progress;
    const y = 30 + progress * 88;
    $('beer').setAttribute('y', y);
    $('beer').setAttribute('height', Math.max(0, 118 - y));
    $('foam').setAttribute('transform', `translate(0 ${y})`);
    $('foam').style.opacity = level > .02 ? 1 : 0;
    $('beerBubbles').style.opacity = level > .12 ? 1 : 0;
    const pct = Math.ceil(level * 100);
    $('percent').textContent = pct;
    $('meter').setAttribute('aria-valuenow', pct);
    $('meterFill').style.transform = `scaleX(${level})`;
    app.style.setProperty('--flush', progress.toFixed(3));
    if (holding) {
      const lines = CONFIG.captions.drinking;
      $('caption').textContent = lines[Math.min(lines.length - 1, Math.floor(progress * lines.length))];
    }
  }

  function tick(t) {
    const dt = Math.min(64, t - last); last = t;
    if (holding && !done) {
      progress = Math.min(1, progress + dt / CONFIG.drinkDuration);
      if (t >= nextGulp) { gulp(); nextGulp = t + 430 - progress * 140; }
    }
    render();
    if (progress >= 1 && !done) { finish(); raf = 0; return; }
    raf = holding ? requestAnimationFrame(tick) : 0;
  }

  function gulp() {
    sfx.gulp(); buzz(12);
    const actor = $('actor');
    actor.classList.remove('gulp'); void actor.offsetWidth; actor.classList.add('gulp');
    const w = document.createElement('span');
    w.className = 'gulp-word';
    w.textContent = Math.random() < .5 ? '꿀꺽' : '꿀꺽!';
    if (app.classList.contains('framed')) {   // 액자 모드: 액자 양옆에서 뿅
      const right = Math.random() < .5;
      w.style.left = `${right ? 285 + Math.random() * 20 : 15 + Math.random() * 20}px`;
      w.style.top = `${90 + Math.random() * 110}px`;
    } else {
      w.style.left = `${80 + Math.random() * 90}px`;
      w.style.top = `${70 + Math.random() * 50}px`;
    }
    w.style.setProperty('--r', `${Math.random() * 24 - 12}deg`);
    $('fx').append(w);
    setTimeout(() => w.remove(), 950);
  }

  function startHold(e) {
    if (done || app.dataset.mode !== 'receive') return;
    if (e) e.preventDefault();
    if (holding) return;
    audio();
    holding = true;
    $('holdButton').classList.add('pressed');
    setState('drinking'); setPose('drinking');
    last = performance.now(); nextGulp = last + 180;
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function stopHold() {
    if (!holding) return;
    holding = false;
    $('holdButton').classList.remove('pressed');
    if (done) return;
    setState(progress > 0 ? 'pause' : 'idle'); setPose('idle');
    const lines = CONFIG.captions.pause;
    $('caption').textContent = progress > 0 ? lines[pauseIdx++ % lines.length] : CONFIG.captions.idle;
  }

  /* ---------- 다 마셨을 때 이벤트 ---------- */
  function finish() {
    done = true; holding = false;
    $('holdButton').classList.remove('pressed');
    $('holdButton').hidden = true;
    setPose('idle');
    setState('slam'); $('caption').textContent = CONFIG.captions.slam;
    sfx.slam(); buzz(40);

    later(() => {                       // 1. 프하~!!
      setState('cheers'); setPose('finish');
      $('caption').textContent = CONFIG.captions.cheers;
      sfx.ahh(); burst(160, 140, 18); buzz([30, 40, 30]);
    }, 450);
    later(() => {                       // 2. 트림 방울이 부풀어 오름
      setState('burp');
      $('caption').textContent = CONFIG.captions.burp;
      sfx.burp(); buzz(80);
    }, 1700);
    later(() => {                       // 3. 방울이 터지면서 메시지 등장
      setState('reveal');
      $('caption').textContent = CONFIG.captions.reveal;
      sfx.pop(); sfx.sparkle(); burst(160, 110, 30); buzz([20, 30, 60]);
    }, 3300);
    later(() => { $('afterActions').hidden = false; }, 4200);
  }

  function burst(x, y, count) {
    if (reduceMotion) return;
    const colors = ['#ffd34d', '#ffb02e', '#ff8fa3', '#fff6c9', '#9bd7ff', '#b6e388'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      p.className = 'particle' + (i % 3 === 0 ? ' square' : '');
      const ang = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 110;
      p.style.left = `${x}px`; p.style.top = `${y}px`;
      p.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(ang) * dist - 30}px`);
      p.style.setProperty('--rot', `${Math.random() * 360}deg`);
      p.style.setProperty('--s', `${8 + Math.random() * 10}px`);
      p.style.setProperty('--c', colors[i % colors.length]);
      $('fx').append(p);
      setTimeout(() => p.remove(), 1300);
    }
  }

  function resetScene() {
    cancelAnimationFrame(raf); raf = 0;
    timers.forEach(clearTimeout); timers = [];
    progress = 0; holding = false; done = false; pauseIdx = 0;
    $('fx').replaceChildren();
    $('holdButton').hidden = false;
    $('holdButton').classList.remove('pressed');
    $('afterActions').hidden = true;
    setState('idle'); setPose('idle');
    $('caption').textContent = CONFIG.captions.idle;
    render();
  }

  /* ---------- 링크에 메시지 담기 (서버 없음) ---------- */
  function encodeCard(data) {
    const bytes = new TextEncoder().encode(JSON.stringify({ v: 1, ...data }));
    let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeCard(hash) {
    const code = new URLSearchParams(hash.replace(/^#/, '')).get('c');
    if (!code || code.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(code)) throw Error('invalid');
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64 + '='.repeat((4 - b64.length % 4) % 4)), (c) => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!data || typeof data.m !== 'string' || !data.m.trim()) throw Error('invalid');
    return { m: data.m.slice(0, 300), f: typeof data.f === 'string' ? data.f.slice(0, 20) : '' };
  }
  const baseURL = () => location.href.split('#')[0];

  /* ---------- 화면 전환 ---------- */
  let draft = null, shareURL = '';

  function showReceive(data, preview) {
    resetScene();
    app.dataset.mode = 'receive';
    $('title').innerHTML = CONFIG.title.receive;
    $('fromLine').textContent = data.f ? `From. ${data.f}` : '';
    $('messageText').textContent = data.m;
    $('messageFrom').textContent = data.f ? `— ${data.f}` : '';
    $('controls').hidden = false;
    $('composer').hidden = true;
    $('linkPanel').hidden = true;
    $('previewBackButton').hidden = !preview;
    $('makeOwnButton').hidden = !!preview;
    document.title = data.f ? `${data.f}님이 한 잔 준비했대…` : '한 잔 준비했대…';
  }

  function showCompose(error) {
    resetScene();
    app.dataset.mode = 'compose';
    $('title').innerHTML = CONFIG.title.compose;
    $('fromLine').textContent = '';
    $('controls').hidden = true;
    $('linkPanel').hidden = true;
    $('composer').hidden = false;
    $('caption').textContent = '다 마시면 네 메시지가 튀어나와!';
    if (draft) { $('messageInput').value = draft.m; $('fromInput').value = draft.f; }
    updateCount();
    showError(error || '');
    document.title = '맥주 한 잔에 마음 담기';
  }

  function route() {
    if (!location.hash) { showCompose(); return; }
    try { showReceive(decodeCard(location.hash), false); }
    catch { showCompose('링크가 조금 이상해요. 새로 만들어 볼까요?'); }
  }

  /* ---------- 작성 폼 ---------- */
  const countChars = (s) => Array.from(s).length;
  function updateCount() {
    const n = countChars($('messageInput').value.trim());
    $('messageCount').textContent = `${n} / ${CONFIG.maxChars}`;
    $('messageCount').style.color = n > CONFIG.maxChars ? '#c0392b' : '';
  }
  function showError(msg) { $('formError').textContent = msg; $('formError').hidden = !msg; }

  $('messageInput').addEventListener('input', () => { updateCount(); showError(''); });
  $('composer').addEventListener('submit', (e) => {
    e.preventDefault();
    const m = $('messageInput').value.replace(/\r/g, '').trim();
    const f = $('fromInput').value.trim();
    if (!m) return showError('전할 말을 적어 줘!');
    if (countChars(m) > CONFIG.maxChars) return showError(`${CONFIG.maxChars}자까지만 담을 수 있어.`);
    if (m.split('\n').length > CONFIG.maxLines) return showError(`${CONFIG.maxLines}줄까지만 담을 수 있어.`);
    draft = { m, f };
    shareURL = `${baseURL()}#c=${encodeCard(f ? { m, f } : { m })}`;
    $('generatedLink').value = shareURL;
    $('shareButton').textContent = navigator.share ? '공유하기' : '링크 복사';
    $('linkStatus').textContent = '';
    $('composer').hidden = true;
    $('linkPanel').hidden = false;
  });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareURL);
      $('linkStatus').textContent = '링크를 복사했어! 친구에게 보내줘 🍻';
    } catch {
      $('generatedLink').select();
      $('linkStatus').textContent = '링크를 길게 눌러 복사해 줘.';
    }
  }
  $('copyButton').addEventListener('click', copyLink);
  $('shareButton').addEventListener('click', async () => {
    if (!navigator.share) return copyLink();
    try {
      await navigator.share({ title: '한 잔 준비했대…', text: '꾹 눌러서 끝까지 마시게 해 줘 🍺', url: shareURL });
      $('linkStatus').textContent = '한 잔 전했어!';
    } catch (err) {
      if (err && err.name !== 'AbortError') copyLink();
    }
  });
  $('previewButton').addEventListener('click', () => { showReceive(draft, true); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $('editButton').addEventListener('click', () => showCompose());
  $('previewBackButton').addEventListener('click', () => {
    showCompose();
    $('composer').hidden = true;
    $('linkPanel').hidden = false;
  });
  $('replayButton').addEventListener('click', resetScene);
  $('makeOwnButton').addEventListener('click', () => {
    draft = null;
    history.pushState(null, '', baseURL());
    showCompose();
  });

  /* ---------- 꾹 누르기 입력 ---------- */
  [$('holdButton'), $('stage')].forEach((el) => {
    el.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      if (el === $('stage') && done) return;  // 메시지 카드는 눌러도 반응 없게
      try { el.setPointerCapture(e.pointerId); } catch { /* noop */ }
      startHold(e);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => el.addEventListener(t, stopHold));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  });
  $('holdButton').addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) startHold(e);
  });
  $('holdButton').addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') stopHold(); });
  window.addEventListener('blur', stopHold);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopHold(); });

  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', route);
  route();
})();
