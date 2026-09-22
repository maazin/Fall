(function(){
  "use strict";

  /* The roster. Add a buddy by dropping a .webp in assets/buddies and
     listing it here; order matters, the picker shows them in this order. */
  const CHARS = [
    { name: 'Mooni', src: 'assets/buddies/mooni.webp' },
    { name: 'Omar', src: 'assets/buddies/omar.webp' },
    { name: 'Mamu', src: 'assets/buddies/mamu.webp' },
    { name: 'Pineapple', src: 'assets/buddies/pineapple.webp' },
    { name: 'Blueberry Cow', src: 'assets/buddies/blueberry-cow.webp' },
    { name: 'Bessie', src: 'assets/buddies/bessie.webp' },
    { name: 'Mel', src: 'assets/buddies/mel.webp' },
    { name: 'Cheryl', src: 'assets/buddies/cheryl.webp' },
    { name: 'Ronnie', src: 'assets/buddies/ronnie.webp' },
    { name: 'Connor', src: 'assets/buddies/connor.webp' },
    { name: 'Lazy Harp Seal', src: 'assets/buddies/lazy-harp-seal.webp' },
    { name: 'ME', src: 'assets/buddies/me.webp' },
    { name: 'Devin', src: 'assets/buddies/devin.webp' },
    { name: 'Grandpa Herbie', src: 'assets/buddies/grandpa-herbie.webp' },
    { name: 'Sophie', src: 'assets/buddies/sophie.webp' },
    { name: 'Carrie', src: 'assets/buddies/carrie.webp' },
    { name: 'Butt Nugget', src: 'assets/buddies/butt-nugget.webp' },
    { name: 'Pip', src: 'assets/buddies/pip.webp' },
    { name: 'Pep', src: 'assets/buddies/pep.webp' }
  ];

  /* ---------------- buddy perks ----------------
     each field is read by the game loop; missing field = no effect */
  /* Perks are permanent and small; power-ups are short and loud.
     Where the two would overlap, the perk makes that power-up BETTER for that
     buddy instead of duplicating it, so picking Mel still means something
     even in a round full of shield bubbles. */
  /* Every buddy gets its own VERB, not the same number with a new label.
     No two of these touch the same system. */
  const PERKS = {
    'Mooni':          { t:'Berry Dash',     d:'Far faster, glued to your finger',
                        speed:1.55, snap:2.1, trail:1,
                        long:'She moves 55% faster on the keyboard and tracks your finger or mouse more than twice as tightly as anyone else, so she goes exactly where you point instead of drifting there. She leaves a rainbow blur when she really gets going.' },

    'Omar':           { t:'Bear Hug',       d:'Every friend pays 1 extra',
                        friendBonus:1,
                        long:'Every ordinary friend pays one extra point on top of your multiplier. The bonus is flat rather than multiplied, so it rewards steady volume instead of compounding into a runaway streak.' },

    'Mamu':           { t:'Lucky Bun',      d:'Multipliers arrive early',
                        tiers:[4, 10, 16], window:1.5,
                        long:'You hit x2 at 4 catches, x3 at 10 and x4 at 16, instead of 5, 12 and 20. Your streak also survives 50% longer between catches, so she lives at a high multiplier while everyone else is still building one.' },

    'Pineapple':      { t:'Sunshine',       d:'Ten more seconds on the clock',
                        extraTime:10, grace:15,
                        long:'Your round is 70 seconds instead of 60. In Endless, nothing dangerous spawns for the first 15 seconds so you get a free run at building a streak. She is the only buddy who changes how long you play.' },

    'Blueberry Cow':  { t:'Jelly Pull',     d:'Always a little magnetic',
                        pull:1, magnetBoost:1.7,
                        long:'Friends near you drift toward you all round long without any bubble, and magnet bubbles last 70% longer and pull 35% harder in your hands.' },

    'Bessie':         { t:'Storm Eater',    d:'Eats lightning for 2 points',
                        boltImmune:1, boltPay:2,
                        long:'She eats lightning. Bolts do her no damage at all and each one she swallows pays 2 points and keeps her streak going, so the late storm turns from the worst hazard in the game into her best scoring window. Rain still costs a heart.' },

    'Mel':            { t:'Melon Shell',    d:'Holds two shields',
                        shield:1, shieldMax:2,
                        long:'You start with a shield and can stack two at once, where everyone else caps at one, so each bubble is two free hits. Any shield you still hold when the clock runs out pays 12 points, so not needing them is its own reward.' },

    'Cheryl':         { t:'Sticky Web',     d:'Web saves missed friends for +1',
                        webTime:1.7,
                        long:'Friends you miss land in a web on the ground and wait 1.7 seconds instead of vanishing, so you can stroll over and collect them. Each one you rescue out of the web pays 1 extra point. She is the only buddy who gets a second chance at a drop.' },

    'Ronnie':         { t:'Moo Muscle',     d:'One extra heart',
                        hearts:1, heartLuck:2.4,
                        long:'You start with one heart more than the difficulty gives, and heart bubbles are far more likely to drop whenever you are hurt.' },

    'Connor':         { t:'Storm Chaser',   d:'Late storm, long blaster',
                        storm:14, blastBoost:1.6,
                        long:'The storm phase and its lightning arrive 14 seconds later than normal, so you get a much longer calm stretch to build a score before anything gets dangerous. He also holds a blaster bubble 60% longer than anyone else, which is 8 seconds of popping instead of 5, so when the clouds finally show up he shoots his way through them.' },

    'Lazy Harp Seal': { t:"Can't Be Bothered", d:'Widest reach, slowest waddle',
                        reach:1.42, speed:0.82, snap:0.85, nearBonus:2,
                        long:'She refuses to chase anything, so the squad has to come to her. Her catch area is 42% wider than normal, the biggest in the game, but she waddles 18% slower, so you pick a good spot and let things land. Brushing past a hazard pays 2 instead of 1, because she never panics.' },

    'ME':             { t:'Sparkle Thief',  d:'Double bubbles, own mimics',
                        pwLuck:2.0, purseLuck:2.0, mimicAlly:1, mimicPay:3, mimicTaunt:'teehee!',
                        long:'Bubbles drop twice as often for her and rhinestone purses are twice as likely again, which makes her the power-up buddy by a mile. Her sparkle mimics appear when you play as her, disguised as one of the cows, and each one you catch pays 3. Double tap her on the buddy screen and see who turns up.' },

    'Devin':          { t:'Twin Trouble',   d:'Hunts his sister\u2019s mimics',
                        mimicAlly:1, mimicPay:5, mimicRate:1.9, mimicTaunt:'gotcha!', night:1,
                        long:'ME\u2019s twin brother, and the two of them cannot stand each other. Her sparkle mimics turn up almost twice as often when you play as him, and every one you catch pays 5 instead of 3, because nothing in the world makes him happier than catching his sister out. No bubble luck though: he is here for her, not for the loot. His side of the plush is the night one, so the whole round plays under a dark sky with the stars out and everything falling lit up at the edges. It is the same game, it just looks like his half of it.' },

    'Grandpa Herbie': { t:'Weather Ears',   d:'Hears one cloud at a time',
                        veer:1, blind:1, speed:0.80, snap:0.75,
                        long:'The old dragon cannot see a thing, and neither can you while you play him: all you get is the patch of sky he can hear around himself, and past that it is near enough black. What he can hear is rain, and only once it is nearly on top of him, and only one cloud at a time. That one leans away and misses, and then his ears need a couple of seconds before they pick anything up again, so a squall mostly gets through him. Lightning is far too fast to hear at all, so it drops on him exactly as it does on everybody else with no warning. Anything falling dead overhead makes no sound to either side either, so he cannot tell which way to duck and it lands on his nose. He waddles 20% slower on top of all that.' },

    'Sophie':         { t:'Little Flock',   d:'Friends fall two at a time',
                        flock:0.40, speed:0.94,
                        long:'A lamb never goes anywhere on her own, so four friend drops out of ten bring a second friend down beside them. Twice the squad in the sky means a much easier streak, as long as you can decide which one to run for. She ambles a little slower than the others.' },

    'Carrie':         { t:'Carrot Gold',    d:'Stars pay 7 and fall more often',
                        star:7, starLuck:1.8,
                        long:'Stars are her thing. Every star pays 7 instead of 5, still multiplied by your streak, and they fall almost twice as often. Nothing else about her round changes, so the whole game becomes about spotting the gold and getting under it. She is the only buddy who touches what a star is worth.' },

    'Butt Nugget':    { t:'Slow Day',       d:'Fewer, slower rain clouds',
                        rain:0.75, rainFall:0.72, speed:0.92,
                        long:'A sloth does not do weather. A quarter of the rain clouds never bother turning up, and the ones that do drift down 28% slower than everything around them, so there is always time to step out from under one. Lightning is as fast as ever, and he shuffles 8% slower himself, so the trade is fewer scares for a lazier buddy.' },

    'Pip':            { t:'Power Nap',      d:'Everything falls slower, deeper slow-mo',
                        fall:0.92, slowBoost:1.8, slowDeep:0.5,
                        long:'She is half asleep and somehow the sky is too. Everything falls 8% slower for her all round long, and a slow-mo bubble is a proper nap: it lasts 80% longer and slows the world to half speed instead of two thirds. Nothing pays more, you just get more time to think.' },

    'Pep':            { t:'Bounce Back',    d:'Losing a heart starts 3s of x2',
                        rally:3.0,
                        long:'Getting hit only makes her try harder. Every time she loses a heart, a three second burst of double points kicks in on the spot, the same one the x2 bubble gives you, so a bad moment turns straight into a scoring window if you keep catching through it. Shields do not count: it has to hurt.' }
  };

  const NO_PERK = { t:'Squishy', d:'A good all-rounder' };
  const ME_INDEX = CHARS.map(function(c){ return c.name; }).indexOf('ME');
  const DEVIN_INDEX = CHARS.map(function(c){ return c.name; }).indexOf('Devin');
  // ME is envious of the cows specifically, so those are the only faces she wears
  const COWS = ['Mooni', 'Blueberry Cow', 'Ronnie', 'Connor'];
  const COW_IDS = COWS.map(function(n){
    return CHARS.map(function(c){ return c.name; }).indexOf(n);
  }).filter(function(i){ return i >= 0; });
  /* The twins are two faces of one flip plush, so only one of them is ever out.
     Neither of them ever falls from the sky either: whichever one you are not
     playing is folded away inside the one you are. */
  const TWIN_IDS = [ME_INDEX, DEVIN_INDEX].filter(function(i){ return i >= 0; });
  const FALLABLE = CHARS.map(function(c, i){ return i; })
    .filter(function(i){ return TWIN_IDS.indexOf(i) < 0; });
  function perkOf(i){ return PERKS[CHARS[i].name] || NO_PERK; }

  const app = document.getElementById('app');
  const world = document.getElementById('world');
  const stage = document.getElementById('stage');
  const fx = document.getElementById('fx');
  const ctx = fx.getContext('2d');
  const hud = document.getElementById('hud');
  const scoreVal = document.getElementById('scoreVal');
  const timeVal = document.getElementById('timeVal');
  const timePill = document.getElementById('timePill');
  const heartsEl = document.getElementById('hearts');
  const countdown = document.getElementById('countdown');
  const screenTitle = document.getElementById('screenTitle');
  const screenPick = document.getElementById('screenPick');
  const screenOver = document.getElementById('screenOver');
  const screenBoard = document.getElementById('screenBoard');
  const screenSquad = document.getElementById('screenSquad');
  const screenGlobal = document.getElementById('screenGlobal');
  const buddyGrid = document.getElementById('buddyGrid');
  const stormEl = document.getElementById('storm');
  const flashEl = document.getElementById('flash');
  const waveEl = document.getElementById('wave');
  const pauseEl = document.getElementById('pause');
  const pauseBtn = document.getElementById('pauseBtn');
  const nightEl = document.getElementById('night');
  const starsEl = document.getElementById('stars');
  const blindEl = document.getElementById('blind');
  let blindOn = false, lastBlindX = -999;
  const moonEl = document.getElementById('moon');
  const sunEl = document.getElementById('sun');
  const comboPill = document.getElementById('comboPill');
  const comboVal = document.getElementById('comboVal');
  const comboBarFill = document.querySelector('#comboBar i');
  const pwRow = document.getElementById('pwRow');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ROUND = 60;
  function roundLen(){ return ROUND + (perk.extraTime || 0); }

  /* ---------------- modes and difficulty ---------------- */
  const DIFFS = {
    chill:  { hearts:5, pace:0.70, boltAt:34, label:'Chill'  },
    normal: { hearts:3, pace:1.00, boltAt:22, label:'Normal' },
    storm:  { hearts:2, pace:1.34, boltAt:16, label:'Storm'  }
  };
  let mode = 'round';
  let diffKey = 'normal';
  function diff(){ return DIFFS[diffKey]; }
  function isEndless(){ return mode === 'endless'; }
  try{
    const sm = localStorage.getItem('squishMode'); if(DIFFS[localStorage.getItem('squishDiff')]) diffKey = localStorage.getItem('squishDiff');
    if(sm === 'endless' || sm === 'round') mode = sm;
  }catch(e){}

  let W = 0, H = 0, groundY = 0;
  let picked = 0;
  let player = null, playerShadow = null;
  let px = 0, targetX = 0, keyDir = 0;
  let fallers = [], particles = [];
  let score = 0, hearts = 3, timeLeft = ROUND, combo = 0;
  let running = false, lastT = 0, spawnT = 0, elapsed = 0, raf = 0;
  let waveIdx = 0;
  let paused = false;
  let perk = NO_PERK, maxHearts = 3, shield = 0, shieldCap = 1, shieldEl = null;
  let lastPx = 0, trailT = 0;
  let runCaught = {};
  let bestCombo = 0, bossCleared = false, mimicsCaught = 0, purseUses = 0;
  let bossEl = null, bossState = 'none', bossT = 0, bossX = 0, bossDir = 1, bossShots = 0, bossHurt = false;
  const BOSS_AT = 44, BOSS_SHOTS = 8;
  /* Blaster: while it is up, your buddy pops bubbles straight up on her own.
     Auto-fire rather than a fire button, because most people play this with one
     thumb and there is nowhere on a phone to put a second control. */
  let shots = [], shotT = 0, cloudsPopped = 0;
  let mercyT = 0;               // seconds of grace after losing a heart
  const MERCY = 0.55;           // long enough to clear the cloud that just hit you
  let earT = 0;                 // Herbie's ears, recharging
  const EAR_REST = 3.0;         // seconds before he can hear the next cloud
  const SHOT_GAP = 0.26;      // seconds between bubbles
  const SHOT_SPEED = 830;     // pixels a second, straight up
  const POP_PAY = { rain: 2, bolt: 3 };
  let nextBossAt = BOSS_AT;

  /* ---------------- combo + power-ups ---------------- */
  const COMBO_WINDOW = 3.6;          // base seconds to keep a streak alive
  function comboWindow(){ return COMBO_WINDOW * (perk.window || 1); }
  let comboT = 0;
  function multiplier(){
    const t = perk.tiers || [5, 12, 20];
    return combo >= t[2] ? 4 : combo >= t[1] ? 3 : combo >= t[0] ? 2 : 1;
  }

  /* a little pink clutch, crusted in rhinestones */
  const PURSE_SVG = (function(){
    let stones = '';
    for(let r = 0; r < 5; r++){
      for(let c = 0; c < 7; c++){
        const x = 30 + c * 6.8 + (r % 2 ? 3.4 : 0);
        const y = 50 + r * 6.4;
        if(x > 74) continue;
        stones += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.1" fill="#FFE9F7" opacity="' +
                  (0.55 + Math.random() * 0.45).toFixed(2) + '"/>';
      }
    }
    return '<path d="M34 44c0-11 7-18 16-18s16 7 16 18" fill="none" stroke="#FFD9F0" stroke-width="4.5" stroke-linecap="round"/>' +
           '<rect x="24" y="42" width="52" height="44" rx="9" fill="#FF3FB0" stroke="#fff" stroke-width="5"/>' +
           stones +
           '<rect x="43" y="38" width="14" height="9" rx="4" fill="#FFE9F7" stroke="#fff" stroke-width="3"/>';
  })();

  const PW = {
    magnet: { t:'Magnet',  dur:4.2, col:'#8C6BFF', ico:'<path d="M22 74V44a28 28 0 0 1 56 0v30H60V44a10 10 0 0 0-20 0v30z" fill="#8C6BFF" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M22 74h18v14H22zM60 74h18v14H60z" fill="#FF4F9A" stroke="#fff" stroke-width="5"/>' },
    slow:   { t:'Slow-mo', dur:3.6, col:'#2FCBBD', ico:'<circle cx="50" cy="52" r="34" fill="#2FCBBD" stroke="#fff" stroke-width="6"/><path d="M50 32v22l15 10" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/>' },
    blaster:{ t:'Blaster', dur:5.0, col:'#FF4FC3', ico:'<rect x="14" y="46" width="44" height="27" rx="13" fill="#FF4FC3" stroke="#fff" stroke-width="6"/><path d="M29 72v13" stroke="#fff" stroke-width="8" stroke-linecap="round"/><rect x="55" y="52" width="17" height="15" rx="7" fill="#FF4FC3" stroke="#fff" stroke-width="5"/><circle cx="81" cy="39" r="11" fill="#FFB6E8" stroke="#fff" stroke-width="5"/><circle cx="60" cy="21" r="6" fill="#FFE9F9" stroke="#fff" stroke-width="3.5"/>' },
    x2:     { t:'Double',  dur:5.5, col:'#FFC53C', ico:'<circle cx="50" cy="50" r="36" fill="#FFC53C" stroke="#fff" stroke-width="6"/><text x="50" y="66" font-family="Baloo 2,sans-serif" font-size="44" font-weight="800" fill="#7A4F00" text-anchor="middle">x2</text>' }
  };
  const pw = { magnet:0, slow:0, x2:0, blaster:0 };
  function pwActive(k){ return pw[k] > 0; }
  const canVibrate = typeof navigator !== 'undefined' && !!navigator.vibrate;
  /* Short pulses only. A phone motor can't do "soft", so cuteness comes from
     brevity and rhythm. Anything over ~30ms reads as an alarm. */
  const HAPTIC = {
    gift:     [12, 45, 12],        // little double tap
    block:    [8, 28, 8],
    comboUp:  [8, 26, 8],
    rain:     [16],                // one small nudge
    zap:      [12, 28, 12, 28, 20],// stutter, like a crackle
    mimic:    [9, 34, 9, 34, 9],   // a giggle
    purse:    [14, 30, 14, 30, 26], // a satisfying clatter of rhinestones
    pop:      [9, 30, 9],          // a cloud bursting, same shape as the gift tap
    bossWin:  [10, 55, 10, 55, 18],
    gameOver: [24, 70, 16, 70, 9]  // fading away, not a long buzz
  };
  function buzz(pattern){
    if(!canVibrate || reduceMotion) return;
    try{ navigator.vibrate(pattern); }catch(e){}
  }

  /* ---------------- time of day ----------------
     the sky drifts from midday to night across the round */
  const SKY = [
    { at:0.00, c:[[143,222,255],[201,236,255],[255,226,241]] },  // bright noon
    { at:0.30, c:[[141,219,253],[203,234,250],[255,224,226]] },  // holds midday a while
    { at:0.58, c:[[127,198,240],[255,217,168],[255,201,160]] },  // golden hour
    { at:0.80, c:[[ 86,101,168],[176,133,175],[240,166,166]] },  // dusk
    { at:1.00, c:[[ 30, 42, 85],[ 58, 61,114],[107, 90,140]] }   // night
  ];
  function mix(a, b, k){ return [
    Math.round(a[0]+(b[0]-a[0])*k), Math.round(a[1]+(b[1]-a[1])*k), Math.round(a[2]+(b[2]-a[2])*k) ]; }
  function rgb(c){ return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }
  let skyT = 0, lastStormOp = '';
  function paintSky(t){
    let i = 0;
    while(i < SKY.length - 2 && t > SKY[i+1].at) i++;
    const a = SKY[i], b = SKY[i+1];
    const k = Math.max(0, Math.min(1, (t - a.at) / (b.at - a.at)));
    const c0 = mix(a.c[0], b.c[0], k), c1 = mix(a.c[1], b.c[1], k), c2 = mix(a.c[2], b.c[2], k);
    app.style.background = 'linear-gradient(180deg,' + rgb(c0) + ' 0%,' + rgb(c1) + ' 45%,' + rgb(c2) + ' 100%)';
    // ground and scenery follow the light
    nightEl.style.opacity = (Math.max(0, t - 0.42) / 0.58 * 0.40).toFixed(3);
    const dusk = Math.max(0, Math.min(1, (t - 0.34) / 0.30));
    sunEl.style.opacity = (1 - dusk).toFixed(2);
    sunEl.style.transform = 'translate(' + (dusk * 70) + 'px,' + (dusk * 130) + 'px)';
    const nite = Math.max(0, Math.min(1, (t - 0.58) / 0.28));
    moonEl.style.opacity = nite.toFixed(2);
    starsEl.style.opacity = nite.toFixed(2);
  }
  function makeStars(){
    starsEl.innerHTML = '';
    for(let i=0;i<40;i++){
      const d = document.createElement('div');
      d.className = 'star-dot';
      const r = 1.5 + Math.random() * 2.2;
      d.style.width = r + 'px'; d.style.height = r + 'px';
      d.style.left = (Math.random() * 100) + '%';
      d.style.top = (Math.random() * 58) + '%';
      d.style.animationDelay = (Math.random() * 3) + 's';
      starsEl.appendChild(d);
    }
  }
  function resetSky(){
    skyT = 0; paintSky(0);
    app.style.background = '';
    nightEl.style.opacity = 0; starsEl.style.opacity = 0; moonEl.style.opacity = 0;
    sunEl.style.opacity = 1; sunEl.style.transform = 'none';
  }

  /* ---------------- difficulty curve ----------------
     ramp: 0 at kickoff -> 1 by ~46s, so the last stretch is the peak. */
  function ramp(){
    const pace = diff().pace;
    // endless keeps pushing past the round cap, but with diminishing returns
    const t = elapsed * pace / 46;
    return isEndless() ? Math.min(1.6, t) : Math.min(1, t);
  }
  function boltAt(){ return diff().boltAt + stormDelay(); }
  function stormDelay(){ return perk.storm || 0; }
  function stormRamp(){ return Math.max(0, Math.min(1, (elapsed - boltAt()) / 26)); }
  const WAVES = [
    { at: 14, text: 'Picking up speed!' },
    { at: 26, text: 'Storm rolling in \u26A1' },
    { at: 42, text: 'Final push!' }
  ];

  /* ---------------- sound ----------------
     Everything is sine and soft triangle, routed through a warm master chain
     with a short shimmer delay, so the game sounds like little toy chimes
     instead of a synth test bench. No saw or square waves anywhere. */
  let ac = null, muted = false;
  let master = null, noiseBuf = null;

  function audio(){
    if(!ac){
      try{ ac = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; }
      buildChain();
    }
    if(ac.state === 'suspended') ac.resume();
    return ac;
  }

  function buildChain(){
    master = ac.createGain(); master.gain.value = 0.85;

    // takes the glassy edge off every voice
    const warm = ac.createBiquadFilter();
    warm.type = 'lowpass'; warm.frequency.value = 5600; warm.Q.value = 0.5;

    // a quiet, short echo. This is most of what makes small blips sound sweet
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 600;
    const dl = ac.createDelay(0.6); dl.delayTime.value = 0.115;
    const fb = ac.createGain(); fb.gain.value = 0.24;
    const wet = ac.createGain(); wet.gain.value = 0.19;

    master.connect(warm); warm.connect(ac.destination);
    master.connect(hp); hp.connect(dl);
    dl.connect(fb); fb.connect(dl);
    dl.connect(wet); wet.connect(ac.destination);

    // a little noise for soft pops and airy sweeps
    const n = (ac.sampleRate * 0.5) | 0;
    noiseBuf = ac.createBuffer(1, n, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for(let k = 0; k < n; k++) d[k] = Math.random() * 2 - 1;
  }

  /* one round bell-ish voice: sine body, quiet octave on top,
     optional scoop into the note and gentle vibrato */
  function blip(freq, at, dur, vol, opt){
    const a = audio(); if(!a || muted) return;
    opt = opt || {};
    const t = a.currentTime + at;
    const bend = opt.bend === undefined ? 0.75 : opt.bend;

    const osc = a.createOscillator(), g = a.createGain();
    osc.type = opt.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if(opt.to) osc.frequency.exponentialRampToValueAtTime(Math.max(30, opt.to), t + dur * bend);

    if(opt.vib){
      const lfo = a.createOscillator(), lg = a.createGain();
      lfo.frequency.value = opt.vib;
      lg.gain.value = freq * 0.02;
      lfo.connect(lg); lg.connect(osc.frequency);
      lfo.start(t); lfo.stop(t + dur + 0.06);
    }

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (opt.attack || 0.012));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.07);

    // the octave is what reads as "toy xylophone" rather than "beep"
    if(opt.harm !== 0){
      const o2 = a.createOscillator(), g2 = a.createGain();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(freq * 2, t);
      if(opt.to) o2.frequency.exponentialRampToValueAtTime(Math.max(60, opt.to * 2), t + dur * bend);
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.exponentialRampToValueAtTime(vol * 0.28, t + 0.009);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.5);
      o2.connect(g2); g2.connect(master);
      o2.start(t); o2.stop(t + dur + 0.07);
    }
  }

  /* soft airy transient: the squish, the puff, the whoosh */
  function puff(at, dur, vol, f0, f1){
    const a = audio(); if(!a || muted || !noiseBuf) return;
    const t = a.currentTime + at;
    const src = a.createBufferSource(); src.buffer = noiseBuf;
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(Math.max(60, f1), t + dur);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.05);
  }

  // kept for the results screen's star pings
  function tone(freq, start, dur, type, vol){ blip(freq, start, dur, vol || 0.12, { type:'sine' }); }

  // C major pentatonic. Every catch lands on a consonant note, so a fast
  // chain of them sounds like a little tune instead of a rattle
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];

  const sfx = {
    // the sound you hear hundreds of times a round: soft marimba boop that
    // climbs the scale as your streak grows
    catch(c){
      const f = PENTA[Math.min(Math.max(c, 1) - 1, PENTA.length - 1)];
      puff(0, 0.055, 0.085, 1900, 700);
      blip(f * 0.94, 0, 0.26, 0.115, { to: f, bend: 0.10 });
      blip(f * 1.5, 0.035, 0.16, 0.045, { harm: 0 });
    },
    // hitting a new multiplier tier
    comboUp(m){
      const base = 659.25 * Math.pow(1.1225, m);
      [0, 4, 7].forEach(function(st, i){
        blip(base * Math.pow(2, st / 12), i * 0.045, 0.34, 0.10, { vib: 6 });
      });
    },
    star(){
      [1046.50, 1318.51, 1567.98, 2093.00].forEach(function(f, i){
        blip(f, i * 0.055, 0.42 - i * 0.05, 0.105 - i * 0.012, { attack: 0.006 });
      });
      puff(0.02, 0.3, 0.065, 4200, 1400);
    },
    // a small disappointed "aww", not a buzz
    bad(){
      puff(0, 0.13, 0.105, 700, 220);
      blip(392.00, 0,     0.30, 0.115, { to: 349.23, type:'triangle', vib: 7 });
      blip(311.13, 0.145, 0.38, 0.100, { to: 277.18, type:'triangle', vib: 6 });
    },
    // lightning: a quick startled swoop plus a crackle, still soft
    zap(){
      puff(0, 0.17, 0.145, 3200, 500);
      blip(880, 0, 0.22, 0.110, { to: 220, bend: 0.45, type:'triangle' });
      blip(261.63, 0.11, 0.34, 0.080, { vib: 11, type:'triangle' });
    },
    tick(){
      puff(0, 0.030, 0.105, 2800, 1700);
      blip(1318.51, 0, 0.07, 0.075, { harm: 0 });
    },
    go(){
      [523.25, 659.25, 783.99].forEach(function(f, i){ blip(f, i * 0.075, 0.24, 0.12); });
      blip(1046.50, 0.225, 0.55, 0.13, { vib: 5 });
    },
    tap(){
      puff(0, 0.045, 0.08, 2400, 950);
      blip(698.46, 0, 0.10, 0.085, { to: 1174.66, bend: 0.45 });
    },
    // near miss: pure air, no pitch, so it never competes with the music
    whoosh(){ puff(0, 0.26, 0.20, 420, 2600); blip(392, 0.02, 0.2, 0.03, { to: 660, harm: 0 }); },
    // firing a bubble: a tiny upward bloop. Quiet, because you hear it a lot
    blast(){
      puff(0, 0.05, 0.045, 2400, 1300);
      blip(784, 0, 0.09, 0.05, { to: 1318, bend: 0.55, harm: 0 });
    },
    // a cloud bursting: wet pop, then a sweet little note on top
    popCloud(){
      puff(0, 0.10, 0.08, 1400, 380);
      blip(659.25, 0.01, 0.22, 0.095, { to: 987.77, bend: 0.2 });
    },
    // a bubble landing on the boss: soft tick, no melody, it happens in bursts
    bossPing(){ puff(0, 0.06, 0.05, 1900, 900); blip(1046.5, 0, 0.07, 0.035, { harm: 0 }); },
    // power-up / shield: a rising sparkle
    shield(){
      [783.99, 1046.50, 1318.51].forEach(function(f, i){
        blip(f, i * 0.045, 0.36 - i * 0.04, 0.10, { to: f * 1.06, bend: 0.7 });
      });
      puff(0, 0.18, 0.065, 1600, 4000);
    },
    // the purse: a glittery sweep up into a fat chime
    purse(){
      puff(0, 0.42, 0.16, 600, 5200);
      [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach(function(f, i){
        blip(f, i * 0.045, 0.55 - i * 0.05, 0.105, { attack: 0.006 });
      });
      blip(1567.98, 0.24, 0.75, 0.085, { vib: 5.5 });
      blip(261.63, 0.02, 0.6, 0.06, { type:'triangle', harm: 0 });
    },
    // ME's giggle: a cheeky little run down, with a sparkle on top
    mischief(){
      [880.00, 783.99, 659.25, 587.33].forEach(function(f, i){
        blip(f, i * 0.062, 0.20, 0.10, { vib: 9 });
      });
      blip(1567.98, 0.03, 0.30, 0.05, { to: 1975.53, harm: 0 });
      puff(0.02, 0.22, 0.05, 3600, 1500);
    },
    wave(){
      blip(659.25, 0,     0.20, 0.11);
      blip(880.00, 0.135, 0.46, 0.12, { vib: 5 });
    },
    // a proper little tune rather than a run up the scale
    fanfare(){
      const mel = [[783.99,0,.15],[1046.50,.13,.15],[987.77,.26,.13],[1318.51,.38,.62]];
      mel.forEach(function(n, i){ blip(n[0], n[1], n[2], 0.125, i === 3 ? { vib: 5.5 } : {}); });
      [[261.63,0,.5],[329.63,.13,.5],[392.00,.26,.62]].forEach(function(n){
        blip(n[0], n[1], n[2], 0.055, { type:'triangle', harm: 0 });
      });
    }
  };

  /* ---------------- music ----------------
     a small procedural loop that tightens its tempo as the storm builds */
  const SCALE_DAY   = [0, 2, 4, 7, 9, 12, 14, 16];
  const SCALE_NIGHT = [0, 3, 5, 7, 10, 12, 15, 17];
  const ROOT = 261.63;                       // C4
  let musicTimer = null, nextNote = 0, step = 0;

  function noteHz(semis){ return ROOT * Math.pow(2, semis / 12); }

  function voice(freq, at, dur, vol, type){
    const a = audio(); if(!a || muted) return;
    const osc = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
    osc.type = type || 'triangle';
    osc.frequency.setValueAtTime(freq, at);
    f.type = 'lowpass'; f.frequency.setValueAtTime(2200, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(f); f.connect(g); g.connect(master || a.destination);
    osc.start(at); osc.stop(at + dur + 0.04);
  }

  function scheduleMusic(){
    const a = audio(); if(!a) return;
    const heat = Math.max(0, Math.min(1, ramp()));
    const dark = stormRamp();
    const scale = dark > 0.35 ? SCALE_NIGHT : SCALE_DAY;
    const stepDur = 0.30 - 0.115 * heat;     // speeds up across the round
    while(nextNote < a.currentTime + 0.35){
      const at = Math.max(nextNote, a.currentTime + 0.02);
      const i = step % 8;
      // arpeggio up and back down
      const idx = i < 5 ? i : 8 - i;
      voice(noteHz(scale[idx] + 12), at, stepDur * 1.5, 0.045 + 0.02 * heat, 'triangle');
      if(i % 4 === 0){
        voice(noteHz(scale[0] - 12), at, stepDur * 3.2, 0.05, 'sine');
      }
      if(i === 6 && dark > 0.5){
        voice(noteHz(scale[2] - 5), at, stepDur * 2, 0.035, 'sawtooth');
      }
      nextNote += stepDur;
      step++;
    }
  }

  function startMusic(){
    const a = audio(); if(!a) return;
    stopMusic();
    step = 0;
    nextNote = a.currentTime + 0.1;
    musicTimer = setInterval(scheduleMusic, 90);
    scheduleMusic();
  }
  function stopMusic(){ if(musicTimer){ clearInterval(musicTimer); musicTimer = null; } }

  /* ---------------- layout ---------------- */
  function resize(){
    app.scrollLeft = 0; app.scrollTop = 0;
    W = app.clientWidth; H = app.clientHeight;
    fx.width = W; fx.height = H;
    groundY = H - Math.max(64, H * 0.11) - 26;
    if(player){
      const s = playerSize();
      player.style.width = s + 'px'; player.style.height = s + 'px';
      lastBlindX = -999;
      placePlayer();
    }
    sizeBlind();
  }
  function playerSize(){ return Math.max(84, Math.min(140, W * 0.16)); }
  /* the speed curve was tuned on a ~800px tall window; shorter screens get
     proportionally slower drops so the time-to-ground stays the same */
  function heightScale(){ return Math.max(0.78, Math.min(1.12, H / 800)); }
  /* a thumb is less precise than a mouse, so touch gets a little more reach */
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  function touchReach(){ return coarse ? 1.06 : 1; }

  function fallerSize(){ return Math.max(58, Math.min(104, W * 0.115)); }
  window.addEventListener('resize', resize);

  function makeFlowers(){
    const holder = document.getElementById('flowers');
    holder.innerHTML = '';
    for(let i=0;i<9;i++){
      const f = document.createElement('div');
      f.className = 'flower';
      f.style.left = (5 + i*11 + Math.random()*5) + '%';
      f.style.bottom = (1.5 + Math.random()*6) + 'vh';
      holder.appendChild(f);
    }
  }

  /* ---------------- setup screens ---------------- */
  document.getElementById('ruleFriend').innerHTML =
    '<img src="' + CHARS[0].src + '" alt="" style="width:100%;height:100%;object-fit:contain">';

  /* Devin gets no tile of his own. He lives behind his sister's and shoves her
     out of the way when you tap her twice, which is roughly how they get on. */
  const TWINS = TWIN_IDS;

  function fillTile(b, i){
    const c = CHARS[i], pk = PERKS[c.name] || NO_PERK;
    b.dataset.ci = i;
    b.innerHTML = '<img src="' + c.src + '" alt=""><span>' + c.name + '</span>' +
      '<span class="perk"><b>' + pk.t + '</b>' + pk.d + '</span>' +
      (TWINS.length === 2 && TWINS.indexOf(i) > -1 ? '<span class="twin">2 taps</span>' : '');
  }

  function selectTile(b){
    const i = +b.dataset.ci;
    picked = i;
    [].forEach.call(buddyGrid.children, function(el){ el.classList.remove('sel'); });
    b.classList.add('sel');
    showPerk(i);
  }

  CHARS.forEach(function(c, i){
    if(i === DEVIN_INDEX) return;
    const b = document.createElement('button');
    b.className = 'buddy' + (i === 0 ? ' sel' : '');
    b.type = 'button';
    fillTile(b, i);
    let lastTap = 0;
    b.addEventListener('click', function(){
      const cur = +b.dataset.ci;
      const now = performance.now();
      // two taps inside 420ms on the twins' tile swaps whichever one is home.
      // timed off clicks rather than dblclick so a double tap on a phone works
      if(TWINS.length === 2 && TWINS.indexOf(cur) > -1 && now - lastTap < 420){
        lastTap = 0;
        fillTile(b, cur === ME_INDEX ? DEVIN_INDEX : ME_INDEX);
        selectTile(b);
        b.classList.remove('swap'); void b.offsetWidth; b.classList.add('swap');
        sfx.mischief(); buzz(HAPTIC.mimic);
        return;
      }
      lastTap = now;
      selectTile(b);
      sfx.tap();
    });
    buddyGrid.appendChild(b);
  });

  function showPerk(i){
    const c = CHARS[i], pk = PERKS[c.name] || NO_PERK;
    document.getElementById('perkImg').src = c.src;
    document.getElementById('perkWho').textContent = c.name + ':';
    document.getElementById('perkTitle').textContent = pk.t;
    document.getElementById('perkLong').textContent = pk.long || pk.d;
  }

  function show(el){ [screenTitle, screenPick, screenOver, screenBoard, screenSquad, screenGlobal].forEach(function(s){ s.classList.add('hidden'); }); if(el) el.classList.remove('hidden'); }

  document.getElementById('toPickBtn').addEventListener('click', function(){ audio(); sfx.tap(); showPerk(picked); show(screenPick); });
  document.getElementById('startBtn').addEventListener('click', function(){ sfx.tap(); begin(); });
  document.getElementById('againBtn').addEventListener('click', function(){ sfx.tap(); begin(); });
  document.getElementById('rePickBtn').addEventListener('click', function(){ sfx.tap(); showPerk(picked); show(screenPick); });
  /* mode + difficulty pickers */
  function wireSeg(id, attr, get, set){
    const root = document.getElementById(id);
    [].forEach.call(root.children, function(b){
      b.classList.toggle('sel', b.dataset[attr] === get());
      b.addEventListener('click', function(){
        set(b.dataset[attr]);
        [].forEach.call(root.children, function(x){ x.classList.remove('sel'); });
        b.classList.add('sel');
        sfx.tap();
      });
    });
  }
  wireSeg('modeSeg', 'mode', function(){ return mode; }, function(v){
    mode = v; try{ localStorage.setItem('squishMode', v); }catch(e){}
  });
  wireSeg('diffSeg', 'diff', function(){ return diffKey; }, function(v){
    diffKey = v; try{ localStorage.setItem('squishDiff', v); }catch(e){}
  });

  /* ---------------- best runs ---------------- */
  function loadBoard(){
    try{ return JSON.parse(localStorage.getItem('squishBoard') || '[]') || []; }catch(e){ return []; }
  }
  function saveRun(entry){
    const b = loadBoard();
    b.push(entry);
    b.sort(function(x, y){ return y.score - x.score; });
    const top = b.slice(0, 5);
    try{ localStorage.setItem('squishBoard', JSON.stringify(top)); }catch(e){}
    return top.indexOf(entry);
  }
  function renderBoard(){
    const list = document.getElementById('boardList');
    const b = loadBoard();
    list.innerHTML = '';
    if(!b.length){
      list.innerHTML = '<li class="empty">No runs yet. Go catch some friends!</li>';
      return;
    }
    b.forEach(function(e){
      const c = CHARS[e.ci] || CHARS[0];
      const li = document.createElement('li');
      li.innerHTML = '<img src="' + c.src + '" alt=""><span>' + c.name +
        '<small>' + (e.mode === 'endless' ? 'Endless' : '60s') + ' · ' + (DIFFS[e.diff] ? DIFFS[e.diff].label : 'Normal') +
        ' · ' + e.date + '</small></span><b>' + e.score + '</b>';
      list.appendChild(li);
    });
  }
  let boardFrom = screenTitle;
  document.getElementById('boardBtn').addEventListener('click', function(){
    sfx.tap(); boardFrom = screenTitle; renderBoard(); show(screenBoard);
  });
  document.getElementById('boardBackBtn').addEventListener('click', function(){ sfx.tap(); show(boardFrom); });
  document.getElementById('overBoardBtn').addEventListener('click', function(){
    sfx.tap(); boardFrom = screenOver; renderBoard(); show(screenBoard);
  });
  document.getElementById('homeBtn').addEventListener('click', function(){ sfx.tap(); show(screenTitle); });

  /* ---------------- the shared board ----------------
     Scores go to /api/scores, which keeps one best-ever row per name.
     Only reachable over http(s): opened straight off disk there is no API to
     talk to, so the buttons hide themselves and the game works as before. */
  const API = 'api/scores';
  function online(){ return /^https?:$/.test(location.protocol); }

  let playerName = '';
  try{ playerName = localStorage.getItem('squishPlayer') || ''; }catch(e){}

  const nameAsk   = document.getElementById('nameAsk');
  const nameInput = document.getElementById('nameInput');
  const postNote  = document.getElementById('postNote');
  const globalList = document.getElementById('globalList');
  const globalNote = document.getElementById('globalNote');

  if(!online()){
    const row = document.getElementById('globalRow');
    if(row) row.style.display = 'none';
    const og = document.getElementById('overGlobalBtn');
    if(og) og.style.display = 'none';
  }

  function note(el, text, kind){
    el.textContent = text || '';
    el.className = 'netnote' + (kind ? ' ' + kind : '');
  }

  function postScore(finalScore){
    if(!online() || !playerName || finalScore <= 0) return;
    note(postNote, 'Posting to the global board...');
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: playerName,
        score: finalScore,
        buddy: CHARS[picked].name,
        mode: mode,
        diff: diffKey
      })
    }).then(function(r){ return r.json().then(function(j){ return { ok: r.ok, j: j }; }); })
      .then(function(res){
        if(!res.ok){
          if(res.j && res.j.error === 'not_configured'){
            note(postNote, 'Global board is not switched on yet.', 'bad');
          } else if(res.j && res.j.error === 'slow_down'){
            note(postNote, 'Posting too fast, try the next round.', 'bad');
          } else {
            note(postNote, 'Could not reach the global board.', 'bad');
          }
          return;
        }
        if(res.j.improved) note(postNote, 'New personal best on the global board!', 'good');
        else note(postNote, 'Global best for ' + playerName + ' is still ' + res.j.best + '.', '');
      })
      .catch(function(){ note(postNote, 'Could not reach the global board.', 'bad'); });
  }

  function askOrPost(finalScore){
    nameAsk.classList.add('hidden');
    note(postNote, '');
    if(!online() || finalScore <= 0) return;
    if(playerName){ postScore(finalScore); return; }
    nameInput.value = '';
    nameAsk.classList.remove('hidden');
  }

  document.getElementById('nameSave').addEventListener('click', function(){
    const v = nameInput.value.trim().slice(0, 14);
    if(!v){ nameInput.focus(); return; }
    playerName = v;
    try{ localStorage.setItem('squishPlayer', v); }catch(e){}
    nameAsk.classList.add('hidden');
    sfx.tap();
    postScore(parseInt(document.getElementById('finalScore').textContent, 10) || 0);
  });
  nameInput.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ e.preventDefault(); document.getElementById('nameSave').click(); }
  });

  let boardBuddy = null;                 // null means the overall board

  function buildFilter(){
    const strip = document.getElementById('bFilter');
    if(strip.children.length) return;    // build once
    const mk = (label, img, val) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      if(img) btn.innerHTML = '<img src="' + img + '" alt="">' + escapeText(label);
      else { btn.className = 'allbtn'; btn.textContent = label; }
      btn.addEventListener('click', function(){
        boardBuddy = val;
        [].forEach.call(strip.children, function(c){ c.classList.remove('sel'); });
        btn.classList.add('sel');
        sfx.tap();
        renderGlobal();
      });
      strip.appendChild(btn);
      return btn;
    };
    mk('All', null, null).classList.add('sel');
    CHARS.forEach(function(c){ mk(c.name.split(' ')[0], c.src, c.name); });
  }

  function renderGlobal(){
    buildFilter();
    globalList.innerHTML = '<li class="empty">Loading...</li>';
    note(globalNote, '');
    fetch(API + (boardBuddy ? '?buddy=' + encodeURIComponent(boardBuddy) : ''), { headers: { 'Accept': 'application/json' } })
      .then(function(r){ return r.json().then(function(j){ return { ok: r.ok, j: j }; }); })
      .then(function(res){
        globalList.innerHTML = '';
        if(!res.ok){
          globalList.innerHTML = '<li class="empty">Board unavailable</li>';
          note(globalNote, res.j && res.j.error === 'not_configured'
            ? 'Add the Upstash for Redis integration in Vercel to switch this on.'
            : 'Something went wrong fetching the board.', 'bad');
          return;
        }
        const rows = (res.j && res.j.rows) || [];
        if(!rows.length){
          globalList.innerHTML = '<li class="empty">' +
            (boardBuddy ? 'Nobody has posted with ' + escapeText(boardBuddy) + ' yet' : 'Nobody has posted yet. Be first!') +
            '</li>';
          return;
        }
        rows.forEach(function(e, i){
          const ci = CHARS.map(function(c){ return c.name; }).indexOf(e.buddy);
          const c = ci > -1 ? CHARS[ci] : null;
          const li = document.createElement('li');
          li.className = (i === 0 ? 'top1 ' : '') + (e.name === playerName ? 'me' : '');
          li.innerHTML =
            '<span class="rank">' + (i === 0 ? '\uD83C\uDFC6' : '#' + (i + 1)) + '</span>' +
            (c ? '<img src="' + c.src + '" alt="">' : '') +
            '<span>' + escapeText(e.name) +
            '<small>' + (e.buddy ? escapeText(e.buddy) + ' \u00B7 ' : '') +
            (e.mode === 'endless' ? 'Endless' : '60s') + ' \u00B7 ' +
            (DIFFS[e.diff] ? DIFFS[e.diff].label : 'Normal') +
            (e.at ? ' \u00B7 ' + e.at : '') + '</small></span>' +
            '<b>' + e.score + '</b>';
          globalList.appendChild(li);
        });
        note(globalNote, (boardBuddy ? 'Best runs with ' + boardBuddy + '. ' : '') +
          (playerName ? 'Posting as ' + playerName : ''));
      })
      .catch(function(){
        globalList.innerHTML = '<li class="empty">Board unavailable</li>';
        note(globalNote, 'Could not reach the board. Are you offline?', 'bad');
      });
  }

  // names come back from a server other people write to, so never trust them as markup
  function escapeText(t){
    return String(t).replace(/[&<>"']/g, function(ch){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch];
    });
  }

  let globalFrom = screenTitle;
  document.getElementById('globalBtn').addEventListener('click', function(){
    sfx.tap(); globalFrom = screenTitle; renderGlobal(); show(screenGlobal);
  });
  document.getElementById('overGlobalBtn').addEventListener('click', function(){
    sfx.tap(); globalFrom = screenOver; renderGlobal(); show(screenGlobal);
  });
  document.getElementById('globalBackBtn').addEventListener('click', function(){
    sfx.tap(); show(globalFrom);
  });

  /* ---------------- squad book + badges ---------------- */
  const BADGES = [
    { id:'flawless2', t:'Untouchable', d:'Finish a full 60s round on Normal or Storm without losing a heart', ico:'\u2764\uFE0F' },
    { id:'streak20',  t:'On a roll',   d:'Reach a x4 streak of 20 catches without a hit',                      ico:'\u26A1' },
    { id:'storm2',    t:'Storm rider', d:'Survive the boss untouched on Normal or Storm',                     ico:'\u26C8\uFE0F' },
    { id:'score100',  t:'Centurion',   d:'Score 100 in a single run',                                         ico:'\u2B50' },
    { id:'allsquad',  t:'Full squad',  d:'Catch every buddy that falls from the sky (the twins never do)',     ico:'\uD83C\uDFC6' },
    { id:'endless150',t:'Marathon',    d:'Last two and a half minutes in Endless',                            ico:'\u23F1\uFE0F' },
    { id:'mimic8',    t:'Sparkle thief',d:'Catch 8 of ME\u2019s sparkle mimics in one run',                    ico:'\u2728' },
    { id:'popper14',  t:'Cloud buster',d:'Blast 14 clouds out of the sky in a single run',                    ico:'\uD83E\uDEE7' },
    { id:'foundtwin', t:'Twin trouble', d:'Score a run as Devin, the brother hiding behind ME\u2019s tile',      ico:'\uD83D\uDC09' },
    { id:'tempest',   t:'Tempest',     d:'Score 60 or more on Storm difficulty',                              ico:'\uD83C\uDF2A\uFE0F' }
  ];
  function loadJSON(key, fallback){
    try{ return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }catch(e){ return fallback; }
  }
  function saveJSON(key, v){ try{ localStorage.setItem(key, JSON.stringify(v)); }catch(e){} }
  let squad = loadJSON('squishSquad', {});
  let buddyBest = loadJSON('squishBuddyBest', {});
  let badges = loadJSON('squishBadges', {});

  function renderSquad(){
    const grid = document.getElementById('squadGrid');
    grid.innerHTML = '';
    CHARS.forEach(function(c, i){
      const n = squad[i] || 0;
      const pb = buddyBest[i] || 0;
      const twin = TWIN_IDS.indexOf(i) > -1;
      const d = document.createElement('div');
      d.className = 'sq' + ((n || pb) ? '' : ' locked');
      d.innerHTML = '<img src="' + c.src + '" alt=""><span>' + c.name + '</span><b>' +
        (pb ? 'best ' + pb : (n ? n + ' caught' : (twin ? 'never falls' : 'not yet'))) + '</b>';
      grid.appendChild(d);
    });
    const brow = document.getElementById('badgeRow');
    brow.innerHTML = '';
    BADGES.forEach(function(b){
      const got = !!badges[b.id];
      const d = document.createElement('div');
      d.className = 'bdg' + (got ? ' got' : '');
      d.innerHTML = '<span class="ico">' + b.ico + '</span><span>' + b.t + '<small>' + b.d + '</small></span>';
      brow.appendChild(d);
    });
    const total = CHARS.reduce(function(a, c, i){ return a + (squad[i] || 0); }, 0);
    const found = FALLABLE.filter(function(i){ return squad[i]; }).length;
    document.getElementById('squadTally').textContent =
      found + ' of ' + FALLABLE.length + ' buddies met  \u00B7  ' + total + ' caught in all';
  }
  document.getElementById('squadBtn').addEventListener('click', function(){ sfx.tap(); renderSquad(); show(screenSquad); });
  document.getElementById('squadBackBtn').addEventListener('click', function(){ sfx.tap(); show(screenTitle); });

  /* flash preference (persisted) */
  const flashOpt = document.getElementById('flashOpt');
  let noFlash = false;
  try{ noFlash = localStorage.getItem('squishNoFlash') === '1'; }catch(e){}
  flashOpt.checked = noFlash;
  document.body.classList.toggle('noflash', noFlash);
  flashOpt.addEventListener('change', function(){
    noFlash = this.checked;
    document.body.classList.toggle('noflash', noFlash);
    try{ localStorage.setItem('squishNoFlash', noFlash ? '1' : '0'); }catch(e){}
  });

  document.getElementById('muteBtn').addEventListener('click', function(){
    muted = !muted;
    this.textContent = muted ? '🔇' : '🔊';
    if(muted) stopMusic(); else if(running) startMusic();
    if(!muted) sfx.tap();
  });

  /* ---------------- controls ---------------- */
  /* A mouse steers by hovering: the buddy goes where the cursor is. A finger
     steers by dragging: the buddy moves as far as the thumb does, times a
     little gain, from wherever it was. That way the thumb can sit in the bottom
     corner instead of on top of the buddy, covering the very thing you are
     trying to catch with. A tap on its own does nothing, so a stray touch never
     teleports you under a cloud. */
  const DRAG_GAIN = 1.35;
  let dragId = -1, dragX0 = 0, dragPx0 = 0;
  app.addEventListener('pointerdown', function(e){
    if(!running) return;
    if(e.pointerType === 'mouse'){ targetX = e.clientX; return; }
    dragId = e.pointerId; dragX0 = e.clientX; dragPx0 = targetX;
  });
  app.addEventListener('pointermove', function(e){
    if(!running) return;
    if(e.pointerType === 'mouse'){ targetX = e.clientX; return; }
    if(e.pointerId !== dragId) return;
    targetX = dragPx0 + (e.clientX - dragX0) * DRAG_GAIN;
  });
  function endDrag(e){ if(e.pointerId === dragId) dragId = -1; }
  app.addEventListener('pointerup', endDrag);
  app.addEventListener('pointercancel', endDrag);
  window.addEventListener('keydown', function(e){
    if(e.key === 'ArrowLeft' || e.key === 'a') keyDir = -1;
    else if(e.key === 'ArrowRight' || e.key === 'd') keyDir = 1;
  });
  window.addEventListener('keyup', function(e){
    if(['ArrowLeft','a','ArrowRight','d'].indexOf(e.key) > -1) keyDir = 0;
  });

  /* ---------------- game ---------------- */
  function begin(){
    show(null);
    stage.innerHTML = '';
    fallers = []; particles = [];
    shots = []; shotT = 0; cloudsPopped = 0;
    perk = perkOf(picked);
    maxHearts = diff().hearts + (perk.hearts || 0);
    shieldCap = perk.shieldMax || 1;
    shield = perk.shield ? 1 : 0;
    score = 0; hearts = maxHearts; timeLeft = roundLen(); combo = 0; elapsed = 0; spawnT = 0;
    waveIdx = 0; paused = false; trailT = 0; mercyT = 0; dragId = -1;
    combo = 0; comboT = 0; bestCombo = 0; bossCleared = false; mimicsCaught = 0; purseUses = 0;
    pw.magnet = 0; pw.slow = 0; pw.x2 = 0; pw.blaster = 0;
    runCaught = {};
    if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
    app.scrollLeft = 0; app.scrollTop = 0;    // belt and braces where overflow:clip is missing
    blindOn = !!perk.blind; lastBlindX = -999; earT = 0;
    sizeBlind();
    blindEl.classList.toggle('on', blindOn);
    app.classList.toggle('night', !!perk.night);
    comboPill.classList.remove('on');
    pwRow.innerHTML = '';
    bossState = 'none'; bossT = 0; bossShots = 0; bossHurt = false;
    nextBossAt = isEndless() ? 32 : BOSS_AT;
    if(bossEl){ bossEl.remove(); bossEl = null; }
    resetSky();
    pauseEl.classList.add('hidden');
    stormEl.style.opacity = 0;
    waveEl.classList.remove('go');
    scoreVal.textContent = '0';
    timeVal.textContent = isEndless() ? 0 : roundLen();
    document.querySelector('#timePill .cap').textContent = isEndless() ? 'Survived' : 'Time';
    timePill.classList.remove('low');
    drawHearts();
    hud.classList.remove('hidden');

    playerShadow = document.createElement('div');
    playerShadow.id = 'playerShadow';
    stage.appendChild(playerShadow);

    player = document.createElement('div');
    player.id = 'player';
    player.innerHTML = '<div class="body"><img src="' + CHARS[picked].src + '" alt=""></div>';
    shieldEl = null;
    if(shield) makeShieldRing();
    stage.appendChild(player);

    resize();
    px = targetX = lastPx = W / 2;
    placePlayer();

    let n = 3;
    countdown.classList.remove('hidden');
    countdown.innerHTML = '<b>3</b>';
    sfx.tick();
    const iv = setInterval(function(){
      n--;
      if(n > 0){ countdown.innerHTML = '<b>' + n + '</b>'; sfx.tick(); }
      else if(n === 0){ countdown.innerHTML = '<b>GO!</b>'; sfx.go(); }
      else {
        clearInterval(iv);
        countdown.classList.add('hidden');
        running = true;
        app.classList.add('playing');
        lastT = performance.now();
        startMusic();
        raf = requestAnimationFrame(loop);
      }
    }, 750);
  }

  function setPaused(on){
    if(!player || (!running && !paused)) return;
    if(on && running){
      paused = true; running = false;
      cancelAnimationFrame(raf);
      stopMusic();
      pauseEl.classList.remove('hidden');
      app.classList.remove('playing');
    } else if(!on && paused){
      paused = false; running = true;
      pauseEl.classList.add('hidden');
      startMusic();
      app.classList.add('playing');
      lastT = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }
  pauseBtn.addEventListener('click', function(){ sfx.tap(); setPaused(!paused); });
  document.getElementById('resumeBtn').addEventListener('click', function(){ sfx.tap(); setPaused(false); });
  document.getElementById('quitBtn').addEventListener('click', function(){
    sfx.tap(); paused = false; pauseEl.classList.add('hidden'); running = true; finish();
  });
  window.addEventListener('keydown', function(e){
    if(e.key === 'Escape' || e.key === 'p' || e.key === 'P'){
      if(running || paused){ e.preventDefault(); setPaused(!paused); }
    }
  });
  window.addEventListener('blur', function(){ if(running) setPaused(true); });

  /* Every hazard on screen is stunned and swept away, and every friend,
     star and bubble still falling is collected where it stands. */
  function firePurse(cx, cy){
    const bl = document.getElementById('blast');
    const reach = Math.max(W, H) * 2.1;
    bl.style.width = reach + 'px';
    bl.style.height = reach + 'px';
    bl.style.left = cx + 'px';
    bl.style.top = cy + 'px';
    if(!reduceMotion){ bl.classList.remove('go'); void bl.offsetWidth; bl.classList.add('go'); }

    let zapped = 0, grabbed = 0, gained = 0;
    const m = multiplier() * (pwActive('x2') ? 2 : 1);

    for(let i = fallers.length - 1; i >= 0; i--){
      const f = fallers[i];
      if(!f || f.dead) continue;
      const fx = f.x, fy = f.y;

      if(f.kind === 'rain' || f.kind === 'bolt' || f.kind === 'mimic'){
        zapped++;
        burst(fx, fy, ['#FF8CE6','#FFD9F5','#FFF'], 12);
      } else if(f.kind === 'friend') {
        grabbed++;
        gained += m + (perk.friendBonus || 0);
        if(f.ci >= 0) runCaught[f.ci] = (runCaught[f.ci] || 0) + 1;
        burst(fx, fy, ['#FF4F9A','#2FCBBD','#FFC53C','#FFF'], 10);
      } else if(f.kind === 'star'){
        grabbed++;
        gained += (perk.star || 5) * m;
        burst(fx, fy, ['#FFC53C','#FFE9A8','#FFF'], 12);
      } else {
        continue;   // other bubbles are left alone, go and get them
      }
      f.el.remove();
      fallers.splice(i, 1);
    }

    score += gained;
    scoreVal.textContent = score;
    purseUses++;
    floatText('\u2728 PURSE! +' + gained, W / 2, H * 0.36, 'star');
    if(zapped) floatText(zapped + ' cloud' + (zapped === 1 ? '' : 's') + ' stunned', W / 2, H * 0.46, 'close');
    sfx.purse();
    buzz(HAPTIC.purse);
    shake();
  }

  function makeShieldRing(){
    if(!player) return;
    if(!shieldEl){
      shieldEl = document.createElement('div');
      shieldEl.id = 'shieldRing';
      player.appendChild(shieldEl);
    }
    shieldEl.classList.toggle('two', shield > 1);
  }
  function dropShieldRing(){
    if(!shieldEl) return;
    const se = shieldEl; shieldEl = null;
    se.classList.add('pop');
    setTimeout(function(){ se.remove(); }, 420);
  }

  function drawCombo(){
    const m = multiplier();
    if(m <= 1 || !running && combo === 0){ comboPill.classList.remove('on'); return; }
    if(!comboPill.classList.contains('on')){ comboPill.classList.add('on'); }
    comboVal.textContent = 'x' + m;
    comboBarFill.style.width = Math.max(0, Math.min(1, comboT / comboWindow()) * 100) + '%';
  }

  function drawPowerUps(){
    pwRow.innerHTML = '';
    Object.keys(PW).forEach(function(k){
      if(pw[k] <= 0) return;
      const d = document.createElement('div');
      d.className = 'pw';
      d.innerHTML = '<svg viewBox="0 0 100 100">' + PW[k].ico + '</svg>' + Math.ceil(pw[k]);
      pwRow.appendChild(d);
    });
  }

  function drawHearts(){
    heartsEl.innerHTML = '';
    for(let i=0;i<maxHearts;i++){
      const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
      s.setAttribute('viewBox','0 0 24 24');
      s.setAttribute('class','heart' + (i < hearts ? '' : ' gone'));
      s.innerHTML = '<path d="M12 21s-8-5.2-8-10.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.6C20 15.8 12 21 12 21z" fill="#FF4F9A" stroke="#fff" stroke-width="1.6"/>';
      heartsEl.appendChild(s);
    }
  }

  function placePlayer(){
    const s = playerSize();
    player.style.transform = 'translate(' + (px - s/2) + 'px,' + (groundY - s + 12) + 'px)';
    playerShadow.style.transform = 'translate(' + (px - 44) + 'px,' + (groundY + 6) + 'px)';
    // the pocket he can hear travels with him. Only repainted once he has
    // actually moved, so standing still costs nothing
    if(blindOn && Math.abs(px - lastBlindX) > 3){
      lastBlindX = px;
      blindEl.style.setProperty('--bx', Math.round(px) + 'px');
      blindEl.style.setProperty('--by', Math.round(groundY - s/2 + 12) + 'px');
    }
  }

  function sizeBlind(){
    blindEl.style.setProperty('--brx', Math.round(Math.max(150, W * 0.30)) + 'px');
    blindEl.style.setProperty('--bry', Math.round(Math.max(290, H * 0.40)) + 'px');
  }

  function spawn(){
    const s = fallerSize();
    const d = ramp();
    const r = Math.random();

    // hazard mix widens as the round goes on
    const starC = 0.07 * (perk.starLuck || 1);
    const boltC = elapsed > Math.max(boltAt(), perk.grace || 0) ? 0.03 + 0.11 * stormRamp() : 0;
    const calm = perk.grace ? Math.max(5, perk.grace) : 5;
    const rainC = (elapsed > calm ? 0.055 + 0.18 * d : 0) * (perk.rain || 1);

    // power-ups start showing up once the round has warmed up
    // rate stays roughly where it was. The fix for power-ups drowning out
    // perks was making them shorter and specialised, not making them scarce
    const pwC = (elapsed > 9 ? 0.050 : 0) * (perk.pwLuck || 1);

    // ME sneaks in dressed as somebody's friend
    // ME is the only buddy her mimics show up for: for everyone else the
    // feature is switched off entirely
    const mimicC = (perk.mimicAlly && elapsed > 10 && COW_IDS.length)
      ? (0.05 + 0.03 * d) * (perk.mimicRate || 1) : 0;

    let kind = 'friend';
    if(r < starC) kind = 'star';
    else if(r < starC + boltC) kind = 'bolt';
    else if(r < starC + boltC + rainC) kind = 'rain';
    else if(r < starC + boltC + rainC + pwC) kind = pickPowerUp();
    else if(r < starC + boltC + rainC + pwC + mimicC) kind = 'mimic';

    const atX = s/2 + Math.random() * Math.max(1, W - s);
    if(kind === 'bolt') telegraphBolt(atX, s); else spawnAt(kind, atX, s);

    // a lamb never goes anywhere by herself
    if(kind === 'friend' && perk.flock && Math.random() < perk.flock){
      const side = Math.random() < 0.5 ? -1 : 1;
      const bx = Math.max(s/2, Math.min(W - s/2, atX + side * s * (1.15 + Math.random() * 0.55)));
      spawnAt('friend', bx, s);
    }
  }

  /* Lightning is the fastest thing in the game, so it gets a warning: a
     crackle at the top of the sky over where it is about to drop. Half a
     second is enough to step aside if you are looking, not enough to ignore. */
  const BOLT_WARN = 0.32;
  function telegraphBolt(atX, s){
    const w = document.createElement('div');
    w.className = 'warn';
    w.style.left = atX + 'px';
    w.textContent = '\u26A1';
    stage.appendChild(w);
    const startedAt = elapsed;
    (function wait(){
      if(!running && !paused){ w.remove(); return; }
      if(elapsed - startedAt < BOLT_WARN){ requestAnimationFrame(wait); return; }
      w.remove();
      if(running) spawnAt('bolt', atX, s);
    })();
  }

  function isGift(k){ return k === 'pheart' || k === 'pshield' || k === 'magnet' || k === 'slow' || k === 'x2' || k === 'blaster' || k === 'purse'; }

  function pickPowerUp(){
    const pool = ['magnet','slow','x2','pshield','blaster'];
    // the purse is the rare one: one slot against everything else, ME finds more
    // rare, but not so rare you never meet one: roughly one every other round,
    // and one or two a round for ME
    if(Math.random() < 0.12 * (perk.purseLuck || 1)) return 'purse';
    if(hearts < maxHearts){
      pool.push('pheart','pheart');
      if(perk.heartLuck) for(let i = 0; i < Math.round(perk.heartLuck); i++) pool.push('pheart');
    }
    return pool[(Math.random() * pool.length) | 0];
  }

  function spawnAt(kind, atX, s){
    const d = ramp();
    const el = document.createElement('div');
    el.className = 'faller';
    el.style.width = s + 'px';
    el.style.height = s + 'px';

    let ci = -1;
    if(kind === 'mimic'){
      // she copies a random buddy; the sparkles are the tell
      const dis = COW_IDS.length
        ? COW_IDS[(Math.random() * COW_IDS.length) | 0]
        : FALLABLE[(Math.random() * FALLABLE.length) | 0];
      el.classList.add('mimic');
      el.innerHTML = '<div class="art"><img src="' + CHARS[dis].src + '" alt="">' +
        '<span class="spk s1"></span><span class="spk s2"></span><span class="spk s3"></span></div>';
    } else if(kind === 'friend'){
      ci = FALLABLE[(Math.random() * FALLABLE.length) | 0];
      el.innerHTML = '<div class="art"><img src="' + CHARS[ci].src + '" alt=""></div>';
    } else if(kind === 'star'){
      el.innerHTML = '<div class="art"><svg viewBox="0 0 100 100" style="width:100%;height:100%;filter:drop-shadow(0 0 10px rgba(255,197,60,.9))">' +
        '<path d="M50 6l12.6 25.6 28.3 4.1-20.5 20 4.9 28.2L50 70.6 24.7 83.9l4.9-28.2-20.5-20 28.3-4.1z" fill="#FFC53C" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>' +
        '<circle cx="40" cy="45" r="4.2" fill="#4B2A55"/><circle cx="60" cy="45" r="4.2" fill="#4B2A55"/>' +
        '<path d="M42 56c3 4 13 4 16 0" stroke="#4B2A55" stroke-width="4" fill="none" stroke-linecap="round"/></svg></div>';
    } else if(isGift(kind)){
      const art =
        kind === 'purse'   ? PURSE_SVG :
        kind === 'pheart'  ? '<path d="M50 84S16 62 16 40a17 17 0 0 1 34-8 17 17 0 0 1 34 8c0 22-34 44-34 44z" fill="#FF4F9A" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>' :
        kind === 'pshield' ? '<path d="M50 14l30 12v24c0 20-13 32-30 38-17-6-30-18-30-38V26z" fill="#78DEFF" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>' :
        PW[kind].ico;
      const glow = kind === 'purse' ? '#FF3FB0' : kind === 'pheart' ? '#FF4F9A' : kind === 'pshield' ? '#78DEFF' : PW[kind].col;
      el.classList.add('gift');
      if(kind === 'purse') el.classList.add('purse');
      el.innerHTML = '<div class="art"><svg viewBox="0 0 100 100" style="width:100%;height:100%;filter:drop-shadow(0 0 11px ' + glow + ')">' +
        '<circle cx="50" cy="50" r="46" fill="rgba(255,255,255,.34)" stroke="#fff" stroke-width="4"/>' + art + '</svg></div>';
    } else if(kind === 'bolt'){
      el.classList.add('bolt');
      el.innerHTML = '<div class="art"><svg viewBox="0 0 100 100" style="width:100%;height:100%">' +
        '<g><ellipse cx="50" cy="38" rx="36" ry="21" fill="#6B7C90" stroke="#fff" stroke-width="4"/>' +
        '<path d="M36 30l8 8M44 30l-8 8M58 30l8 8M66 30l-8 8" stroke="#2B3947" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M40 50c4 5 16 5 20 0" stroke="#2B3947" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<path d="M54 54L34 82h14l-6 16 24-30H50z" fill="#FFD84D" stroke="#fff" stroke-width="4" stroke-linejoin="round"/></g></svg></div>';
    } else {
      el.innerHTML = '<div class="art"><svg viewBox="0 0 100 100" style="width:100%;height:100%">' +
        '<g><ellipse cx="50" cy="44" rx="38" ry="24" fill="#9FB4C6" stroke="#fff" stroke-width="4"/>' +
        '<circle cx="38" cy="40" r="4" fill="#3B4A5A"/><circle cx="62" cy="40" r="4" fill="#3B4A5A"/>' +
        '<path d="M40 54c4-5 16-5 20 0" stroke="#3B4A5A" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<path d="M30 70l-5 14M50 72l-5 14M70 70l-5 14" stroke="#7FC7E8" stroke-width="6" stroke-linecap="round"/></g></svg></div>';
    }

    const f = {
      el: el, kind: kind, size: s, ci: ci,
      x: atX,
      y: -s,
      // pixels a second, scaled to the screen height so a drop takes about the
      // same time to reach the ground on a phone as it does on a laptop
      vy: (118 + 252 * d + Math.random() * (40 + 40 * d)) * heightScale()
          * (kind === 'bolt' ? 1.46 * (perk.bolt || 1) : 1)
          * (kind === 'rain' ? (perk.rainFall || 1) : 1)
          * (isGift(kind) ? 0.72 : 1)
          * (perk.fall || 1),
      sway: (Math.random() * 2 - 1) * (kind === 'bolt' ? 10 : kind === 'mimic' ? 34 + 26 * d : 20 + 26 * d),
      webbed: 0,
      veered: 0,
      phase: Math.random() * 6.28,
      near: false,
      dead: false
    };
    stage.appendChild(el);
    fallers.push(f);
    if(kind === 'bolt' && !reduceMotion && !noFlash){
      flashEl.style.opacity = 0.10;
      setTimeout(function(){ flashEl.style.opacity = 0; }, 140);
    }
  }

  /* ---------------- the storm boss ----------------
     rolls in near the end of the round, rains hazards from overhead,
     and pays out if you come through it without losing a heart */
  function bossSize(){ return Math.max(140, Math.min(250, W * 0.27)); }
  function bossTopY(){ return Math.max(78, H * 0.105); }

  function startBoss(){
    bossState = 'enter'; bossT = 0; bossShots = 0; bossHurt = false;
    bossDir = Math.random() < 0.5 ? 1 : -1;
    bossX = bossDir > 0 ? -bossSize() * 0.6 : W + bossSize() * 0.6;
    bossEl = document.createElement('div');
    bossEl.id = 'boss';
    const bs = bossSize();
    bossEl.style.width = bs + 'px';
    bossEl.style.height = (bs * 0.72) + 'px';
    bossEl.innerHTML = '<div class="bossArt"><svg viewBox="0 0 200 144" style="width:100%;height:100%">' +
      '<ellipse cx="100" cy="76" rx="92" ry="52" fill="#5A6B82" stroke="#fff" stroke-width="6"/>' +
      '<ellipse cx="52" cy="58" rx="34" ry="28" fill="#6B7C90"/>' +
      '<ellipse cx="148" cy="58" rx="36" ry="30" fill="#6B7C90"/>' +
      '<path d="M62 56l20 16M82 56l-20 16M118 56l20 16M138 56l-20 16" stroke="#232F3C" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M74 100c14 14 38 14 52 0" stroke="#232F3C" stroke-width="8" fill="none" stroke-linecap="round"/>' +
      '<path d="M96 16l-18 26h13l-8 22 26-32h-15z" fill="#FFD84D" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>' +
      '</svg></div>';
    stage.appendChild(bossEl);
    waveEl.textContent = 'Big storm incoming!';
    waveEl.classList.remove('go'); void waveEl.offsetWidth; waveEl.classList.add('go');
    sfx.wave(); buzz(HAPTIC.gift);
  }

  function bossShoot(){
    const s = fallerSize() * 0.95;
    const r = Math.random();
    // mostly rain, a little lightning, and a friend or two so you can still score
    const kind = r < 0.16 ? 'friend' : (r < 0.40 ? 'bolt' : 'rain');
    spawnAt(kind, Math.max(s/2, Math.min(W - s/2, bossX + (Math.random()*2-1) * s)), s);
  }

  function stepBoss(dt){
    if(bossState === 'none' || bossState === 'done'){
      const room = isEndless() || timeLeft > 9;
      if(elapsed >= nextBossAt && room){ startBoss(); }
      return;
    }
    if(bossState === 'done' || !bossEl) return;
    bossT += dt;
    const bs = bossSize();
    const targetY = bossTopY();

    if(bossState === 'enter'){
      bossX += bossDir * 320 * dt;
      const mid = W / 2;
      if((bossDir > 0 && bossX >= mid) || (bossDir < 0 && bossX <= mid)){
        bossX = mid; bossState = 'fight'; bossT = 0;
        bossEl.classList.add('charging');
      }
    } else if(bossState === 'fight'){
      bossX += bossDir * 92 * dt;
      const lo = Math.min(W * 0.5, bs * 0.55), hi = Math.max(W * 0.5, W - bs * 0.55);
      if(bossX > hi){ bossX = hi; bossDir = -1; } else if(bossX < lo){ bossX = lo; bossDir = 1; }
      if(bossT >= 0.55 + bossShots * 0.02 && bossShots < BOSS_SHOTS){
        bossShots++; bossT = 0;
        bossShoot();
      }
      if(bossShots >= BOSS_SHOTS && bossT > 1.5){
        bossState = 'leave';
        bossEl.classList.remove('charging');
        if(!bossHurt){
          bossCleared = true;
          score += 15;
          scoreVal.textContent = score;
          floatText('storm survived! +15', W/2, H*0.34, 'star');
          waveEl.textContent = 'Storm survived! +15';
          sfx.star(); buzz(HAPTIC.bossWin);
        } else {
          waveEl.textContent = 'Storm passed';
          sfx.wave();
        }
        waveEl.classList.remove('go'); void waveEl.offsetWidth; waveEl.classList.add('go');
      }
    } else {
      bossX += bossDir * 300 * dt;
      bossEl.style.opacity = 0;
      if(bossX < -bs || bossX > W + bs){
        bossEl.remove(); bossEl = null; bossState = 'done';
        nextBossAt = elapsed + (isEndless() ? 34 : 1e9);
        return;
      }
    }
    bossEl.style.transform = 'translate(' + (bossX - bs/2) + 'px,' + targetY + 'px)';
  }

  function floatText(text, x, y, cls){
    const d = document.createElement('div');
    d.className = 'float' + (cls ? ' ' + cls : '');
    d.textContent = text;
    d.style.left = x + 'px';
    d.style.top = y + 'px';
    stage.appendChild(d);
    setTimeout(function(){ d.remove(); }, 900);
  }

  function shake(){
    if(reduceMotion) return;
    world.classList.remove('shake'); void world.offsetWidth; world.classList.add('shake');
    setTimeout(function(){ world.classList.remove('shake'); }, 420);
  }

  function ripple(x, y, size, color){
    if(reduceMotion) return;
    const d = document.createElement('div');
    d.className = 'ring';
    d.style.left = x + 'px'; d.style.top = y + 'px';
    d.style.width = size + 'px'; d.style.height = size + 'px';
    if(color) d.style.borderColor = color;
    stage.appendChild(d);
    setTimeout(function(){ d.remove(); }, 520);
  }

  function burst(x, y, colors, n){
    for(let i=0;i<n;i++){
      const a = Math.random() * Math.PI * 2;
      const sp = 90 + Math.random() * 210;
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90,
        r: 3 + Math.random() * 6,
        life: 0.5 + Math.random() * 0.5, age: 0,
        c: colors[(Math.random() * colors.length) | 0],
        spin: Math.random() * 6
      });
    }
  }

  /* Everything a lost heart does besides the heart itself. A hit costs you
     two thirds of the streak rather than all of it: losing a x4 run to one
     cloud was the moment people put the phone down, but keeping half of it
     made the multiplier too cheap to hold. */
  function tookHit(){
    combo = Math.floor(combo / 3); comboT = combo > 0 ? comboWindow() : 0; drawCombo();
    mercyT = MERCY;
    player.classList.add('mercy');
    if(perk.rally && hearts > 0){
      pw.x2 = Math.max(pw.x2, perk.rally);
      drawPowerUps();
      floatText('bounce back! x2', px, groundY - playerSize() - 30, 'star');
    }
  }

  function hit(f){
    f.dead = true;
    const cx = f.x, cy = f.y;
    const el = f.el;
    el.style.setProperty('--tf', 'translate(' + (cx - f.size/2) + 'px,' + (cy - f.size/2) + 'px)');
    el.classList.add('pop');
    setTimeout(function(){ el.remove(); }, 340);

    if(f.kind === 'mimic'){
      mimicsCaught++;
      // the disguise drops the moment you grab her
      const img = f.el.querySelector('img');
      if(img) img.src = CHARS[ME_INDEX >= 0 ? ME_INDEX : 0].src;
      f.el.classList.add('caught');
      const spks = f.el.querySelectorAll('.spk');
      for(let i = 0; i < spks.length; i++) spks[i].remove();
      ripple(cx, cy, f.size * 1.5, 'rgba(255,150,235,.95)');
      burst(cx, cy, ['#FF8CE6','#C9A6FF','#9BE8FF','#FFF','#FFE28C'], 26);

      // only the twins see these, and for both of them they are pure upside
      const mpay = perk.mimicPay || 3;
      score += mpay; combo++; comboT = comboWindow();
      floatText((perk.mimicTaunt || 'teehee!') + ' +' + mpay, cx, cy, 'star');
      scoreVal.textContent = score;
      drawCombo();
      sfx.mischief();
      buzz(HAPTIC.mimic);
      player.classList.remove('squish'); void player.offsetWidth; player.classList.add('squish');
      return;
    }

    if(isGift(f.kind)){
      ripple(cx, cy, f.size * 1.4, 'rgba(255,255,255,.95)');
      if(f.kind === 'pheart'){
        hearts = Math.min(maxHearts, hearts + 1);
        drawHearts();
        floatText('+1 heart', cx, cy);
        burst(cx, cy, ['#FF4F9A','#FFB3D4','#FFF'], 22);
      } else if(f.kind === 'purse'){
        firePurse(cx, cy);
      } else if(f.kind === 'pshield'){
        const before = shield;
        shield = Math.min(shieldCap, shield + 1);
        makeShieldRing();
        floatText(shield > 1 ? 'double shield!' : (before ? 'shield full' : 'shield!'), cx, cy, 'close');
        burst(cx, cy, ['#78DEFF','#D6F5FF','#FFF'], 22);
      } else {
        const boost = f.kind === 'magnet'  ? (perk.magnetBoost || 1)
                    : f.kind === 'slow'    ? (perk.slowBoost   || 1)
                    : f.kind === 'blaster' ? (perk.blastBoost  || 1) : 1;
        pw[f.kind] = PW[f.kind].dur * boost;
        floatText(PW[f.kind].t + '!', cx, cy, 'star');
        burst(cx, cy, [PW[f.kind].col,'#FFF'], 22);
      }
      drawPowerUps();
      player.classList.remove('squish'); void player.offsetWidth; player.classList.add('squish');
      sfx.shield(); buzz(HAPTIC.gift);
      return;
    }

    if(f.kind === 'bolt' || f.kind === 'rain'){
      if(shield > 0){
        shield--;
        if(shield > 0){
          shieldEl.classList.remove('two');
          shieldEl.classList.remove('flash'); void shieldEl.offsetWidth; shieldEl.classList.add('flash');
        } else {
          dropShieldRing();
        }
        combo = 0; comboT = 0; drawCombo();
        floatText(shield > 0 ? 'blocked! (1 left)' : 'blocked!', cx, cy, 'close');
        ripple(cx, cy, f.size * 1.5, 'rgba(120,222,255,.95)');
        burst(cx, cy, ['#78DEFF','#D6F5FF','#FFF'], 20);
        sfx.shield(); buzz(HAPTIC.block);
        return;
      }
    }

    if(f.kind === 'bolt' && perk.boltImmune){
      // immunity alone scored nothing, so eating lightning is income for her
      const eaten = perk.boltPay || 0;
      score += eaten;
      if(eaten){ combo++; comboT = comboWindow(); scoreVal.textContent = score; drawCombo(); }
      ripple(cx, cy, f.size * 1.6, 'rgba(255,216,77,.95)');
      burst(cx, cy, ['#FFD84D','#FFF3B8','#8CD2FF','#FFF'], 22);
      floatText(eaten ? 'nom! +' + eaten : 'nom!', cx, cy, 'star');
      sfx.shield();
      player.classList.remove('squish'); void player.offsetWidth; player.classList.add('squish');
      return;
    }

    if(f.kind === 'bolt'){
      hearts = Math.max(0, hearts - 1);
      if(bossState === 'fight' || bossState === 'enter') bossHurt = true;
      tookHit();
      drawHearts();
      if(!reduceMotion && !noFlash){ flashEl.classList.remove('zap'); void flashEl.offsetWidth; flashEl.classList.add('zap'); }
      player.classList.remove('ouch'); void player.offsetWidth; player.classList.add('ouch');
      floatText('zap!', cx, cy, 'zap');
      burst(cx, cy, ['#FFD84D','#FFF3B8','#6B7C90','#FFF'], 20);
      shake(); buzz(HAPTIC.zap);
      sfx.zap();
      if(hearts === 0) finish();
      return;
    }

    if(f.kind === 'rain'){
      hearts = Math.max(0, hearts - 1);
      if(bossState === 'fight' || bossState === 'enter') bossHurt = true;
      tookHit();
      drawHearts();
      player.classList.remove('ouch'); void player.offsetWidth; player.classList.add('ouch');
      floatText('oops!', cx, cy, 'bad');
      burst(cx, cy, ['#9FB4C6','#7FC7E8','#D9EAF5'], 14);
      shake(); buzz(HAPTIC.rain);
      sfx.bad();
      if(hearts === 0) finish();
      return;
    }

    player.classList.remove('squish'); void player.offsetWidth; player.classList.add('squish');

    ripple(cx, cy, f.size * 1.25);

    const wasM = multiplier();
    combo++;
    if(combo > bestCombo) bestCombo = combo;
    comboT = comboWindow();
    const tier = multiplier();
    if(tier > wasM){ sfx.comboUp(tier); buzz(HAPTIC.comboUp); }
    const m = tier * (pwActive('x2') ? 2 : 1);

    if(f.kind === 'star'){
      const sv = (perk.star || 5) * m;
      score += sv;
      floatText('+' + sv, cx, cy, 'star');
      burst(cx, cy, ['#FFC53C','#FFE9A8','#FFF','#FF4F9A'], 26);
      sfx.star();
    } else {
      // flat and unmultiplied, so a x4 streak pays 5 rather than 8
      // a friend rescued off the ground out of Cheryl's web is worth extra
      const webSave = (f.webbed && perk.webTime) ? 1 : 0;
      const fv = m + (perk.friendBonus || 0) + webSave;
      score += fv;
      floatText(m > 1 ? '+' + fv + '  x' + m : '+' + fv, cx, cy);
      burst(cx, cy, ['#FF4F9A','#2FCBBD','#FFC53C','#8C6BFF','#FFF'], 16);
      sfx.catch(combo);
      if(f.ci >= 0) runCaught[f.ci] = (runCaught[f.ci] || 0) + 1;
    }
    scoreVal.textContent = score;
    drawCombo();
  }

  /* ---------------- blaster ----------------
     A power-up bubble turns your buddy into a popper for five seconds. She
     fires on her own, straight up, and every rain cloud or lightning cloud a
     bubble touches bursts for points. The big storm counts as a cloud too,
     just a very large one that pays a little per hit. Friends, stars and other
     bubbles are never shot: they pass right through, so you cannot ruin your
     own round by holding still under a good drop. */

  function fireShot(){
    if(!player) return;
    const ps = playerSize();
    shots.push({
      x: px,
      y: groundY - ps + 8,
      r: Math.max(12, ps * 0.19),
      age: 0
    });
    if(!reduceMotion){
      for(let i = 0; i < 4; i++){
        particles.push({
          x: px + (Math.random() * 2 - 1) * 7,
          y: groundY - ps + 12,
          vx: (Math.random() * 2 - 1) * 60,
          vy: -30 - Math.random() * 70,
          g: 260, a: 0.8,
          r: 2 + Math.random() * 3,
          life: 0.24, age: 0,
          c: i % 2 ? '#FFFFFF' : '#FF4FC3',
          spin: Math.random() * 6
        });
      }
    }
    sfx.blast();
  }

  function popCloud(f, idx){
    f.dead = true;
    const cx = f.x, cy = f.y;
    const pay = POP_PAY[f.kind] || 2;
    // flat pay, like a friend: a bubble should not compound with x2 and the
    // streak, or one lucky blaster during a x4 run would outscore the round
    score += pay;
    cloudsPopped++;
    combo++;
    if(combo > bestCombo) bestCombo = combo;
    comboT = comboWindow();
    scoreVal.textContent = score;
    drawCombo();
    f.el.remove();
    fallers.splice(idx, 1);
    ripple(cx, cy, f.size * 1.35, 'rgba(255,182,232,.95)');
    burst(cx, cy, f.kind === 'bolt'
      ? ['#FFD84D','#FFB6E8','#FF4FC3','#FFF']
      : ['#9FB4C6','#FFB6E8','#FF4FC3','#FFF'], 18);
    floatText('pop! +' + pay, cx, cy, 'star');
    sfx.popCloud();
    buzz(HAPTIC.pop);
  }

  function stepShots(dt){
    if(pwActive('blaster')){
      shotT -= dt;
      if(shotT <= 0){ fireShot(); shotT = SHOT_GAP; }
    } else {
      shotT = 0;
    }

    for(let i = shots.length - 1; i >= 0; i--){
      const b = shots[i];
      b.age += dt;
      b.y -= SHOT_SPEED * dt;
      if(b.y < -40){ shots.splice(i, 1); continue; }

      let used = false;

      for(let j = fallers.length - 1; j >= 0; j--){
        const f = fallers[j];
        if(!f || f.dead) continue;
        if(f.kind !== 'rain' && f.kind !== 'bolt') continue;
        const wob = Math.sin(elapsed * 1.7 + f.phase) * f.sway;
        const dx = (f.x + wob) - b.x, dy = f.y - b.y;
        const rr = f.size * 0.42 + b.r;
        if(dx * dx + dy * dy < rr * rr){
          popCloud(f, j);
          used = true;
          break;
        }
      }
      if(used){ shots.splice(i, 1); continue; }

      // the boss, as an ellipse in page pixels
      if(bossEl && (bossState === 'enter' || bossState === 'fight')){
        const bs = bossSize();
        const ex = (b.x - bossX) / (bs * 0.46);
        const ey = (b.y - (bossTopY() + bs * 0.38)) / (bs * 0.26);
        if(ex * ex + ey * ey < 1){
          score += 1;
          scoreVal.textContent = score;
          burst(b.x, b.y, ['#FFB6E8','#FF4FC3','#FFF'], 9);
          bossEl.classList.remove('hurt'); void bossEl.offsetWidth; bossEl.classList.add('hurt');
          sfx.bossPing();
          shots.splice(i, 1);
          continue;
        }
      }
    }
  }

  /* drawn on the effects canvas, which sits above the fallers, so a bubble
     reads as passing in front of a cloud right up to the moment it bursts */
  function drawShots(){
    for(let i = 0; i < shots.length; i++){
      const b = shots[i];
      const r = b.r * (1 + Math.sin(b.age * 24) * 0.08);
      ctx.save();
      // a soft tail, so a bubble reads as travelling rather than hovering
      const tail = ctx.createLinearGradient(b.x, b.y, b.x, b.y + r * 4.2);
      tail.addColorStop(0, 'rgba(255,143,214,.45)');
      tail.addColorStop(1, 'rgba(255,143,214,0)');
      ctx.fillStyle = tail;
      ctx.beginPath();
      ctx.moveTo(b.x - r * 0.52, b.y);
      ctx.lineTo(b.x + r * 0.52, b.y);
      ctx.lineTo(b.x, b.y + r * 4.2);
      ctx.closePath();
      ctx.fill();
      const g = ctx.createRadialGradient(b.x - r * 0.3, b.y - r * 0.35, r * 0.08, b.x, b.y, r);
      g.addColorStop(0, 'rgba(255,255,255,.98)');
      g.addColorStop(0.55, 'rgba(255,182,232,.84)');
      g.addColorStop(1, 'rgba(255,79,195,.40)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 6.2832); ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = 'rgba(255,255,255,.95)';
      ctx.stroke();
      ctx.beginPath(); ctx.arc(b.x - r * 0.34, b.y - r * 0.38, r * 0.25, 0, 6.2832);
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fill();
      ctx.restore();
    }
  }

  function loop(now){
    if(!running) return;
    let dt = (now - lastT) / 1000;
    lastT = now;
    if(dt > 0.05) dt = 0.05;
    elapsed += dt;

    // timer: counts down in a round, counts up in endless
    if(isEndless()){
      const cur = Math.floor(elapsed);
      if(cur !== Math.floor(elapsed - dt)) timeVal.textContent = cur;
    } else {
      const prev = Math.ceil(timeLeft);
      timeLeft -= dt;
      const cur = Math.max(0, Math.ceil(timeLeft));
      if(cur !== prev){
        timeVal.textContent = cur;
        if(cur <= 10){ timePill.classList.add('low'); if(cur > 0) sfx.tick(); }
      }
      if(timeLeft <= 0){ finish(); return; }
    }

    // player
    const spd = perk.speed || 1;
    const snap = perk.snap || 1;
    if(keyDir) targetX += keyDir * 620 * spd * dt;
    targetX = Math.max(40, Math.min(W - 40, targetX));
    // snap is the one that you actually feel with a finger or a mouse:
    // it is how tightly the buddy tracks where you are pointing
    px += (targetX - px) * Math.min(1, dt * 13 * snap);
    placePlayer();

    // motion trail
    if(!reduceMotion){
      const vel = Math.abs(px - lastPx) / Math.max(dt, 0.001);
      trailT -= dt;
      if(vel > (perk.trail ? 130 : 340) && trailT <= 0){
        trailT = 0.035;
        particles.push({
          x: lastPx, y: groundY - playerSize()/2 + 12,
          vx: 0, vy: 0, g: 0, a: 0.34,
          r: playerSize() * 0.19, life: 0.3, age: 0,
          c: '#FFFFFF', spin: 0
        });
      }
    }
    lastPx = px;

    // spawn
    // combo decays if you stop catching
    if(combo > 0){
      comboT -= dt;
      if(comboT <= 0){ combo = 0; comboT = 0; }
      drawCombo();
    }

    if(earT > 0) earT = Math.max(0, earT - dt);
    if(mercyT > 0){
      mercyT = Math.max(0, mercyT - dt);
      if(mercyT === 0) player.classList.remove('mercy');
    }

    // power-up timers
    let pwChanged = false;
    for(const k in pw){
      if(pw[k] > 0){
        const was = Math.ceil(pw[k]);
        pw[k] = Math.max(0, pw[k] - dt);
        if(Math.ceil(pw[k]) !== was) pwChanged = true;
      }
    }
    if(pwChanged) drawPowerUps();

    // sky drifts toward night (repainted a few times a second, not every frame)
    skyT -= dt;
    if(skyT <= 0){
      skyT = 0.4;   // a full-screen gradient repaint; twice a second is plenty
      let t;
      if(perk.night){
        t = 1;                                   // Devin's half of the plush: night, all round
      } else if(isEndless()){
        const cyc = (elapsed / 78) % 2;          // a full day/night cycle every 156s
        t = cyc > 1 ? 2 - cyc : cyc;
      } else {
        t = Math.min(1, elapsed / roundLen());
      }
      paintSky(t);
    }

    // the boss owns the sky while it is up
    stepBoss(dt);

    // storm darkens + wave call-outs
    const sr = stormRamp();
    const so = (sr * 0.30).toFixed(3);
    if(so !== lastStormOp){ lastStormOp = so; stormEl.style.opacity = so; }
    if(waveIdx < WAVES.length && elapsed >= WAVES[waveIdx].at){
      waveEl.textContent = WAVES[waveIdx].text;
      waveEl.classList.remove('go'); void waveEl.offsetWidth; waveEl.classList.add('go');
      sfx.wave();
      waveIdx++;
    }

    // spawn: the gap tightens steadily
    spawnT -= dt;
    if(spawnT <= 0){
      spawn();
      const d = ramp();
      const busy = (bossState === 'enter' || bossState === 'fight') ? 2.1 : 1;
      spawnT = (1.00 - 0.605 * Math.pow(d, 0.85)) * (0.86 + Math.random() * 0.28) * busy;
    }

    // fallers
    const ps = playerSize();
    const pcx = px, pcy = groundY - ps/2 + 12;
    for(let i = fallers.length - 1; i >= 0; i--){
      const f = fallers[i];
      if(!f){ continue; }
      if(f.dead){ fallers.splice(i,1); continue; }
      if(!f.webbed) f.y += f.vy * dt * (pwActive('slow') ? (perk.slowDeep || 0.64) : 1);
      const wob = Math.sin(elapsed * 1.7 + f.phase) * f.sway;
      const dx = f.x + wob - f.size/2;
      f.el.style.transform = 'translate(' + dx + 'px,' + (f.y - f.size/2) + 'px)';

      // magnet power-up sweeps everything friendly toward you; Jelly Pull is the gentler perk
      const wantPull = (f.kind === 'friend' || f.kind === 'star');
      if(wantPull && pwActive('magnet')){
        const gap = pcx - f.x;
        const strength = 250 * (perk.magnetBoost ? 1.35 : 1);
        f.x += Math.sign(gap) * Math.min(Math.abs(gap), strength * dt);
      } else if(perk.veer && f.kind === 'rain' && f.y > pcy - H * 0.22 && (f.veered || earT <= 0)){
        // He only picks a cloud up once it is nearly on him, he only nudges it
        // gently, and his ears need a rest afterwards, so in a squall most of
        // them get through. Lightning is far too fast to hear at all and is
        // never nudged. Anything dead overhead is the other exception: with no
        // eyes there is no telling which way to lean, so it lands on him.
        const gap = (f.x + wob) - pcx;
        const ax = Math.abs(gap);
        if(ax > ps * 0.30 && ax < ps * 1.40){
          if(!f.veered){ f.veered = 1; earT = EAR_REST; sfx.whoosh(); }
          f.x += Math.sign(gap) * 120 * dt;
        }
      } else if(perk.pull && f.kind === 'friend'){
        const gap = pcx - f.x;
        if(Math.abs(gap) < ps * 2.4 && f.y > pcy - H * 0.42){
          f.x += Math.sign(gap) * Math.min(Math.abs(gap), 190 * dt);
        }
      }

      const ddx = (f.x + wob) - pcx;
      const ddy = f.y - pcy;
      const rr = (f.size + ps) * 0.40 * (perk.reach || 1) * touchReach();

      // near miss on a hazard: skill reward for cutting it fine
      if(!f.near && (f.kind === 'rain' || f.kind === 'bolt')){
        const nr = rr * 1.6;
        if(ddx*ddx + ddy*ddy < nr*nr && ddx*ddx + ddy*ddy >= rr*rr && f.y > pcy - ps){
          f.near = true;
          score += (perk.nearBonus || 1);
          scoreVal.textContent = score;
          floatText('close! +' + (perk.nearBonus || 1), f.x + wob, f.y, 'close');
          sfx.whoosh();
        }
      }

      if(ddx*ddx + ddy*ddy < rr*rr){
        // just been hit: clouds pass through for a moment so two in a row
        // cannot take two hearts before there is any chance to move
        if(mercyT > 0 && (f.kind === 'rain' || f.kind === 'bolt') && !(f.kind === 'bolt' && perk.boltImmune)) continue;
        f.x = f.x + wob;
        hit(f);
        const j = fallers.indexOf(f);
        if(j > -1) fallers.splice(j,1);
        if(!running) return;
        continue;
      }
      // Sticky Web: a friend that reaches the ground waits in a web for a moment
      if(perk.webTime && f.kind === 'friend' && !f.webbed && f.y > groundY - f.size * 0.1){
        f.webbed = perk.webTime;
        f.vy = 0; f.sway = 0;
        f.y = groundY - f.size * 0.28;
        f.el.classList.add('webbed');
      }
      if(f.webbed){
        f.webbed -= dt;
        if(f.webbed <= 0){
          f.el.remove();
          fallers.splice(i, 1);
          continue;
        }
      }

      if(!f.webbed && f.y - f.size/2 > H + 20){
        // a friend slipping past no longer breaks the streak, because with several
        // falling at once that made the multiplier unreachable. The streak now
        // lives on the catch timer and breaks only when you take damage.
        if(f.kind === 'friend' && combo > 0) comboT = Math.min(comboT, 1.6);
        f.el.remove();
        fallers.splice(i,1);
      }
    }

    stepShots(dt);
    stepParticles(dt);
    drawShots();
    raf = requestAnimationFrame(loop);
  }

  function stepParticles(dt){
    ctx.clearRect(0,0,W,H);
    for(let i = particles.length - 1; i >= 0; i--){
      const p = particles[i];
      p.age += dt;
      if(p.age >= p.life){ particles.splice(i,1); continue; }
      p.vy += (p.g === undefined ? 900 : p.g) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      const k = 1 - p.age / p.life;
      ctx.save();
      ctx.globalAlpha = Math.max(0, k) * (p.a === undefined ? 1 : p.a);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin + p.age * 7);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.roundRect(-p.r, -p.r*0.7, p.r*2, p.r*1.4, p.r*0.5);
      ctx.fill();
      ctx.restore();
    }
  }

  function confetti(){
    const colors = ['#FF4F9A','#2FCBBD','#FFC53C','#8C6BFF','#93E4AC','#FFF'];
    for(let i=0;i<160;i++){
      particles.push({
        x: Math.random() * W, y: -20 - Math.random() * H * 0.5,
        vx: (Math.random()*2-1) * 90, vy: 60 + Math.random() * 160,
        r: 4 + Math.random() * 6, life: 2.4 + Math.random() * 1.6, age: 0,
        c: colors[(Math.random()*colors.length)|0], spin: Math.random()*6
      });
    }
    let t = performance.now();
    (function anim(now){
      const dt = Math.min(0.05, (now - t)/1000); t = now;
      // undo gravity spike for confetti fall
      for(const p of particles) p.vy -= 700 * dt;
      stepParticles(dt);
      if(particles.length) requestAnimationFrame(anim);
    })(t);
  }

  function finish(){
    running = false;
    stopMusic();
    app.classList.remove('playing');
    cancelAnimationFrame(raf);
    fallers.forEach(function(f){ f.el.remove(); });
    fallers = [];
    shots = []; shotT = 0;
    if(bossEl){ bossEl.remove(); bossEl = null; }
    bossState = 'none';
    blindOn = false;
    blindEl.classList.remove('on');
    app.classList.remove('night');
    resetSky();
    hud.classList.add('hidden');
    comboPill.classList.remove('on');
    pwRow.innerHTML = '';
    pw.magnet = 0; pw.slow = 0; pw.x2 = 0; pw.blaster = 0;
    paused = false;
    pauseEl.classList.add('hidden');
    world.classList.remove('shake');
    if(hearts === 0) buzz(HAPTIC.gameOver);
    stormEl.style.opacity = 0;
    waveEl.classList.remove('go');
    if(player) player.remove();
    if(playerShadow) playerShadow.remove();

    // ---- payday: what you kept, and how little you started with ----
    const fullRound = !isEndless() && timeLeft <= 0.05;   // clock ran out, not quit
    const base = score;
    // only pay for hearts you carried to the end of a real round, otherwise
    // quitting on turn one would be the best-paying move in the game
    const heartBonus = fullRound ? hearts * 12 : 0;
    // hoarding shields is Mel's whole identity, so it should pay
    const shieldBonus = (fullRound && perk.shieldMax > 1) ? shield * 12 : 0;
    // fewer starting hearts means a braver run, so it pays more
    // base this on the difficulty's heart count, not maxHearts: otherwise a perk
    // that grants an extra heart silently zeroes out its owner's bonus
    const braveRate = Math.max(0, (4 - diff().hearts) * 0.18);
    const braveBonus = Math.round(base * braveRate);
    score = base + heartBonus + shieldBonus + braveBonus;

    const tally = document.getElementById('tally');
    tally.innerHTML = '';
    function tallyRow(label, sub, val, cls){
      const li = document.createElement('li');
      li.className = cls || '';
      li.innerHTML = '<span>' + label + (sub ? '<small>' + sub + '</small>' : '') + '</span><b>' + val + '</b>';
      tally.appendChild(li);
    }
    const caughtSub = [];
    if(purseUses) caughtSub.push(purseUses + ' purse' + (purseUses === 1 ? '' : 's') + ' popped');
    if(cloudsPopped) caughtSub.push(cloudsPopped + ' cloud' + (cloudsPopped === 1 ? '' : 's') + ' blasted');
    tallyRow('Caught', caughtSub.join(', '), base);
    if(heartBonus) tallyRow('Hearts saved', hearts + ' left at 12 each', '+' + heartBonus, 'bonus');
    if(shieldBonus) tallyRow('Shields kept', shield + ' unspent at 12 each', '+' + shieldBonus, 'bonus');
    if(braveBonus) tallyRow('Brave start', 'on ' + diff().label + ', +' + Math.round(braveRate * 100) + '%', '+' + braveBonus, 'bonus');

    // fold this run into the squad book
    for(const k in runCaught) squad[k] = (squad[k] || 0) + runCaught[k];
    saveJSON('squishSquad', squad);

    // and remember your best with the buddy you just used
    if(score > (buddyBest[picked] || 0)){
      buddyBest[picked] = score;
      saveJSON('squishBuddyBest', buddyBest);
    }

    // badges
    const earned = [];
    const hard = diffKey !== 'chill';                       // Chill no longer counts for the tough ones
    function award(id){ if(!badges[id]){ badges[id] = 1; earned.push(id); } }
    if(fullRound && hard && hearts === maxHearts && score > 0) award('flawless2');
    if(bestCombo >= 20) award('streak20');
    if(bossCleared && hard) award('storm2');
    if(score >= 100) award('score100');
    if(FALLABLE.every(function(i){ return squad[i]; })) award('allsquad');
    if(isEndless() && elapsed >= 150) award('endless150');
    if(mimicsCaught >= 8) award('mimic8');
    if(cloudsPopped >= 14) award('popper14');
    if(CHARS[picked].name === 'Devin' && score > 0) award('foundtwin');
    if(diffKey === 'storm' && score >= 60) award('tempest');
    if(earned.length) saveJSON('squishBadges', badges);

    // leaderboard
    let rank = -1;
    if(score > 0){
      rank = saveRun({
        score: score, ci: picked, mode: mode, diff: diffKey,
        date: new Date().toLocaleDateString(undefined, { month:'short', day:'numeric' })
      });
    }

    let best = 0;
    try{ best = parseInt(localStorage.getItem('squishBest') || '0', 10) || 0; }catch(e){}
    const isBest = score > best;
    if(isBest){ try{ localStorage.setItem('squishBest', String(score)); }catch(e){} best = score; }

    const goal = isEndless() ? [14, 34, 60] : [12, 30, 52];
    const tier = score >= goal[2] ? 3 : score >= goal[1] ? 2 : score >= goal[0] ? 1 : 0;
    const titles = ['Nice try, squishy!', 'Good catching!', 'Super squisher!', 'Squish Squad champion!'];
    const eyebrows = ['Round over', 'Round over', 'Wow', 'Legendary'];

    document.getElementById('overBuddy').src = CHARS[picked].src;
    document.getElementById('overTitle').textContent = titles[tier];
    document.getElementById('overEyebrow').textContent = hearts === 0 ? 'Out of hearts!'
      : isEndless() ? 'Lasted ' + Math.floor(elapsed) + 's' : eyebrows[tier];
    document.getElementById('finalScore').textContent = score;

    let line;
    if(earned.length){
      const b = BADGES.filter(function(x){ return x.id === earned[0]; })[0];
      line = b.ico + ' New badge: ' + b.t + (earned.length > 1 ? ' +' + (earned.length - 1) + ' more' : '');
    } else if(isBest && score > 0){
      line = '\uD83C\uDF89 New best score!';
    } else if(rank === 0){
      line = '\uD83C\uDFC5 Top run!';
    } else if(rank > 0){
      line = 'Points  \u2022  #' + (rank + 1) + ' of your best 5';
    } else {
      line = 'Points  \u2022  Best: ' + best;
    }
    document.getElementById('bestLine').textContent = line;

    const row = document.getElementById('starRow');
    row.innerHTML = '';
    for(let i=0;i<3;i++){
      const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
      s.setAttribute('viewBox','0 0 100 100');
      s.innerHTML = '<path d="M50 6l12.6 25.6 28.3 4.1-20.5 20 4.9 28.2L50 70.6 24.7 83.9l4.9-28.2-20.5-20 28.3-4.1z" fill="#FFC53C" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>';
      row.appendChild(s);
      if(i < tier) setTimeout(function(el){ return function(){ el.classList.add('on'); tone(700 + Math.random()*200, 0, .2, 'sine', .14); }; }(s), 320 + i * 300);
    }

    askOrPost(score);
    show(screenOver);
    setTimeout(function(){ sfx.fanfare(); if(tier >= 2 && !reduceMotion) confetti(); }, 260);
  }

  // roundRect fallback
  if(!ctx.roundRect){
    CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){
      this.beginPath();
      this.moveTo(x+r,y); this.arcTo(x+w,y,x+w,y+h,r); this.arcTo(x+w,y+h,x,y+h,r);
      this.arcTo(x,y+h,x,y,r); this.arcTo(x,y,x+w,y,r); this.closePath();
      return this;
    };
  }

  makeFlowers();
  makeStars();
  resize();
})();
