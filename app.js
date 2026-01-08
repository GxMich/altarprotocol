const CONFIG = {
  DB_URL: "https://script.google.com/macros/s/AKfycbyTWNUSiQCbsOOOd5MRtsRyBH6PbT3Px-GM0BhLsMeXOra0Upc-c4N15sz7uvOech1Uxg/exec",
  WALLET: "0x63F75cbDF27A0e4f6F2453bd075F3c10cAe729A4",
  DECAY: 0.95
};

// --- INTERNATIONALIZATION (i18n) ---
const TRANSLATIONS = {
  it: {
    title: "Altar Protocol",
    tagline: "L'élite non aspetta. Prendi il comando.",
    currentOrigin: "Il Sovrano Attuale",
    btnDefend: "Difendi Segnale",
    phAlias: "Il tuo Alias",
    btnAscend: "DETRONIZZA ORA",
    hierarchy: "Ordine di Dominanza",
    usurpation: "CADUTA DEL REGNO",
    linkTerms: "Termini",
    linkPrivacy: "Privacy",
    linkDisclaimer: "Disclaimer",
    toastTxSent: "Transazione inviata. Attendi...",
    toastSuccess: "Ascensione completata!",
    toastErrInput: "Inserisci Alias e Importo",
    toastErrTx: "Errore Transazione",
    toastNotOrigin: "Non sei il Signal Origin",
    toastDefended: "Segnale Difeso",
    legalTitle_terms: "Termini e Condizioni",
    legalTitle_privacy: "Privacy Policy",
    legalTitle_disclaimer: "ESCLUSIONE DI RESPONSABILITÀ D'ÉLITE",
    loading: "Caricamento...",
    nobody: "Nessuno"
  },
  en: {
    title: "Altar Protocol",
    tagline: "The elite don't wait. Take control.",
    currentOrigin: "Current Sovereign",
    btnDefend: "Defend Signal",
    phAlias: "Your Alias",
    btnAscend: "USURP POSITION",
    hierarchy: "Order of Dominance",
    usurpation: "KINGDOM FALLEN",
    linkTerms: "Terms",
    linkPrivacy: "Privacy",
    linkDisclaimer: "Disclaimer",
    toastTxSent: "Transaction sent. Please wait...",
    toastSuccess: "Ascension complete!",
    toastErrInput: "Enter Alias and Amount",
    toastErrTx: "Transaction Error",
    toastNotOrigin: "You are not the Signal Origin",
    toastDefended: "Signal Defended",
    legalTitle_terms: "Terms & Conditions",
    legalTitle_privacy: "Privacy Policy",
    legalTitle_disclaimer: "ELITE DISCLAIMER",
    loading: "Loading...",
    nobody: "Nobody"
  }
};

let appState = {
  data: [],
  lastKing: null,
  lang: 'it',
  theme: 'dark'
};

// --- CORE LOGIC ---

async function load() {
  initTheme();
  updateTexts();
  
  try {
    const res = await fetch(CONFIG.DB_URL);
    const rows = await res.json();
    appState.lastKing = appState.data[0] || null;
    appState.data = rows.map(r => {
      const days = (Date.now() - new Date(r[0])) / 86400000;
      return { alias: r[1], wallet: r[2], power: r[3] * Math.pow(CONFIG.DECAY, days) };
    }).sort((a,b) => b.power - a.power);
    render();
    overrideCheck();
  } catch (e) { console.error(e); }
}

function render() {
  const t = TRANSLATIONS[appState.lang];
  const king = appState.data[0];
  const kingName = king ? king.alias : t.nobody;
  const kingPower = king ? `${king.power.toFixed(4)} ETH` : "--- ETH";

  document.getElementById('kingAlias').innerText = kingName;
  document.getElementById('kingPower').innerText = kingPower;

  const board = document.getElementById('board');
  board.innerHTML = "";
  appState.data.forEach((p, i) => {
    board.innerHTML += `
      <li style="animation-delay: ${i*0.05}s; animation-name: slideIn; opacity:0; animation-fill-mode: forwards;">
        <div><span class="rank">#${i + 1}</span><span class="player-alias">${p.alias}</span></div>
        <span class="player-power">${p.power.toFixed(4)}</span>
      </li>`;
  });
}

// --- ACTIONS ---

async function ascend() {
  const t = TRANSLATIONS[appState.lang];
  const alias = document.getElementById('aliasInput').value;
  const amount = document.getElementById('amountInput').value;

  if (!alias || !amount) return showToast(t.toastErrInput, 'error');

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const wallet = await signer.getAddress();
    
    const tx = await signer.sendTransaction({
      to: CONFIG.WALLET,
      value: ethers.utils.parseEther(amount)
    });

    showToast(t.toastTxSent, 'info');

    await fetch(CONFIG.DB_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias, wallet, amount: parseFloat(amount), tx: tx.hash })
    });

    showToast(t.toastSuccess, 'success');
  } catch (err) {
    console.error(err);
    showToast(t.toastErrTx, 'error');
  }
}

async function defend() {
  const t = TRANSLATIONS[appState.lang];
  if (!appState.data[0]) return;
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const wallet = await signer.getAddress();

    if (wallet.toLowerCase() !== appState.data[0].wallet.toLowerCase()) {
      return showToast(t.toastNotOrigin, 'error');
    }
    await signer.signMessage("DEFEND ALTAR");
    showToast(t.toastDefended, 'success');
  } catch (err) { showToast(t.toastErrTx, 'error'); }
}

function overrideCheck() {
  if (!appState.lastKing || !appState.data[0]) return;
  if (appState.lastKing.wallet !== appState.data[0].wallet) {
    document.getElementById('overrideText').innerText = `${appState.lastKing.alias} → ${appState.data[0].alias}`;
    const el = document.getElementById('override');
    el.classList.add('active');
    setTimeout(()=>el.classList.remove('active'), 4000);
  }
}

// --- UI & UTILS ---

function showToast(msg, type) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'warning-circle' : 'info';
  toast.innerHTML = `<i class="ph-bold ph-${icon}"></i> <span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(()=>toast.remove(), 3000);
}

// Theme Handling
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  appState.theme = saved;
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon();
}

function toggleTheme() {
  appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', appState.theme);
  localStorage.setItem('theme', appState.theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = document.getElementById('themeIcon');
  icon.className = appState.theme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
}

// Language Handling
function toggleLanguage() {
  appState.lang = appState.lang === 'it' ? 'en' : 'it';
  document.getElementById('currentLang').innerText = appState.lang.toUpperCase();
  updateTexts();
  render(); // Re-render per aggiornare i testi dinamici (nobody, etc)
}

function updateTexts() {
  const t = TRANSLATIONS[appState.lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(t[key]) el.innerText = t[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if(t[key]) el.placeholder = t[key];
  });
}

// Legal Modals
const LEGAL_CONTENT = {
  terms: `<strong>1. Accettazione</strong><br>Utilizzando Altar Protocol, accetti che questo sia un esperimento sperimentale su blockchain. Nessuna garanzia di funzionamento è fornita.<br><br><strong>2. Transazioni</strong><br>Le transazioni ETH sono irreversibili. Sei l'unico responsabile delle tue chiavi private e dei fondi inviati.`,
  privacy: `<strong>1. Dati Raccolti</strong><br>Non raccogliamo email o password. Memorizziamo solo l'indirizzo pubblico del wallet e l'alias fornito associati alla transazione sulla blockchain.<br><br><strong>2. Cookie</strong><br>Utilizziamo solo LocalStorage per salvare la tua preferenza di tema (chiaro/scuro). Nessun cookie di tracciamento di terze parti.`,
  disclaimer: `<strong>NON È UNA CONSULENZA FINANZIARIA</strong><br>Altar Protocol è un gioco/esperimento sociale decentralizzato. Non vi è alcuna promessa di profitto o ritorno. Il valore inviato è una donazione al protocollo per guadagnare "potere" virtuale nel gioco.<br><br><strong>LIMITAZIONE DI RESPONSABILITÀ</strong><br>Gli sviluppatori non sono responsabili per perdite di fondi derivanti da bug degli smart contract, hack o errori dell'utente.`
};

// Simple English override for legal (simplified for brevity in this example)
const LEGAL_CONTENT_EN = {
  terms: `<strong>1. Acceptance</strong><br>By using Altar Protocol, you agree this is an experimental blockchain project provided "as is".<br><br><strong>2. Transactions</strong><br>ETH transactions are irreversible. You are solely responsible for your funds.`,
  privacy: `<strong>1. Data</strong><br>We only store public wallet addresses and aliases. No personal data is collected.<br><br><strong>2. Cookies</strong><br>We only use LocalStorage for theme preferences.`,
  disclaimer: `<strong>NOT FINANCIAL ADVICE</strong><br>This is a social experiment/game. No profit is guaranteed. Funds sent are donations to the protocol mechanism.<br><br><strong>LIABILITY</strong><br>Developers are not liable for fund losses due to bugs or user error.`
};

function openModal(type) {
  const t = TRANSLATIONS[appState.lang];
  const content = appState.lang === 'it' ? LEGAL_CONTENT : LEGAL_CONTENT_EN;
  
  document.getElementById('modalTitle').innerText = t[`legalTitle_${type}`];
  document.getElementById('modalContent').innerHTML = content[type];
  document.getElementById('legalModal').showModal();
}

function closeModal() {
  document.getElementById('legalModal').close();
}

// Chiudi modal cliccando fuori
document.getElementById('legalModal').addEventListener('click', (e) => {
  const rect = e.target.getBoundingClientRect();
  if (rect.left > e.clientX || rect.right < e.clientX || rect.top > e.clientY || rect.bottom < e.clientY) {
    closeModal();
  }
});

// Animations CSS injection helper
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes slideIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
`;
document.head.appendChild(styleSheet);

window.onload = load;