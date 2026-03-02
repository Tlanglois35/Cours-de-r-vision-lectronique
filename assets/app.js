// ═══════════════════════════════
// STATE
// ═══════════════════════════════
const state = {
  currentSection: 'home',
  progress: {complexes:0, signaux:0, impedances:0, puissances:0, methodologie:0, triphase:0, aop_bases:0, aop_lineaire:0, aop_oscillateurs:0},
  scores: {}
};

// ═══════════════════════════════
// NAVIGATION
// ═══════════════════════════════
function showHome() {
  hideAll();
  document.getElementById('home').style.display = 'flex';
  state.currentSection = 'home';
  updateProgress(0);
}

function showSection(id) {
  hideAll();
  const el = document.getElementById(id);
  if(el) {
    el.style.display = 'block';
    el.classList.add('active');
  }
  state.currentSection = id;
  window.scrollTo(0,0);
  updateProgress((id === 'modules-elec' || id === 'modules-aop') ? 10 : 20);
  if (id === 'progression') renderProgression();
}

async function loadLessonSection(id) {
  const sectionId = 'lesson-' + id;
  let el = document.getElementById(sectionId);
  if (el) return el;

  const mount = document.getElementById('lessons-mount') || document.body;
  const res = await fetch(`sections/${sectionId}.html`);
  if (!res.ok) throw new Error(`Impossible de charger ${sectionId}`);
  const html = await res.text();

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();
  el = wrapper.firstElementChild;
  mount.appendChild(el);

  Object.keys(QCMs).forEach(mid => renderQCM(mid, QCMs[mid]));
  attachComplexPlaneHandlers();
  return el;
}

async function showLesson(id) {
  if (id === 'triphasé') id = 'triphase';
  hideAll();
  const el = await loadLessonSection(id);
  if (!el) return;
  el.style.display = 'block';
  el.classList.add('active');
  state.currentSection = 'lesson-' + id;
  window.scrollTo(0,0);
  updateProgress(40);
}

function hideAll() {
  document.querySelectorAll('.hero, .section').forEach(el => {
    el.style.display = 'none';
    el.classList.remove('active');
  });
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
}

// Progress bar
function updateProgress(pct) {
  document.getElementById('progressBar').style.width = pct + '%';
}

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  if (total > 0) {
    const pct = Math.max(10, (scrolled/total)*100);
    document.getElementById('progressBar').style.width = pct + '%';
  }
});

// ═══════════════════════════════
// EXPAND CARDS
// ═══════════════════════════════
function toggleExpand(header) {
  const content = header.nextElementSibling;
  const icon = header.querySelector('.expand-icon');
  const isOpen = content.classList.contains('open');
  content.classList.toggle('open');
  icon.textContent = isOpen ? '+' : '−';
}

// ═══════════════════════════════
// FORM SWITCHER
// ═══════════════════════════════
function showForm(idx) {
  [0,1,2].forEach(i => {
    document.getElementById('form-'+i).style.display = i === idx ? 'block' : 'none';
  });
  document.querySelectorAll('.step').forEach((s,i) => {
    s.classList.toggle('active', i === idx);
  });
}

// ═══════════════════════════════
// CANVAS PLAN COMPLEXE
// ═══════════════════════════════
function drawComplex() {
  const reEl = document.getElementById('cRe');
  const imEl = document.getElementById('cIm');
  const canvas = document.getElementById('complexCanvas');
  const modEl = document.getElementById('cMod');
  const argEl = document.getElementById('cArg');
  const expEl = document.getElementById('cExp');
  if (!reEl || !imEl || !canvas || !modEl || !argEl || !expEl) return;

  const a = parseFloat(reEl.value) || 0;
  const b = parseFloat(imEl.value) || 0;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2;
  const scale = Math.min(W,H) / (2 * Math.max(Math.abs(a), Math.abs(b), 3) * 1.4);

  ctx.clearRect(0,0,W,H);

  // Background
  ctx.fillStyle = '#12121a';
  ctx.fillRect(0,0,W,H);

  // Grid
  ctx.strokeStyle = '#2a2a3a';
  ctx.lineWidth = 1;
  for(let i=-10;i<=10;i++) {
    ctx.beginPath(); ctx.moveTo(cx+i*scale*2,0); ctx.lineTo(cx+i*scale*2,H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,cy+i*scale*2); ctx.lineTo(W,cy+i*scale*2); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = '#3a3a5a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(W,cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx,H); ctx.stroke();

  // Labels axes
  ctx.fillStyle = '#8888aa';
  ctx.font = '12px Space Mono';
  ctx.fillText('Re', W-25, cy-8);
  ctx.fillText('Im', cx+8, 15);
  ctx.fillText('0', cx+5, cy+15);

  // Point Z
  const px = cx + a*scale;
  const py = cy - b*scale;

  // Dashed projections
  ctx.strokeStyle = '#2a2a3a';
  ctx.lineWidth = 1;
  ctx.setLineDash([5,5]);
  ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px,cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(cx,py); ctx.stroke();
  ctx.setLineDash([]);

  // Vector
  ctx.strokeStyle = '#e8f428';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py); ctx.stroke();

  // Arrow head
  const angle = Math.atan2(-(py-cy), px-cx);
  ctx.fillStyle = '#e8f428';
  ctx.beginPath();
  ctx.moveTo(px,py);
  ctx.lineTo(px-12*Math.cos(angle-0.4), py+12*Math.sin(angle-0.4));
  ctx.lineTo(px-12*Math.cos(angle+0.4), py+12*Math.sin(angle+0.4));
  ctx.fill();

  // Point
  ctx.fillStyle = '#e8f428';
  ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2); ctx.fill();

  // Angle arc
  const mod = Math.sqrt(a*a+b*b);
  if(mod > 0) {
    const phi = Math.atan2(b,a);
    ctx.strokeStyle = '#ff5e3a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, -phi, phi < 0);
    ctx.stroke();
    ctx.fillStyle = '#ff5e3a';
    ctx.font = '13px Space Mono';
    ctx.fillText('φ', cx+32, cy-5);
  }

  // Label Z
  ctx.fillStyle = '#e8f428';
  ctx.font = 'bold 14px Space Mono';
  ctx.fillText(`Z(${a},${b>0?'+'+b:b}j)`, px+8, py-8);

  // Label a on x
  ctx.fillStyle = '#3af4c8';
  ctx.font = '11px Space Mono';
  ctx.fillText('a='+a, px-15, cy+18);
  // Label b on y
  ctx.fillStyle = '#ff5e3a';
  ctx.fillText('b='+b, cx+5, py+4);

  // Update info
  const modZ = Math.sqrt(a*a+b*b);
  const argDeg = Math.atan2(b,a) * 180 / Math.PI;
  modEl.textContent = modZ.toFixed(3);
  argEl.textContent = argDeg.toFixed(1) + '°';
  expEl.textContent = modZ.toFixed(2) + '·e^(j' + argDeg.toFixed(0) + '°)';
}

function attachComplexPlaneHandlers() {
  const reInput = document.getElementById('cRe');
  const imInput = document.getElementById('cIm');
  if (!reInput || !imInput) return;
  if (!reInput.dataset.bound) {
    reInput.addEventListener('input', drawComplex);
    reInput.dataset.bound = '1';
  }
  if (!imInput.dataset.bound) {
    imInput.addEventListener('input', drawComplex);
    imInput.dataset.bound = '1';
  }
}

// ═══════════════════════════════
// CALCULATORS
// ═══════════════════════════════
function calcComplex() {
  const a = parseFloat(document.getElementById('calcA').value);
  const b = parseFloat(document.getElementById('calcB').value);
  const mod = Math.sqrt(a*a+b*b);
  const argRad = Math.atan2(b,a);
  const argDeg = argRad * 180 / Math.PI;
  document.getElementById('rMod').textContent = mod.toFixed(4);
  document.getElementById('rArg').textContent = argDeg.toFixed(2) + '°';
  document.getElementById('rArgR').textContent = argRad.toFixed(4) + ' rad';
  document.getElementById('rConj').textContent = a + (b>=0 ? ' − j' + Math.abs(b) : ' + j' + Math.abs(b));
  document.getElementById('rExp').textContent = mod.toFixed(3) + ' · e^(j' + argDeg.toFixed(1) + '°)';
  document.getElementById('calcResult').classList.add('show');
}

function calcProd() {
  const a1=parseFloat(document.getElementById('z1a').value), b1=parseFloat(document.getElementById('z1b').value);
  const a2=parseFloat(document.getElementById('z2a').value), b2=parseFloat(document.getElementById('z2b').value);
  const ra = a1*a2 - b1*b2, rb = a1*b2 + b1*a2;
  const mod = Math.sqrt(ra*ra+rb*rb);
  const arg = Math.atan2(rb,ra)*180/Math.PI;
  document.getElementById('rProd').textContent = ra.toFixed(3) + (rb>=0?' + j':' − j') + Math.abs(rb).toFixed(3);
  document.getElementById('rProdMod').textContent = mod.toFixed(4);
  document.getElementById('rProdArg').textContent = arg.toFixed(2) + '°';
  document.getElementById('prodResult').classList.add('show');
}

function calcDiv() {
  const a1=parseFloat(document.getElementById('z1a').value), b1=parseFloat(document.getElementById('z1b').value);
  const a2=parseFloat(document.getElementById('z2a').value), b2=parseFloat(document.getElementById('z2b').value);
  const denom = a2*a2 + b2*b2;
  if(denom===0){alert('Z₂ ne peut pas être nul !');return;}
  const ra = (a1*a2 + b1*b2)/denom, rb = (b1*a2 - a1*b2)/denom;
  const mod = Math.sqrt(ra*ra+rb*rb);
  const arg = Math.atan2(rb,ra)*180/Math.PI;
  document.getElementById('rProd').textContent = ra.toFixed(3) + (rb>=0?' + j':' − j') + Math.abs(rb).toFixed(3);
  document.getElementById('rProdMod').textContent = mod.toFixed(4);
  document.getElementById('rProdArg').textContent = arg.toFixed(2) + '°';
  document.getElementById('prodResult').classList.add('show');
}

function calcSignal() {
  const smax=parseFloat(document.getElementById('sMax').value);
  const freq=parseFloat(document.getElementById('sFreq').value);
  const seff = smax/Math.sqrt(2);
  const T = 1/freq;
  const omega = 2*Math.PI*freq;
  document.getElementById('sEff').textContent = seff.toFixed(2) + ' V (ou A)';
  document.getElementById('sPeriod').textContent = (T*1000).toFixed(2) + ' ms';
  document.getElementById('sOmega').textContent = omega.toFixed(2) + ' rad/s';
  document.getElementById('sExpr').textContent = smax.toFixed(1) + '·sin(' + omega.toFixed(0) + 't)';
  document.getElementById('signalResult').classList.add('show');
}

function calcImpedance() {
  const R=parseFloat(document.getElementById('iR').value);
  const L=parseFloat(document.getElementById('iL').value)*1e-3;
  const C=parseFloat(document.getElementById('iC').value)*1e-6;
  const f=parseFloat(document.getElementById('iF').value);
  const omega=2*Math.PI*f;
  const XL=L*omega, XC=1/(C*omega), X=XL-XC;
  const modZ=Math.sqrt(R*R+X*X);
  const phi=Math.atan2(X,R)*180/Math.PI;
  document.getElementById('iXL').textContent = XL.toFixed(3) + ' Ω';
  document.getElementById('iXC').textContent = XC.toFixed(3) + ' Ω';
  document.getElementById('iX').textContent = X.toFixed(3) + ' Ω';
  document.getElementById('iZ').textContent = R.toFixed(2) + (X>=0?' + j':' − j') + Math.abs(X).toFixed(2) + ' Ω';
  document.getElementById('iMod').textContent = modZ.toFixed(3) + ' Ω';
  document.getElementById('iPhi').textContent = phi.toFixed(2) + '°';
  document.getElementById('iChar').textContent = X>0 ? '⚡ Inductif (Q>0)' : X<0 ? '⚡ Capacitif (Q<0)' : '⚡ Résistif pur';
  document.getElementById('impedanceResult').classList.add('show');
}

function calcPower() {
  const V=parseFloat(document.getElementById('pV').value);
  const I=parseFloat(document.getElementById('pI').value);
  const phi=parseFloat(document.getElementById('pPhi').value)*Math.PI/180;
  const P=V*I*Math.cos(phi), Q=V*I*Math.sin(phi), S=V*I;
  const cosP=Math.cos(phi);
  document.getElementById('pP').textContent = P.toFixed(1) + ' W';
  document.getElementById('pQ').textContent = Q.toFixed(1) + ' VAr';
  document.getElementById('pS').textContent = S.toFixed(1) + ' VA';
  document.getElementById('pCos').textContent = cosP.toFixed(4);
  document.getElementById('pVerif').textContent = '√('+ P.toFixed(0)+'²+'+Q.toFixed(0)+'²) = ' + Math.sqrt(P*P+Q*Q).toFixed(1) + ' ≈ ' + S.toFixed(1) + ' ✓';
  document.getElementById('powerResult').classList.add('show');
}

// ═══════════════════════════════
// QCM DATA
// ═══════════════════════════════
const QCMs = {
  complexes: [
    {
      q: "Quelle est la valeur de j² ?",
      opts: ["1", "−1", "j", "0"],
      correct: 1,
      expl: "<strong>j² = −1</strong> par définition. C'est le fondement de toute l'arithmétique complexe. De là découlent : j³ = −j, j⁴ = 1, et 1/j = −j."
    },
    {
      q: "Quel est le module de Z = 3 + j4 ?",
      opts: ["7", "1", "5", "√7"],
      correct: 2,
      expl: "|Z| = √(3² + 4²) = √(9+16) = √25 = <strong>5</strong>. C'est le théorème de Pythagore appliqué au plan complexe : le module est la distance à l'origine."
    },
    {
      q: "Quel est l'argument de Z = 1 + j1 ?",
      opts: ["0°", "30°", "45°", "90°"],
      correct: 2,
      expl: "φ = arctan(b/a) = arctan(1/1) = arctan(1) = <strong>45°</strong>. Z est à égale distance des axes réel et imaginaire, donc à 45°."
    },
    {
      q: "Quelle forme est la plus pratique pour multiplier deux complexes ?",
      opts: ["Algébrique (a+jb)", "Trigonométrique", "Exponentielle |Z|·e^jφ", "Toutes équivalentes"],
      correct: 2,
      expl: "<strong>Forme exponentielle</strong> : Z₁·Z₂ = |Z₁||Z₂|·e^{j(φ₁+φ₂)}. On multiplie les modules et on additionne les arguments. Beaucoup plus simple que développer (a+jb)(c+jd)."
    },
    {
      q: "En électricité sinusoïdale, que représente la multiplication par jω en notation complexe ?",
      opts: ["Une intégration temporelle", "Une dérivation temporelle", "Un changement d'amplitude uniquement", "Une rotation de −90°"],
      correct: 1,
      expl: "<strong>Dérivation temporelle</strong> : d/dt ↔ ×jω. En effet, dériver sin(ωt+φ) donne ω·cos(ωt+φ) = ω·sin(ωt+φ+π/2), ce qui correspond à ×ω et +90° = ×jω."
    },
    {
      q: "Si Z = 5∠30°, que vaut Z* (le conjugué) ?",
      opts: ["5∠−30°", "−5∠30°", "5∠150°", "1/5∠−30°"],
      correct: 0,
      expl: "<strong>Z* = 5∠−30°</strong>. Le conjugué conserve le module mais change le signe de l'argument (et de la partie imaginaire). Propriété : Z·Z* = |Z|² = 25 (réel !)."
    },
    {
      q: "Pourquoi utilise-t-on j et non i en électricité pour l'unité imaginaire ?",
      opts: ["Car j vient de 'jeu'", "Pour éviter la confusion avec le courant i(t)", "Car i est réservé aux intégrales", "Pur hasard historique"],
      correct: 1,
      expl: "<strong>Convention de notation</strong> : en électrotechnique, i(t) désigne le courant instantané. Pour éviter toute ambiguïté, les ingénieurs utilisent j pour l'unité imaginaire. Le concept mathématique est identique à i."
    },
    {
      q: "Pour calculer Z₁/Z₂ en forme algébrique, quelle technique utilise-t-on ?",
      opts: ["Diviser les parties réelles entre elles, idem imaginaires", "Multiplier par le conjugué de Z₂ au numérateur et dénominateur", "Soustraire les modules", "Impossible en forme algébrique"],
      correct: 1,
      expl: "<strong>Multiplication par le conjugué</strong> : Z₁/Z₂ = (Z₁·Z₂*)/(Z₂·Z₂*) = (Z₁·Z₂*)/|Z₂|². Le dénominateur devient réel, ce qui permet l'identification des parties réelle et imaginaire."
    },
    {
      q: "Si Z = 4 − j3 Ω, quel est son argument (approx.) ?",
      opts: ["+36,9°", "−36,9°", "+53,1°", "−53,1°"],
      correct: 1,
      expl: "arg(Z)=arctan(−3/4)=<strong>−36,9°</strong> (quadrant IV). Toujours vérifier le signe de la partie imaginaire pour le bon quadrant."
    }
  ],
  signaux: [
    {
      q: "Le réseau électrique français est à 230 V efficaces. Quelle est la valeur crête de la tension ?",
      opts: ["230 V", "163 V", "325 V", "460 V"],
      correct: 2,
      expl: "U_max = U_eff × √2 = 230 × 1,414 ≈ <strong>325 V</strong>. C'est la valeur qu'atteint réellement la tension à chaque demi-période. Important pour le dimensionnement de l'isolation des câbles."
    },
    {
      q: "Quelle est la pulsation ω du réseau 50 Hz ?",
      opts: ["50 rad/s", "100 rad/s", "157 rad/s", "314 rad/s"],
      correct: 3,
      expl: "ω = 2πf = 2π × 50 ≈ <strong>314,16 rad/s</strong>. La pulsation est l'argument temporel du sinus. Elle intervient dans Z_L = jωL et Z_C = 1/(jωC)."
    },
    {
      q: "Une charge inductive a son courant qui :",
      opts: ["Est en phase avec la tension", "Est en avance sur la tension", "Est en retard sur la tension", "A la même amplitude que la tension"],
      correct: 2,
      expl: "<strong>Retard</strong> de φ > 0°. Z_L = jωL → φ_Z = +90° → φ_I = φ_V − 90°. Moyen mnémotechnique CIVIL : pour l'inductance (L), V avant I. Le courant 'suit' la tension avec retard."
    },
    {
      q: "Qu'est-ce que la valeur efficace d'un signal ?",
      opts: [
        "La valeur maximale divisée par 2",
        "La valeur qui produit le même effet thermique qu'une tension continue de même valeur",
        "La valeur moyenne sur une demi-période",
        "La valeur instantanée à t = T/4"
      ],
      correct: 1,
      expl: "<strong>Effet thermique équivalent</strong> : P = V²_eff/R = V²_continu/R. Formule : V_eff = V_max/√2 ≈ 0,707·V_max. Le 230V du réseau est bien la valeur efficace — pas la valeur crête (325V)."
    },
    {
      q: "En convention récepteur, si p = u·i > 0, le dipôle :",
      opts: ["Fournit de l'énergie au circuit", "Reçoit de l'énergie du circuit", "Est neutre (ni source ni récepteur)", "Dissipe obligatoirement par effet Joule"],
      correct: 1,
      expl: "<strong>Reçoit de l'énergie</strong> (convention récepteur). En convention récepteur : p > 0 = réception, p < 0 = fourniture. C'est l'inverse de la convention générateur où p > 0 signifie que le dipôle fournit."
    },
    {
      q: "Quelle est la valeur moyenne d'un signal sinusoïdal sur une période complète ?",
      opts: ["V_max/2", "V_max/√2", "0", "V_max/π"],
      correct: 2,
      expl: "<strong>0</strong>. Sur une période, le signal est autant positif que négatif → valeur moyenne nulle. C'est pourquoi on ne peut pas mesurer un courant alternatif avec un galvanomètre (qui mesure la moyenne) : il faut un ampèremètre vrai-efficace (True RMS)."
    },
    {
      q: "La dérivée temporelle d/dt d'une grandeur sinusoïdale équivaut, en notation complexe, à :",
      opts: ["Diviser par jω", "Multiplier par jω", "Multiplier par ω uniquement", "Aucune correspondance simple"],
      correct: 1,
      expl: "<strong>Multiplier par jω</strong>. En temporel : d[V_max·sin(ωt+φ)]/dt = ωV_max·cos(ωt+φ) = ωV_max·sin(ωt+φ+π/2). En complexe : jω·V·e^{jφ} = ω·e^{jπ/2}·V·e^{jφ}. C'est la même chose !"
    },
    {
      q: "Pour représenter une grandeur sinusoïdale par son phaseur, quelles informations faut-il connaître ?",
      opts: [
        "Uniquement l'amplitude maximale",
        "L'amplitude maximale et la fréquence",
        "La valeur efficace et la phase initiale (à fréquence connue)",
        "La forme d'onde complète"
      ],
      correct: 2,
      expl: "<strong>Valeur efficace + phase initiale</strong> (à fréquence fixe). Le phaseur est un vecteur fixe dans le plan complexe : son module est la valeur efficace, son argument est la phase initiale. La fréquence est connue et commune à tout le circuit."
    },
    {
      q: "Pour I = 5∠20° A (efficace) à 50 Hz, quelle forme temporelle est correcte ?",
      opts: ["i(t)=5·sin(314t+20°)", "i(t)=7,07·sin(314t+20°)", "i(t)=7,07·cos(314t−20°)", "i(t)=5·cos(314t+20°)"],
      correct: 1,
      expl: "Le phaseur est en valeur efficace. On passe en temporel via Imax=√2·I=7,07 A, d'où <strong>i(t)=7,07·sin(314t+20°)</strong>."
    }
  ],
  impedances: [
    {
      q: "Un condensateur de 100 µF est alimenté à 50 Hz. Quelle est sa réactance capacitive X_C ?",
      opts: ["31,8 Ω", "3,14 Ω", "314 Ω", "0,0314 Ω"],
      correct: 0,
      expl: "X_C = 1/(ωC) = 1/(2π×50×100×10⁻⁶) = 1/(0,03141) ≈ <strong>31,8 Ω</strong>. La réactance capacitive diminue quand f augmente (le condensateur 'laisse passer' les hautes fréquences)."
    },
    {
      q: "Un circuit RLC série a R=10Ω, X_L=20Ω, X_C=10Ω. Quelle est l'impédance totale ?",
      opts: ["40 Ω", "10+j10 Ω", "10−j10 Ω", "10 Ω"],
      correct: 1,
      expl: "Z = R + j(X_L − X_C) = 10 + j(20−10) = <strong>10 + j10 Ω</strong>. |Z| = 10√2 ≈ 14,1 Ω, φ = 45°. Le circuit est inductif car X_L > X_C."
    },
    {
      q: "La loi des mailles en régime sinusoïdal s'applique :",
      opts: ["En valeurs efficaces scalaires uniquement", "En valeurs complexes ou instantanées", "Uniquement en DC", "Uniquement à la résonance"],
      correct: 1,
      expl: "<strong>En complexes ou instantanés</strong>. Jamais en valeurs efficaces scalaires (sauf si tous les éléments sont en phase). ΣU_k = 0 est valide avec des phaseurs complexes ou des fonctions du temps."
    },
    {
      q: "Deux impédances Z₁=10∠30° Ω et Z₂=5∠−60° Ω sont en parallèle. Quel est |Z_éq| ?",
      opts: ["15 Ω", "3,33 Ω", "2,5 Ω", "Environ 3,7 Ω"],
      correct: 3,
      expl: "Z_éq = Z₁Z₂/(Z₁+Z₂). Z₁Z₂ = 50∠−30°. Z₁+Z₂ = 10cos30°+5cos(−60°) + j(10sin30°+5sin(−60°)) = (8,66+2,5)+j(5−4,33) = 11,16+j0,67 → |Z₁+Z₂|≈11,18∠3,4°. Z_éq = 50∠−30°/11,18∠3,4° ≈ <strong>4,47∠−33,4° ≈ 3,7 Ω réel+imag</strong>."
    },
    {
      q: "À la résonance d'un circuit RLC série, que se passe-t-il ?",
      opts: [
        "L'impédance est maximale",
        "L'impédance est minimale (Z = R) et le courant est maximal",
        "Le condensateur et la bobine se court-circuitent",
        "La fréquence double"
      ],
      correct: 1,
      expl: "À f₀ = 1/(2π√LC) : X_L = X_C → Im(Z) = 0 → <strong>Z = R (minimum)</strong> et I = V/R (maximum). Les tensions U_L et U_C peuvent être bien supérieures à V (facteur Q). Danger de surtension !"
    },
    {
      q: "Quel est le déphasage de l'impédance d'un condensateur parfait ?",
      opts: ["+90°", "0°", "−90°", "−45°"],
      correct: 2,
      expl: "Z_C = 1/(jωC) = −j/(ωC). φ_Z = arg(−j) = <strong>−90°</strong>. La tension est en retard sur le courant de 90° (ou le courant est en avance sur la tension de 90°). CIVIL : C→I avant V."
    },
    {
      q: "Dans le circuit suivant, R=30Ω, L=0,1H, f=50Hz. Le circuit est-il inductif ou capacitif ?",
      opts: ["Inductif (X_L>0)", "Capacitif (X_C>0)", "Résistif pur (résonance)", "Ni l'un ni l'autre"],
      correct: 0,
      expl: "X_L = ωL = 2π×50×0,1 = 31,4 Ω > 0 → Im(Z) > 0 → <strong>inductif</strong>. φ = arctan(31,4/30) ≈ 46,4°. Le courant est en retard sur la tension. (Pas de condensateur → forcément inductif ou résistif.)"
    },
    {
      q: "Dans un diviseur de tension AC, comment calculer U_k aux bornes de Z_k en série avec les autres ?",
      opts: [
        "U_k = V × R_k/R_total (en réels)",
        "U_k = V × Z_k/Z_total (en complexes)",
        "U_k = V × |Z_k|/|Z_total| (en modules seulement)",
        "U_k = I × (Z_total − Z_k)"
      ],
      correct: 1,
      expl: "<strong>U_k = V × Z_k/Z_total</strong> (division complexe). C'est la même formule qu'en DC mais avec des impédances complexes. Le résultat U_k est un phaseur avec son propre module et argument."
    },
    {
      q: "Dans un RLC série, si X_L < X_C, le circuit est :",
      opts: ["Inductif", "Capacitif", "Résonant", "Purement résistif"],
      correct: 1,
      expl: "La réactance nette vaut X = X_L − X_C. Si <strong>X<0</strong>, alors Z=R−j|X| : circuit capacitif (courant en avance)."
    }
  ],
  puissances: [
    {
      q: "Une charge consomme P=3kW avec cosφ=0,6. Quelle est la puissance réactive Q ?",
      opts: ["1800 VAr", "4000 VAr", "5000 VA", "2400 VAr"],
      correct: 1,
      expl: "sinφ = √(1−0,6²) = √(1−0,36) = √0,64 = 0,8. Q = P×(sinφ/cosφ) = P×tanφ = 3000×(0,8/0,6) = <strong>4000 VAr</strong>. Ou : S = P/cosφ = 5000 VA, Q = √(S²−P²) = √(25M−9M) = 4000 VAr."
    },
    {
      q: "Quel est le rôle de la puissance réactive Q ?",
      opts: [
        "Elle produit du travail mécanique utile",
        "Elle chauffe les résistances",
        "Elle représente les échanges d'énergie entre source et champs magnétiques/électriques, sans travail utile",
        "Elle est toujours négative"
      ],
      correct: 2,
      expl: "<strong>Échanges sans travail utile</strong>. Q correspond à l'énergie stockée et restituée alternativement par L et C. Elle ne produit aucun travail mais impose un courant supplémentaire dans les câbles, d'où des pertes Joule et le besoin de compensation."
    },
    {
      q: "Le théorème de Boucherot affirme que pour plusieurs charges :",
      opts: [
        "S_tot = ΣS_i et P_tot = ΣP_i",
        "P_tot = ΣP_i et Q_tot = ΣQ_i (mais S_tot ≠ ΣS_i)",
        "Toutes les puissances sont additives",
        "Seule S est additive"
      ],
      correct: 1,
      expl: "<strong>P et Q sont additives, pas S</strong>. S_tot = √(P_tot²+Q_tot²). Exemple : deux charges identiques à cosφ différents → S_tot ≠ 2S. Méthode : 1) ΣP, 2) ΣQ, 3) S_tot=√(P²+Q²)."
    },
    {
      q: "Comment calcule-t-on la puissance complexe Ŝ ?",
      opts: ["Ŝ = V·I (sans conjugué)", "Ŝ = V·I* (avec le conjugué de I)", "Ŝ = |V|·|I|", "Ŝ = V*/I"],
      correct: 1,
      expl: "<strong>Ŝ = V·I*</strong>. Le conjugué de I est essentiel : il garantit que Re(Ŝ) = P > 0 pour un récepteur passif. Sans conjugué, le résultat n'aurait pas la bonne signification physique. Ŝ = P + jQ."
    },
    {
      q: "Un condensateur installé en parallèle sur une charge inductive permet de :",
      opts: [
        "Augmenter la puissance active",
        "Réduire la puissance réactive totale et donc le courant absorbé",
        "Augmenter le facteur de puissance au-delà de 1",
        "Eliminer la puissance active"
      ],
      correct: 1,
      expl: "<strong>Réduire Q et le courant</strong>. Le condensateur produit Q_C < 0 qui compense le Q > 0 de la charge inductive. Q_tot = Q_charge + Q_C → diminue. S_tot = √(P²+Q_tot²) → diminue. Le courant I = S/V → diminue. Économies sur les câbles et l'énergie."
    },
    {
      q: "Une charge a V=230V, I=10A, cosφ=0,8. Que valent P, Q et S ?",
      opts: [
        "P=1840W, Q=2300VAr, S=2300VA",
        "P=2300W, Q=1380VAr, S=2875VA",
        "P=1840W, Q=1380VAr, S=2300VA",
        "P=2300W, Q=0VAr, S=2300VA"
      ],
      correct: 2,
      expl: "S = V×I = 230×10 = 2300 VA. P = S×cosφ = 2300×0,8 = <strong>1840 W</strong>. sinφ = √(1−0,64) = 0,6. Q = S×sinφ = 2300×0,6 = <strong>1380 VAr</strong>. Vérif: √(1840²+1380²) = √(3386M+1904M) ≈ 2300 ✓"
    },
    {
      q: "En triphasé équilibré, la puissance instantanée totale est :",
      opts: [
        "Nulle",
        "Pulsatoire à 2ω comme en monophasé",
        "Constante = 3·V·I·cosφ",
        "Pulsatoire à 6ω"
      ],
      correct: 2,
      expl: "<strong>Constante = 3VI·cosφ</strong>. En triphasé, les 3 composantes fluctuantes (à 2ω) se compensent exactement entre phases. C'est l'avantage majeur du triphasé pour les moteurs : pas de couple pulsatoire, fonctionnement plus régulier."
    },
    {
      q: "Pour relever cosφ de 0,7 à 0,95 avec P=25kW, quelle puissance réactive faut-il compenser ?",
      opts: ["5,5 kVAr", "12,5 kVAr", "8,2 kVAr", "17,8 kVAr"],
      correct: 2,
      expl: "tanφ₁ = sin(arccos0,7)/0,7 = √(1−0,49)/0,7 = 0,714/0,7 ≈ 1,020. tanφ₂ = sin(arccos0,95)/0,95 ≈ 0,329. Q_C = P×(tanφ₁−tanφ₂) = 25000×(1,020−0,329) = 25000×0,691 ≈ <strong>17 275 VAr ≈ 17,3 kVAr</strong>. (Réponse la plus proche : 17,8 kVAr)"
    }
  ],
  triphase: [
    {
      q: "Dans un réseau 230V/400V équilibré direct, quelle est la relation entre la tension composée U et la tension simple V ?",
      opts: ["U = V", "U = V/√3", "U = √3·V", "U = 3·V"],
      correct: 2,
      expl: "U = √3·V est la relation fondamentale. 400 = √3 × 230 ≈ 1,732 × 230 = 398 V ≈ 400 V. Les tensions composées (entre phases) sont √3 fois plus grandes que les tensions simples (phase-neutre)."
    },
    {
      q: "Pour un récepteur étoile équilibré, quelle relation unit le courant de ligne I et le courant de phase J ?",
      opts: ["I = J√3", "I = J/√3", "I = J", "I = 3J"],
      correct: 2,
      expl: "En couplage étoile : I = J. Le courant traversant chaque impédance de phase est identique au courant de ligne. C'est la différence avec le triangle où I = J√3."
    },
    {
      q: "La puissance instantanée totale en triphasé équilibré est :",
      opts: ["Pulsatoire à 2ω comme en monophasé", "Constante et égale à 3VI·cosφ", "Nulle en régime permanent", "Proportionnelle à sin(ωt)"],
      correct: 1,
      expl: "C'est l'avantage majeur du triphasé ! La puissance instantanée totale p₃φ = 3VI·cosφ est CONSTANTE (pas de fluctuation à 2ω). Cela explique l'absence de vibrations dans les moteurs triphasés et leur couple régulier."
    },
    {
      q: "Pour un récepteur triangle, quelle est la tension aux bornes de chaque impédance ?",
      opts: ["La tension simple V", "La tension composée U", "U/√3", "√3·V/2"],
      correct: 1,
      expl: "En couplage triangle, chaque impédance est branchée directement entre deux phases : elle voit donc la tension composée U = √3·V. C'est pourquoi on utilise le triangle quand les appareils sont conçus pour la tension composée."
    },
    {
      q: "Pour relever le facteur de puissance d'une charge inductive, on place des condensateurs en parallèle. La puissance réactive Qc fournie par un banc de 3 condensateurs en étoile vaut :",
      opts: ["Qc = +3ωCV²", "Qc = −3ωCU²", "Qc = −3ωCV²", "Qc = −ωCU²/3"],
      correct: 2,
      expl: "Qc = −3ωCV² pour un couplage étoile (V = tension simple). Le signe négatif indique que les condensateurs fournissent de la puissance réactive capacitive, compensant la puissance réactive inductive (positive) de la charge."
    },
    {
      q: "Le théorème de Boucherot affirme que pour un système triphasé avec plusieurs charges, S_tot (puissance apparente scalaire) est-elle additive ?",
      opts: ["Oui, S_tot = ΣSᵢ", "Non, seules P_tot et Q_tot sont additives", "Oui si les charges sont identiques", "Non, aucune puissance n'est additive"],
      correct: 1,
      expl: "Boucherot : P_tot = ΣPᵢ ✓ et Q_tot = ΣQᵢ ✓ et Ŝ_tot = ΣŜᵢ ✓ MAIS S_tot ≠ ΣSᵢ ✗. La puissance apparente scalaire ne s'additionne PAS. On calcule S_tot = √(P_tot² + Q_tot²) après avoir additionné P et Q séparément."
    },
    {
      q: "En triphasé équilibré, quelle grandeur reste identique entre étoile et triangle pour une même puissance active P et même tension composée U ?",
      opts: ["Le courant de phase J", "La puissance apparente S", "Le courant de ligne I", "L'impédance de phase"],
      correct: 1,
      expl: "Pour une même charge globale vue réseau, <strong>S = √3·U·I</strong> reste la grandeur de référence côté ligne. En revanche, J et Z de phase changent selon le couplage étoile/triangle."
    },
    {
      q: "Pour P=5 kW, cosφ: 0,70 → 0,95, la compensation réactive Qc vaut environ :",
      opts: ["1,2 kVAr", "2,0 kVAr", "3,5 kVAr", "5,0 kVAr"],
      correct: 2,
      expl: "Qc = P(tanφ1−tanφ2) = 5000(1,020−0,329) ≈ <strong>3,46 kVAr</strong>, soit ~3,5 kVAr."
    },
    {
      q: "En étoile équilibrée, avec V=230 V, I=10 A et cosφ=0,8, P vaut :",
      opts: ["1,84 kW", "3,18 kW", "5,52 kW", "6,90 kW"],
      correct: 2,
      expl: "P = 3·V·I·cosφ = 3×230×10×0,8 = <strong>5,52 kW</strong>."
    }
  ],
  methodologie: [
    {
      q: "Quelle est la PREMIÈRE étape pour résoudre un circuit AC ?",
      opts: [
        "Calculer P et Q",
        "Calculer ω et les impédances complexes Z_R, Z_L, Z_C",
        "Appliquer la loi des nœuds",
        "Convertir en temporel"
      ],
      correct: 1,
      expl: "<strong>ω et les impédances</strong> en premier. ω = 2πf → Z_L = jωL, Z_C = 1/(jωC). Sans les impédances complexes, impossible d'appliquer les lois de Kirchhoff. C'est le fondement de la méthode."
    },
    {
      q: "Pour un circuit RL série (R=30Ω, X_L=40Ω, V=100V), quel est le courant I ?",
      opts: ["3,33 A", "2,86 A", "2 A", "1,43 A"],
      correct: 2,
      expl: "|Z| = √(R²+X_L²) = √(900+1600) = √2500 = 50 Ω. I = V/|Z| = 100/50 = <strong>2 A</strong>. C'est la méthode universelle : calculer |Z|, puis I = V/|Z|."
    },
    {
      q: "Un dipôle a cosφ = 0,866. Quel est l'angle de déphasage φ ?",
      opts: ["15°", "30°", "45°", "60°"],
      correct: 1,
      expl: "φ = arccos(0,866) = <strong>30°</strong>. Rappel : cos30° = √3/2 ≈ 0,866. Connaître les valeurs trigonométriques remarquables (0°, 30°, 45°, 60°, 90°) est indispensable pour les calculs rapides."
    },
    {
      q: "Laquelle de ces affirmations sur la loi des mailles est CORRECTE en AC ?",
      opts: [
        "ΣU_eff = 0 (valeurs efficaces scalaires)",
        "ΣU_complexes = 0 (phaseurs)",
        "ΣP = 0 (puissances)",
        "ΣI = 0 (valeurs efficaces scalaires)"
      ],
      correct: 1,
      expl: "<strong>ΣU_complexes = 0</strong>. La loi des mailles s'applique aux phaseurs (complexes) ou aux valeurs instantanées. Jamais aux valeurs efficaces scalaires (car les tensions ont des phases différentes et ne s'additionnent pas algébriquement)."
    },
    {
      q: "Pour passer d'un phaseur complexe I = 10∠−45° A à l'expression temporelle i(t) :",
      opts: [
        "i(t) = 10·sin(ωt − 45°) A",
        "i(t) = 10√2·sin(ωt − 45°) A",
        "i(t) = 10√2·cos(ωt − 45°) A",
        "i(t) = 10·cos(ωt + 45°) A"
      ],
      correct: 1,
      expl: "<strong>i(t) = 10√2·sin(ωt − 45°)</strong>. Le phaseur a pour module la valeur efficace I = 10 A. La valeur crête est I_max = I×√2 = 10√2 A. L'argument −45° devient le déphasage initial. Formule : i(t) = I_max·sin(ωt + φ)."
    },
    {
      q: "Quelle erreur classique faut-il absolument éviter ?",
      opts: [
        "Travailler en complexes",
        "Additionner des S_i pour obtenir S_tot",
        "Utiliser Z = R + jX",
        "Calculer |Z| = √(R²+X²)"
      ],
      correct: 1,
      expl: "<strong>S_tot ≠ ΣS_i</strong>. La puissance apparente n'est PAS additive. Seules P et Q le sont. Méthode correcte : P_tot = ΣP_i, Q_tot = ΣQ_i, puis S_tot = √(P_tot²+Q_tot²). C'est le théorème de Boucherot."
    },
    {
      q: "Dans un circuit RC série (R=6Ω, X_C=8Ω, V=100V), que vaut le courant I et la puissance active P ?",
      opts: [
        "I=10A, P=600W",
        "I=7,14A, P=306W",
        "I=14,3A, P=1224W",
        "I=10A, P=1000W"
      ],
      correct: 0,
      expl: "|Z| = √(6²+8²) = √(36+64) = √100 = 10 Ω. I = 100/10 = <strong>10 A</strong>. P = R×I² = 6×100 = <strong>600 W</strong>. Q = X_C×I² = 8×100 = 800 VAr. S = 100×10 = 1000 VA. cosφ = 600/1000 = 0,6."
    },
    {
      q: "Pourquoi préfère-t-on le triphasé au monophasé pour transporter de l'énergie ?",
      opts: [
        "Le triphasé est plus simple à installer",
        "Le triphasé utilise moins de conducteurs pour la même puissance transmise et a une puissance instantanée constante",
        "Le triphasé est moins dangereux",
        "Le triphasé ne nécessite pas de neutre"
      ],
      correct: 1,
      expl: "<strong>Moins de conducteurs + puissance constante</strong>. En triphasé : 3 fils pour 3× la puissance monophasée (rapport 3/3 fils vs 2 fils). La puissance instantanée est constante (pas de pulsations à 2ω). Les moteurs triphasés ont un couple plus régulier."
    },
    {
      q: "Dans une résolution AC rigoureuse, quel enchaînement est correct ?",
      opts: ["P,Q,S puis impédances", "Passer en complexes → simplifier Z_eq → calculer I/U → revenir aux puissances", "Calculer d'abord cosφ global puis Z", "Tout faire en valeurs efficaces scalaires"],
      correct: 1,
      expl: "La méthode robuste est : <strong>modélisation complexe</strong>, réduction du circuit, calcul des phaseurs (I/U), puis puissances (P,Q,S) et interprétation physique."
    }
  ],
  aop_lineaire: [
    {
      q: "Dans un montage inverseur avec R₁ = 5 kΩ et R₂ = 50 kΩ, quel est le gain en tension ?",
      opts: ["−10", "+10", "−0,1", "+1"],
      correct: 0,
      expl: "<strong>Av = −R₂/R₁ = −50k/5k = −10.</strong> Le signe négatif indique l'inversion de phase (opposition de signe). L'amplitude est amplifiée 10 fois."
    },
    {
      q: "Pourquoi dit-on que le point e⁻ d'un montage inverseur est une « masse virtuelle » ?",
      opts: [
        "Parce qu'il est relié physiquement à la masse",
        "Parce que e⁻ = e⁺ = 0V en régime linéaire (A→∞, ε→0)",
        "Parce que l'impédance en ce point est nulle",
        "Parce que le courant d'entrée AOP est infini"
      ],
      correct: 1,
      expl: "En régime linéaire, ε = S/A → 0 car A→∞. Donc e⁻ = e⁺. Si e⁺ est à la masse (0V), alors e⁻ = 0V aussi. Ce point est 'virtuellement' à la masse bien que non relié physiquement."
    },
    {
      q: "Un montage non-inverseur a R₁ = 10 kΩ et R₂ = 30 kΩ. Quel est le gain ?",
      opts: ["+3", "+4", "−3", "+0,25"],
      correct: 1,
      expl: "<strong>Av = 1 + R₂/R₁ = 1 + 30/10 = 1 + 3 = +4.</strong> Le gain est toujours ≥ 1 et toujours positif pour un non-inverseur. L'entrée est sur e⁺."
    },
    {
      q: "Quel montage AOP réalise la fonction S = −Rf × (Ve₁/R₁ + Ve₂/R₂) ?",
      opts: ["Soustracteur", "Intégrateur", "Sommateur inverseur", "Dérivateur"],
      correct: 2,
      expl: "<strong>Sommateur inverseur.</strong> Plusieurs résistances d'entrée alimentent l'entrée inverseuse (masse virtuelle). Chaque source est pondérée par son rapport Rf/Ri. La somme pondérée est inversée en sortie."
    },
    {
      q: "La fonction de transfert H(jω) = −1/(jωRC) correspond à quel montage ?",
      opts: ["Dérivateur", "Intégrateur idéal", "Filtre passe-haut", "Inverseur"],
      correct: 1,
      expl: "<strong>Intégrateur idéal.</strong> H = −1/(jωRC) = −1/(jω·τ) avec τ=RC. Le terme 1/jω correspond à l'intégration en domaine temporel. Gain décroît à −20 dB/décade : c'est un filtre passe-bas."
    },
    {
      q: "Quel est le principal avantage du montage suiveur (gain = 1) par rapport à une simple connexion fil ?",
      opts: [
        "Il amplifie le signal par 2",
        "Il inverse la phase",
        "Il adapte les impédances : Rin→∞, Rout≈0",
        "Il filtre les hautes fréquences"
      ],
      correct: 2,
      expl: "<strong>Adaptation d'impédance.</strong> Le suiveur présente une impédance d'entrée infinie (ne charge pas la source) et une impédance de sortie quasi nulle (peut piloter n'importe quelle charge). Un simple fil n'offre pas cette isolation."
    },
    {
      q: "Pour un filtre passe-bas actif inverseur de fréquence de coupure fc = 1 kHz et gain G₀ = −20, avec R₁ = 10 kΩ, quelles valeurs choisir pour Rf et C ?",
      opts: [
        "Rf = 200 kΩ, C = 7,96 nF",
        "Rf = 20 kΩ, C = 79,6 nF",
        "Rf = 200 kΩ, C = 79,6 nF",
        "Rf = 20 kΩ, C = 7,96 nF"
      ],
      correct: 0,
      expl: "G₀ = Rf/R₁ = 20 → Rf = 200 kΩ. fc = 1/(2πRfC) → C = 1/(2π×200k×1k) = 1/(1,257×10⁹) ≈ <strong>7,96 nF</strong>. Réponse A."
    },
    {
      q: "Un dérivateur AOP reçoit un signal triangulaire. Quelle est la forme de sa sortie ?",
      opts: ["Triangulaire aussi", "Sinusoïdale", "Signal carré", "Signal nul"],
      correct: 2,
      expl: "<strong>Signal carré.</strong> La dérivée d'un signal triangulaire (pentes constantes) est un signal carré (valeur constante + et valeur constante − selon la pente). S(t) = −RfC × dVe/dt."
    },
    {
      q: "Un inverseur de gain -20 alimenté en ±15 V reçoit un signal sinusoïdal de 1 V crête. Que se passe-t-il idéalement ?",
      opts: ["Sortie 20 V crête sans limite", "Sortie écrêtée proche de ±15 V", "Sortie 1 V crête", "Sortie nulle"],
      correct: 1,
      expl: "Le gain demande 20 V crête en sortie, mais l'alimentation limite l'amplitude. L'AOP <strong>sature</strong> et la sortie est écrêtée autour des rails ±15 V (en pratique un peu moins)."
    }
  ],
  aop_oscillateurs: [
    {
      q: "Un AOP sans contre-réaction avec Ve = 100 mV et Vref = 50 mV sur e⁺. Que vaut S ?",
      opts: ["+50 mV", "−50 mV", "+Vsat", "−Vsat"],
      correct: 3,
      expl: "ε = e⁺ − e⁻ = 50 − 100 = −50 mV < 0. S = A × ε → −∞ → <strong>S = −Vsat</strong>. Sans contre-réaction, tout signal, même minime, fait saturer l'AOP immédiatement."
    },
    {
      q: "Pourquoi un comparateur simple est-il sensible au bruit autour du seuil de basculement ?",
      opts: [
        "Parce que son gain est trop faible",
        "Parce que tout bruit sur Ve peut faire commuter la sortie de façon intempestive",
        "Parce que sa sortie est en courant",
        "Parce qu'il chauffe trop"
      ],
      correct: 1,
      expl: "Le comparateur simple a un seuil unique. Si Ve oscille autour de ce seuil à cause du bruit, la sortie commute en permanence de façon anarchique (phénomène de 'chattering'). Solution : trigger de Schmitt avec deux seuils distincts (hystérésis)."
    },
    {
      q: "Pour un trigger de Schmitt non-inverseur avec Vsat = ±12 V, R₁ = 10 kΩ, R₂ = 90 kΩ, quels sont les seuils V⁺ et V⁻ ?",
      opts: ["±1,2 V", "±10,8 V", "±1,33 V", "±0,5 V"],
      correct: 0,
      expl: "V⁺ = Vsat × R₁/(R₁+R₂) = 12 × 10/(10+90) = 12 × 0,1 = <strong>+1,2 V</strong>. V⁻ = −1,2 V. Largeur d'hystérésis ΔVH = 2,4 V."
    },
    {
      q: "Dans une bascule astable avec R₁ = R₂ (β = 0,5), la période d'oscillation vaut :",
      opts: ["T = RC", "T = 2RC × ln(2)", "T = 2RC × ln(3) ≈ 2,2 RC", "T = π × RC"],
      correct: 2,
      expl: "<strong>T = 2RC × ln(3) ≈ 2,2 RC</strong> quand R₁ = R₂ (β = 0,5). Formule générale : T = 2RC × ln((1+β)/(1−β)). Le facteur ln(3) provient du rapport entre le seuil de basculement et la tension de saturation."
    },
    {
      q: "Quelle est la condition de gain pour qu'un oscillateur de Wien oscille de façon stable ?",
      opts: ["Av = 1", "Av = 2", "Av = 3", "Av = 10"],
      correct: 2,
      expl: "<strong>Av = 3</strong> (soit Rf = 2R₁). À f₀, le réseau de Wien introduit une atténuation de 1/3 et un déphasage nul. Pour que le gain de boucle |Aβ| = 1 (critère de Barkhausen), l'amplificateur doit compenser exactement cette atténuation : Av × (1/3) = 1 → Av = 3."
    },
    {
      q: "Quelle est la fréquence d'un oscillateur de Wien avec R = 15,9 kΩ et C = 10 nF ?",
      opts: ["100 Hz", "1 kHz", "10 kHz", "100 kHz"],
      correct: 1,
      expl: "f₀ = 1/(2πRC) = 1/(2π × 15900 × 10×10⁻⁹) = 1/(2π × 159×10⁻⁶) = 1/(998×10⁻⁶) ≈ <strong>1 kHz</strong>."
    },
    {
      q: "Le critère de Barkhausen stipule que pour des oscillations stables, le gain de boucle A(jω₀)β(jω₀) doit valoir :",
      opts: ["0", "j (déphasage 90°)", "1 + j0 (module 1, phase 0°)", "∞"],
      correct: 2,
      expl: "<strong>Aβ = 1 + j0</strong> : module = 1 ET phase = 0°. Si |Aβ| > 1 → oscillations croissantes (saturation). Si |Aβ| < 1 → oscillations amorties. La phase nulle garantit que le signal se renforce en phase à chaque tour de boucle."
    },
    {
      q: "Quelle différence fondamentale existe entre un oscillateur de Wien et une bascule astable ?",
      opts: [
        "Le Wien utilise un AOP, l'astable non",
        "Le Wien génère un sinusoïde, l'astable un signal carré",
        "L'astable a une fréquence réglable, le Wien non",
        "Le Wien ne nécessite pas de contre-réaction"
      ],
      correct: 1,
      expl: "<strong>Nature du signal :</strong> Wien → sinusoïde basse distorsion (linéaire, Barkhausen). Astable → signal carré (non-linéaire, saturation à ±Vsat). Les deux génèrent des oscillations autonomes, mais la forme d'onde est radicalement différente."
    },
    {
      q: "Selon Barkhausen à ω₀, quelle paire de conditions est correcte ?",
      opts: ["|AF|=0 et arg(AF)=0", "|AF|=1 et arg(AF)=0 [2π]", "|AF|>1 et arg(AF)=90°", "|AF|<1 et arg(AF)=180°"],
      correct: 1,
      expl: "Critère de Barkhausen : <strong>|AF|=1</strong> et phase de boucle nulle modulo 2π à la pulsation d’oscillation."
    },
    {
      q: "Pourquoi amorce-t-on parfois un oscillateur avec |AF|=1+δ (δ petit) ?",
      opts: ["Pour bloquer toute oscillation", "Pour accélérer l’extinction", "Pour garantir le démarrage avant stabilisation à |AF|≈1", "Pour doubler la fréquence"],
      correct: 2,
      expl: "Un gain de boucle légèrement supérieur à 1 aide l’oscillation à démarrer depuis le bruit. Ensuite les non-linéarités ramènent |AF| vers 1 en régime établi."
    }
  ],
  aop_bases: [
    {
      q: "Dans un AOP idéal en régime linéaire, que vaut la différence de potentiel en entrée &epsilon; ?",
      opts: ["Infinie", "V_cc", "Zéro", "Égale à la tension d'entrée"],
      correct: 2,
      expl: "En régime linéaire (avec contre-réaction négative), le gain A infini impose que &epsilon; = 0, donc e⁺ = e⁻."
    },
    {
      q: "Quel est l'effet d'une contre-réaction sur l'entrée non-inverseuse (e⁺) ?",
      opts: ["Elle stabilise le système (linéaire)", "Elle provoque la saturation de la sortie", "Elle annule le courant d'entrée", "Elle transforme l'AOP en filtre"],
      correct: 1,
      expl: "C'est une contre-réaction positive. L'effet est cumulatif (effet boule de neige), ce qui amène l'AOP à saturer (+Vsat ou -Vsat). C'est utilisé pour les comparateurs à hystérésis."
    },
    {
      q: "Dans la modélisation d'un amplificateur de tension, comment doit être l'impédance d'entrée R_in pour être idéale ?",
      opts: ["Nulle (0 &Omega;)", "Égale à R_out", "Infinie", "Égale à 50 &Omega;"],
      correct: 2,
      expl: "R_in doit tendre vers l'infini pour ne consommer aucun courant sur la source (I = 0), afin de ne pas perturber le signal mesuré."
    },
  ]
};

// ═══════════════════════════════
// CALCULATEUR SIGNAL SINUSOÏDAL
// ═══════════════════════════════
function calcSignal() {
  const Seff = parseFloat(document.getElementById('s-eff').value) || 0;
  const f    = parseFloat(document.getElementById('s-freq').value) || 50;
  const phi  = parseFloat(document.getElementById('s-phi').value) || 0;
  const result = document.getElementById('s-result');

  const Smax  = Seff * Math.sqrt(2);
  const T     = 1 / f;
  const omega = 2 * Math.PI * f;
  const phiRad = phi * Math.PI / 180;

  result.innerHTML = `
    <div class="result-line"><span class="result-key">Valeur crête S_max</span><span class="result-val">${Smax.toFixed(3)} V (ou A)</span></div>
    <div class="result-line"><span class="result-key">Pulsation ω</span><span class="result-val">${omega.toFixed(2)} rad/s</span></div>
    <div class="result-line"><span class="result-key">Période T</span><span class="result-val">${(T*1000).toFixed(3)} ms</span></div>
    <div class="result-line"><span class="result-key">Expression temporelle</span><span class="result-val">s(t) = ${Smax.toFixed(2)}·sin(${omega.toFixed(0)}t ${phi>=0?'+':''}${phi}°)</span></div>
    <div class="result-line"><span class="result-key">Phaseur complexe</span><span class="result-val">${Seff.toFixed(2)}∠${phi}° (module = valeur eff.)</span></div>
  `;
  result.className = 'calc-result show';
}

// ═══════════════════════════════
// CALCULATEUR IMPÉDANCE RLC
// ═══════════════════════════════
function calcImpedance() {
  const R = parseFloat(document.getElementById('i-r').value) || 0;
  const L = parseFloat(document.getElementById('i-l').value) || 0;
  const C = parseFloat(document.getElementById('i-c').value) || 0;
  const f = parseFloat(document.getElementById('i-f').value) || 50;
  const V = parseFloat(document.getElementById('i-v').value) || 230;
  const result = document.getElementById('i-result');

  const omega = 2 * Math.PI * f;
  const XL = omega * L / 1000;        // L en mH
  const XC = C > 0 ? 1 / (omega * C / 1e6) : 0;  // C en µF
  const X  = XL - XC;
  const Ztot = Math.sqrt(R*R + X*X);
  const phi  = Math.atan2(X, R) * 180 / Math.PI;
  const I    = Ztot > 0 ? V / Ztot : 0;
  const P    = R * I * I;
  const Q    = X * I * I;
  const S    = V * I;
  const cosP = S > 0 ? P / S : 0;

  const nature = X > 0.01 ? 'Inductif' : X < -0.01 ? 'Capacitif' : 'Résistif pur';

  result.innerHTML = `
    <div class="result-line"><span class="result-key">X_L = ωL</span><span class="result-val">${XL.toFixed(2)} Ω</span></div>
    ${C>0 ? '<div class="result-line"><span class="result-key">X_C = 1/(ωC)</span><span class="result-val">'+XC.toFixed(2)+' Ω</span></div>' : ''}
    <div class="result-line"><span class="result-key">X = X_L − X_C</span><span class="result-val">${X.toFixed(2)} Ω</span></div>
    <div class="result-line"><span class="result-key">|Z| = √(R²+X²)</span><span class="result-val">${Ztot.toFixed(3)} Ω</span></div>
    <div class="result-line"><span class="result-key">φ = arctan(X/R)</span><span class="result-val">${phi.toFixed(1)}° (${nature})</span></div>
    <div class="result-line"><span class="result-key">I = V/|Z|</span><span class="result-val">${I.toFixed(3)} A</span></div>
    <div class="result-line"><span class="result-key">P = R·I²</span><span class="result-val">${P.toFixed(1)} W</span></div>
    <div class="result-line"><span class="result-key">Q = X·I²</span><span class="result-val">${Q.toFixed(1)} VAr</span></div>
    <div class="result-line"><span class="result-key">S = V·I</span><span class="result-val">${S.toFixed(1)} VA</span></div>
    <div class="result-line"><span class="result-key">cosφ = P/S</span><span class="result-val">${cosP.toFixed(3)}</span></div>
    ${C>0&&L>0 ? '<div class="result-line"><span class="result-key">f₀ résonance</span><span class="result-val">'+(1/(2*Math.PI*Math.sqrt(L/1000*C/1e6))).toFixed(1)+' Hz</span></div>' : ''}
  `;
  result.className = 'calc-result show';
}

// ═══════════════════════════════
// CALCULATEUR PUISSANCES
// ═══════════════════════════════
function calcPuissance() {
  const mode = document.getElementById('p-mode').value;
  const in1  = parseFloat(document.getElementById('p-in1').value) || 0;
  const in2  = parseFloat(document.getElementById('p-in2').value) || 0;
  const in3  = parseFloat(document.getElementById('p-in3').value) || 230;
  const in4  = parseFloat(document.getElementById('p-in4').value) || 0.95;
  const result = document.getElementById('p-result');

  // Update labels
  const labels = {
    'pqs':  ['P (W)', 'Q (VAr)', 'V (V)', 'cosφ\' cible'],
    'scosphi': ['S (VA)', 'cosφ', 'V (V)', 'f (Hz)'],
    'comp': ['P (W)', 'cosφ actuel', 'V (V)', 'cosφ\' cible']
  };
  ['p-l1','p-l2','p-l3','p-l4'].forEach((id,i) => {
    const el = document.getElementById(id);
    if(el) el.textContent = labels[mode][i];
  });

  let html = '';
  if (mode === 'pqs') {
    const P=in1, Q=in2, V=in3;
    const S = Math.sqrt(P*P+Q*Q);
    const cosP = S>0 ? P/S : 0;
    const phi  = Math.atan2(Q,P)*180/Math.PI;
    const I    = V>0 ? S/V : 0;
    html = `
      <div class="result-line"><span class="result-key">S = √(P²+Q²)</span><span class="result-val">${S.toFixed(1)} VA</span></div>
      <div class="result-line"><span class="result-key">cosφ = P/S</span><span class="result-val">${cosP.toFixed(4)}</span></div>
      <div class="result-line"><span class="result-key">φ</span><span class="result-val">${phi.toFixed(1)}°</span></div>
      <div class="result-line"><span class="result-key">I = S/V</span><span class="result-val">${I.toFixed(2)} A</span></div>
      <div class="result-line"><span class="result-key">Nature</span><span class="result-val">${Q>0?'Inductif (Q>0)':Q<0?'Capacitif (Q<0)':'Résistif pur'}</span></div>
    `;
  } else if (mode === 'scosphi') {
    const S=in1, cosP=in2, V=in3;
    const P = S * cosP;
    const sinP = Math.sqrt(1-cosP*cosP);
    const Q = S * sinP;
    const phi = Math.acos(cosP)*180/Math.PI;
    const I = V>0 ? S/V : 0;
    html = `
      <div class="result-line"><span class="result-key">P = S·cosφ</span><span class="result-val">${P.toFixed(1)} W</span></div>
      <div class="result-line"><span class="result-key">Q = S·sinφ</span><span class="result-val">${Q.toFixed(1)} VAr</span></div>
      <div class="result-line"><span class="result-key">φ = arccos(cosφ)</span><span class="result-val">${phi.toFixed(1)}°</span></div>
      <div class="result-line"><span class="result-key">I = S/V</span><span class="result-val">${I.toFixed(2)} A</span></div>
    `;
  } else { // comp
    const P=in1, cosPhi=in2, V=in3, cosPhiTarget=in4;
    const phi  = Math.acos(cosPhi);
    const phiT = Math.acos(cosPhiTarget);
    const Qc   = P*(Math.tan(phi)-Math.tan(phiT));
    const C    = Qc/(2*Math.PI*50*V*V);
    const C_tri= Qc/(3*2*Math.PI*50*V*V);
    const Sbefore = P/cosPhi;
    const Safter  = Math.sqrt(P*P + (P*Math.tan(phi)-Qc)**2);
    const Ibefore = Sbefore/V;
    const Iafter  = Safter/V;
    html = `
      <div class="result-line"><span class="result-key">Q_C à compenser</span><span class="result-val">${Qc.toFixed(0)} VAr</span></div>
      <div class="result-line"><span class="result-key">C (monophasé)</span><span class="result-val">${(C*1e6).toFixed(1)} µF</span></div>
      <div class="result-line"><span class="result-key">C (triphasé étoile)</span><span class="result-val">${(C_tri*1e6*3).toFixed(1)} µF / phase</span></div>
      <div class="result-line"><span class="result-key">C (triphasé triangle)</span><span class="result-val">${(C_tri*1e6).toFixed(1)} µF / phase</span></div>
      <div class="result-line"><span class="result-key">Courant avant</span><span class="result-val">${Ibefore.toFixed(2)} A</span></div>
      <div class="result-line"><span class="result-key">Courant après</span><span class="result-val">${Iafter.toFixed(2)} A (−${(100*(Ibefore-Iafter)/Ibefore).toFixed(0)}%)</span></div>
    `;
  }
  result.innerHTML = html;
  result.className = 'calc-result show';
}

// ═══════════════════════════════
// ═══════════════════════════════
function calcAOP2() {
  const type = document.getElementById('aop2-type').value;
  const R1 = parseFloat(document.getElementById('aop2-r1').value) || 0;
  const R2 = parseFloat(document.getElementById('aop2-r2').value) || 0;
  const Ve = parseFloat(document.getElementById('aop2-ve').value) || 0;
  const C  = parseFloat(document.getElementById('aop2-c').value) || 0;
  const result = document.getElementById('aop2-result');
  let html = '';

  if (type === 'inv') {
    if (R1 === 0) { result.innerHTML = '<div class="result-line"><span class="result-key">Erreur</span><span class="result-val" style="color:var(--accent2)">R₁ ne peut pas être 0</span></div>'; result.className='calc-result show'; return; }
    const Av = -(R2 / R1);
    const S  = Av * Ve;
    const dB = 20 * Math.log10(Math.abs(Av));
    html = `
      <div class="result-line"><span class="result-key">Gain Av</span><span class="result-val">${Av.toFixed(3)}</span></div>
      <div class="result-line"><span class="result-key">|Av| en dB</span><span class="result-val">${dB.toFixed(1)} dB</span></div>
      <div class="result-line"><span class="result-key">Tension de sortie S</span><span class="result-val">${S.toFixed(3)} V</span></div>
      <div class="result-line"><span class="result-key">Phase</span><span class="result-val">180° (inversé)</span></div>
    `;
  } else if (type === 'noninv') {
    if (R1 === 0) { result.innerHTML = '<div class="result-line"><span class="result-key">Erreur</span><span class="result-val" style="color:var(--accent2)">R₁ ne peut pas être 0</span></div>'; result.className='calc-result show'; return; }
    const Av = 1 + R2 / R1;
    const S  = Av * Ve;
    const dB = 20 * Math.log10(Math.abs(Av));
    html = `
      <div class="result-line"><span class="result-key">Gain Av</span><span class="result-val">+${Av.toFixed(3)}</span></div>
      <div class="result-line"><span class="result-key">|Av| en dB</span><span class="result-val">${dB.toFixed(1)} dB</span></div>
      <div class="result-line"><span class="result-key">Tension de sortie S</span><span class="result-val">${S.toFixed(3)} V</span></div>
      <div class="result-line"><span class="result-key">Phase</span><span class="result-val">0° (en phase)</span></div>
    `;
  } else if (type === 'suiveur') {
    html = `
      <div class="result-line"><span class="result-key">Gain Av</span><span class="result-val">+1 (exactement)</span></div>
      <div class="result-line"><span class="result-key">Tension de sortie S</span><span class="result-val">${Ve.toFixed(3)} V</span></div>
      <div class="result-line"><span class="result-key">Impédance entrée</span><span class="result-val">→ ∞ (idéal)</span></div>
      <div class="result-line"><span class="result-key">Impédance sortie</span><span class="result-val">≈ 0 Ω (idéal)</span></div>
    `;
  } else if (type === 'integ') {
    if (R1 === 0 || C === 0) { result.innerHTML = '<div class="result-line"><span class="result-key">Erreur</span><span class="result-val" style="color:var(--accent2)">R₁ et C doivent être non nuls</span></div>'; result.className='calc-result show'; return; }
    const tau = R1 * 1e3 * C * 1e-9;
    const fc  = 1 / (2 * Math.PI * tau);
    html = `
      <div class="result-line"><span class="result-key">Constante τ = R₁C</span><span class="result-val">${(tau*1e6).toFixed(2)} µs</span></div>
      <div class="result-line"><span class="result-key">Fréquence de coupure fc</span><span class="result-val">${fc >= 1000 ? (fc/1000).toFixed(2)+' kHz' : fc.toFixed(1)+' Hz'}</span></div>
      <div class="result-line"><span class="result-key">Pente atténuation</span><span class="result-val">−20 dB/décade</span></div>
      <div class="result-line"><span class="result-key">Gain à fc</span><span class="result-val">−3 dB (= G₀/√2)</span></div>
    `;
  } else if (type === 'filtre') {
    if (R1 === 0 || R2 === 0 || C === 0) { result.innerHTML = '<div class="result-line"><span class="result-key">Erreur</span><span class="result-val" style="color:var(--accent2)">Tous les paramètres requis</span></div>'; result.className='calc-result show'; return; }
    const G0  = R2 / R1;
    const tau = R2 * 1e3 * C * 1e-9;
    const fc  = 1 / (2 * Math.PI * tau);
    const dB  = 20 * Math.log10(G0);
    html = `
      <div class="result-line"><span class="result-key">Gain DC G₀ = Rf/R₁</span><span class="result-val">${G0.toFixed(2)} (${dB.toFixed(1)} dB)</span></div>
      <div class="result-line"><span class="result-key">Fréquence de coupure fc</span><span class="result-val">${fc >= 1000 ? (fc/1000).toFixed(2)+' kHz' : fc.toFixed(1)+' Hz'}</span></div>
      <div class="result-line"><span class="result-key">Gain à fc</span><span class="result-val">${(G0/Math.sqrt(2)).toFixed(2)} (−3 dB)</span></div>
      <div class="result-line"><span class="result-key">Pente pour f &gt; fc</span><span class="result-val">−20 dB/décade</span></div>
    `;
  }
  result.innerHTML = html;
  result.className = 'calc-result show';
}

// ═══════════════════════════════
// CALCULATEUR AOP-03 — OSCILLATEURS
// ═══════════════════════════════
function calcAOP3() {
  const type = document.getElementById('aop3-type').value;
  const R1   = parseFloat(document.getElementById('aop3-r1').value) || 0;
  const R2   = parseFloat(document.getElementById('aop3-r2').value) || 0;
  const R    = parseFloat(document.getElementById('aop3-r').value) || 0;
  const C    = parseFloat(document.getElementById('aop3-c').value) || 0;
  const Vsat = parseFloat(document.getElementById('aop3-vsat').value) || 12;
  const result = document.getElementById('aop3-result');
  let html = '';

  if (type === 'schmitt') {
    if (R1 + R2 === 0) { result.innerHTML = '<div class="result-line"><span class="result-key">Erreur</span><span class="result-val" style="color:var(--accent2)">R₁ et R₂ requis</span></div>'; result.className='calc-result show'; return; }
    const Vp = Vsat * R1 / (R1 + R2);
    const Vm = -Vp;
    const dV = 2 * Vp;
    html = `
      <div class="result-line"><span class="result-key">Seuil haut V⁺</span><span class="result-val">+${Vp.toFixed(3)} V</span></div>
      <div class="result-line"><span class="result-key">Seuil bas V⁻</span><span class="result-val">${Vm.toFixed(3)} V</span></div>
      <div class="result-line"><span class="result-key">Largeur hystérésis ΔVH</span><span class="result-val">${dV.toFixed(3)} V</span></div>
      <div class="result-line"><span class="result-key">β = R₁/(R₁+R₂)</span><span class="result-val">${(R1/(R1+R2)).toFixed(4)}</span></div>
    `;
  } else if (type === 'astable') {
    if (R === 0 || C === 0 || R1 + R2 === 0) { result.innerHTML = '<div class="result-line"><span class="result-key">Erreur</span><span class="result-key" style="color:var(--accent2)">Tous paramètres requis</span></div>'; result.className='calc-result show'; return; }
    const beta = R2 / (R1 + R2);
    const tau  = R * 1e3 * C * 1e-9;
    const T    = 2 * tau * Math.log((1 + beta) / (1 - beta));
    const f    = 1 / T;
    html = `
      <div class="result-line"><span class="result-key">β = R₂/(R₁+R₂)</span><span class="result-val">${beta.toFixed(4)}</span></div>
      <div class="result-line"><span class="result-key">Constante τ = RC</span><span class="result-val">${(tau*1e6).toFixed(2)} µs</span></div>
      <div class="result-line"><span class="result-key">Période T</span><span class="result-val">${T >= 1e-3 ? (T*1e3).toFixed(3)+' ms' : (T*1e6).toFixed(1)+' µs'}</span></div>
      <div class="result-line"><span class="result-key">Fréquence f</span><span class="result-val">${f >= 1000 ? (f/1000).toFixed(2)+' kHz' : f.toFixed(1)+' Hz'}</span></div>
      <div class="result-line"><span class="result-key">Rapport cyclique</span><span class="result-val">50% (symétrique)</span></div>
    `;
  } else if (type === 'wien') {
    if (R === 0 || C === 0) { result.innerHTML = '<div class="result-line"><span class="result-key">Erreur</span><span class="result-val" style="color:var(--accent2)">R et C requis</span></div>'; result.className='calc-result show'; return; }
    const tau = R * 1e3 * C * 1e-9;
    const f0  = 1 / (2 * Math.PI * tau);
    html = `
      <div class="result-line"><span class="result-key">Fréquence f₀</span><span class="result-val">${f0 >= 1000 ? (f0/1000).toFixed(3)+' kHz' : f0.toFixed(1)+' Hz'}</span></div>
      <div class="result-line"><span class="result-key">Gain requis Av</span><span class="result-val">3 (exactement)</span></div>
      <div class="result-line"><span class="result-key">Rf = 2R₁ (ex: R₁)</span><span class="result-val">${R1.toFixed(1)} kΩ → Rf = ${(2*R1).toFixed(1)} kΩ</span></div>
      <div class="result-line"><span class="result-key">Atténuation réseau Wien à f₀</span><span class="result-val">1/3 ∠0°</span></div>
    `;
  }
  result.innerHTML = html;
  result.className = 'calc-result show';
}

// ═══════════════════════════════
// ═══════════════════════════════
function renderQCM(moduleId, questions) {
  const container = document.getElementById('qcm-' + moduleId);
  if (!container) return;
  container.innerHTML = '';
  let answered = 0, correct = 0;

  questions.forEach((q, qi) => {
    const card = document.createElement('div');
    card.className = 'qcm-card';
    card.id = 'qcard-' + moduleId + '-' + qi;

    const letters = ['A','B','C','D'];
    const optsHTML = q.opts.map((o,oi) => `
      <div class="qcm-opt" id="opt-${moduleId}-${qi}-${oi}" onclick="selectOpt('${moduleId}',${qi},${oi},${q.correct})">
        <div class="opt-letter">${letters[oi]}</div>${o}
      </div>`).join('');

    card.innerHTML = `
      <div class="qcm-q"><strong>Q${qi+1}.</strong> ${q.q}</div>
      <div class="qcm-options">${optsHTML}</div>
      <div class="qcm-explanation" id="expl-${moduleId}-${qi}">💡 ${q.expl}</div>`;
    container.appendChild(card);
  });

  // Score total
  const scoreDiv = document.createElement('div');
  scoreDiv.className = 'qcm-total';
  scoreDiv.id = 'score-' + moduleId;
  scoreDiv.innerHTML = `
    <div class="score-big" id="score-num-${moduleId}">0/${questions.length}</div>
    <div class="score-msg" id="score-msg-${moduleId}">Répondez à toutes les questions</div>
    <button class="retry-btn" onclick="retryQCM('${moduleId}')">Recommencer</button>`;
  container.appendChild(scoreDiv);
}

const qcmState = {};

function selectOpt(mid, qi, oi, correct) {
  const key = mid + '-' + qi;
  if (qcmState[key]) return; // already answered
  qcmState[key] = {chosen: oi, correct: correct, isCorrect: oi === correct};

  // Visual feedback
  const opts = document.querySelectorAll(`[id^="opt-${mid}-${qi}-"]`);
  opts.forEach((opt, i) => {
    opt.classList.add('disabled');
    if (i === correct) opt.classList.add('correct-answer');
  });
  const chosen = document.getElementById(`opt-${mid}-${qi}-${oi}`);
  if (oi === correct) {
    chosen.classList.add('selected', 'correct');
    document.getElementById(`qcard-${mid}-${qi}`).classList.add('correct');
  } else {
    chosen.classList.add('selected', 'wrong');
    document.getElementById(`qcard-${mid}-${qi}`).classList.add('wrong');
  }

  // Show explanation
  document.getElementById(`expl-${mid}-${qi}`).classList.add('show');

  // Check if all answered
  checkAllAnswered(mid);
}

function checkAllAnswered(mid) {
  const qs = QCMs[mid];
  let total = qs.length, answered = 0, correct = 0;
  qs.forEach((q,i) => {
    const k = mid + '-' + i;
    if (qcmState[k]) { answered++; if(qcmState[k].isCorrect) correct++; }
  });
  if (answered === total) {
    const scoreDiv = document.getElementById('score-' + mid);
    scoreDiv.classList.add('show');
    document.getElementById('score-num-' + mid).textContent = correct + '/' + total;
    const pct = Math.round(correct/total*100);
    let msg = pct >= 80 ? '🎉 Excellent ! Vous maîtrisez ce module.' :
              pct >= 60 ? '👍 Bien ! Revoyez les points incorrects.' :
              '📚 Continuez à réviser — relisez les explications.';
    document.getElementById('score-msg-' + mid).textContent = msg;
    state.progress[mid] = pct;
    state.scores[mid] = {correct, total};
  }
}

function retryQCM(mid) {
  // Reset state
  const qs = QCMs[mid];
  qs.forEach((q,i) => { delete qcmState[mid+'-'+i]; });
  document.getElementById('score-' + mid).classList.remove('show');
  renderQCM(mid, qs);
}

// ═══════════════════════════════
// PROGRESSION
// ═══════════════════════════════
const modules = ['complexes','signaux','impedances','puissances','methodologie','triphase','aop_bases','aop_lineaire','aop_oscillateurs'];
const moduleNames = ['Nombres Complexes','Signaux Sinusoïdaux','Lois & Impédances','Puissances','Méthodologie','Systèmes Triphasés','AOP — Bases','AOP — Montages Linéaires','AOP — Oscillateurs'];

function renderProgression() {
  const container = document.getElementById('progressItems');
  container.innerHTML = modules.map((m,i) => {
    const pct = state.progress[m] || 0;
    const score = state.scores[m] ? `${state.scores[m].correct}/${state.scores[m].total}` : '—';
    return `
      <div class="prog-item">
        <span class="prog-label">${moduleNames[i]}</span>
        <div class="prog-bar-wrap"><div class="prog-bar-fill" style="width:${pct}%"></div></div>
        <span class="prog-pct">${pct}%</span>
      </div>`;
  }).join('');
}

// ═══════════════════════════════
// INIT
// ═══════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  // Render all QCMs
  Object.keys(QCMs).forEach(mid => renderQCM(mid, QCMs[mid]));
  // Draw initial complex plane if loaded
  attachComplexPlaneHandlers();
  setTimeout(drawComplex, 100);
  // Show home
  showHome();
});
