// --- CONFIGURAZIONE ---
const CONFIG = {
    SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyaxyG73x5KhkM7YqiKU4gWRXeuUCwJhlq0ZRabRLT8aoHAiWaeRi8UpoTZ-4D-UiES0A/exec", 
    MY_WALLET: "0x63F75cbDF27A0e4f6F2453bd075F3c10cAe729A4", 
    MAX_CAP: 84000 
};

// --- TRADUZIONI ---
const TRANSLATIONS = {
    it: {
        saturation_level: "SATURAZIONE PROTOCOLLO",
        graveyard_title: "ARCHIVIO RE DECADUTI",
        current_dominus: "REGNANTE ATTUALE",
        tribute_paid: "TRIBUTO VINCOLATO",
        label_identity: "ALIAS",
        label_email: "CONTATTO",
        label_decree: "DECRETO (Max 60)",
        btn_offer: "INIZIALIZZA ASCESA",
        btn_closed: "PROTOCOLLO TERMINATO",
        modal_crypto_title: "TRASFERIMENTO ASSET",
        btn_copy: "COPIA",
        btn_confirm: "VERIFICA TRANSAZIONE",
        cookie_text: "Memoria locale utilizzata. Nessun tracker.",
        cookie_btn: "ACCETTA",
        link_rules: "REGOLE",
        link_privacy: "PRIVACY",
        link_terms: "TERMINI",
        info_intro: "Il protocollo è attivo. Ogni tributo versato sovrascrive irreversibilmente il regnante precedente.",
        alert_soldout: "CAPACITÀ MASSIMA RAGGIUNTA. IL TRONO È SIGILLATO.",
        status_verify: "VERIFICA BLOCCO...",
        status_success: "TRANSAZIONE CONFERMATA. GLORIA AL NUOVO RE.",
        default_decree: "Il Trono attende.",
        history_empty: "Nessun predecessore."
    },
    en: {
        saturation_level: "PROTOCOL SATURATION",
        graveyard_title: "LEDGER OF FALLEN KINGS",
        current_dominus: "CURRENT RULER",
        tribute_paid: "LOCKED TRIBUTE",
        label_identity: "ALIAS",
        label_email: "CONTACT",
        label_decree: "DECREE (Max 60)",
        btn_offer: "INITIATE ASCENSION",
        btn_closed: "PROTOCOL ENDED",
        modal_crypto_title: "ASSET TRANSFER",
        btn_copy: "COPY",
        btn_confirm: "VERIFY TX",
        cookie_text: "Local storage only. No trackers.",
        cookie_btn: "ACCEPT",
        link_rules: "RULES",
        link_privacy: "PRIVACY",
        link_terms: "TERMS",
        info_intro: "Protocol active. Ascension is irreversible. Highest tribute overwrites the previous ruler instantly.",
        alert_soldout: "MAX CAPACITY REACHED. THE THRONE IS SEALED.",
        status_verify: "VERIFYING BLOCK...",
        status_success: "TX CONFIRMED. GLORY TO THE NEW KING.",
        default_decree: "The Throne awaits.",
        history_empty: "No predecessors."
    }
};

// --- TESTI LEGALI ---
const LEGAL_TEXTS = {
    it: {
        rules: `<h3>1. IL PROTOCOLLO</h3><p>Altar non è un investimento. È un meccanismo di gerarchia digitale basato sulla pura volontà economica. Chi offre il tributo più alto conquista il controllo dello spazio visivo (Il Trono).</p><h3>2. DINAMICA DI SOVRASCRITTURA</h3><p>Quando un nuovo tributo viene confermato dalla blockchain, il Re precedente viene immediatamente rimosso. Il suo nome viene archiviato nel "Ledger dei Caduti".</p><h3>3. FINALITÀ</h3><p>I fondi raccolti sono irreversibili e contribuiscono al mantenimento dell'infrastruttura.</p>`,
        privacy: `<h3>RISERVATEZZA</h3><p>Il sistema è progettato per il minimalismo dei dati. Non utilizziamo database di marketing.</p><h3>DATI TRATTATI</h3><p>Solo ciò che è pubblicamente visibile: il tuo Alias e il tuo Decreto. L'email serve esclusivamente come canale di recupero d'emergenza.</p>`,
        terms: `<h3>ACCETTAZIONE</h3><p>Interagendo con lo Smart Contract o inviando fondi al wallet del protocollo, l'utente accetta che la transazione è una donazione a fondo perduto.</p><p>Nessun diritto di rimborso è previsto, indipendentemente dalla durata del regno.</p>`
    },
    en: {
        rules: `<h3>1. THE PROTOCOL</h3><p>Altar is not an investment. It is a digital hierarchy mechanism based on economic will. The highest tribute seizes control of the visual space (The Throne).</p><h3>2. OVERWRITE DYNAMICS</h3><p>When a new tribute is confirmed, the previous King is instantly removed. Their legacy is archived in the "Ledger of the Fallen".</p><h3>3. PURPOSE</h3><p>Funds are irreversible and support infrastructure maintenance.</p>`,
        privacy: `<h3>DATA SANCTITY</h3><p>System designed for data minimalism. No marketing databases used.</p><h3>PROCESSED DATA</h3><p>Only what is publicly visible: Alias and Decree. Email serves solely as an emergency recovery channel.</p>`,
        terms: `<h3>ACCEPTANCE</h3><p>By interacting with the contract or sending funds, the user accepts the transaction is a non-refundable donation.</p><p>No refund rights exist, regardless of reign duration.</p>`
    }
};

let state = { currentPrice: 49.00, audioUnlocked: false, isSoldOut: false, lang: 'it' };

document.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem('altar_lang');
    if(saved) state.lang = saved;
    applyLanguage();

    fetchData(); 
    setupAudio();
    initLegalAndCookies();
    setInterval(fetchData, 30000);
});

function toggleLanguage() {
    state.lang = state.lang === 'it' ? 'en' : 'it';
    localStorage.setItem('altar_lang', state.lang);
    applyLanguage();
}

function applyLanguage() {
    const t = TRANSLATIONS[state.lang];
    document.getElementById('lang-btn').innerText = state.lang === 'it' ? 'EN' : 'IT';
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if(t[key]) el.innerText = t[key];
    });
    updateButtonState();
}

function fetchData() {
    fetch(`${CONFIG.SCRIPT_URL}?t=${Date.now()}`)
    .then(res => res.json())
    .then(data => {
        const raised = parseFloat(data.total_raised) || 0;
        state.currentPrice = parseFloat(data.current_price) || 0;
        state.isSoldOut = (data.is_sold_out === true || data.is_sold_out === "true") || (raised >= CONFIG.MAX_CAP);

        document.getElementById('king-name').innerText = (data.current_king && data.current_king !== "NESSUNO") ? data.current_king : "NO ONE";
        document.getElementById('king-decree').innerText = data.current_decree ? data.current_decree.replace(/"/g, '') : TRANSLATIONS[state.lang].default_decree;
        document.getElementById('king-price').innerText = (data.current_king_price ? parseFloat(data.current_king_price).toFixed(2) : "0.00") + "€";
        
        document.getElementById('total-raised-display').innerText = raised.toLocaleString() + "€";
        document.getElementById('progress-bar').style.width = Math.min((raised / CONFIG.MAX_CAP) * 100, 100) + "%";
        document.getElementById('percent-display').innerText = ((raised / CONFIG.MAX_CAP) * 100).toFixed(1) + "%";

        // HISTORY LIST WITH NUMBERS
        const list = document.getElementById('graveyard-list');
        list.innerHTML = "";
        if (data.history && data.history.length > 0) {
            data.history.forEach((item, index) => {
                // Calcolo numero progressivo: index + 1
                const num = index + 1;
                list.innerHTML += `
                    <div class="history-pill">
                        <span class="h-rank">NO. ${num+1}</span>
                        <span class="h-alias">${item.alias}</span>
                        <span class="h-price">${item.importo}€</span>
                    </div>`;
            });
        } else {
             list.innerHTML = `<div class="history-pill" style="opacity:0.5"><span class="h-alias">${TRANSLATIONS[state.lang].history_empty}</span></div>`;
        }
        updateButtonState();
    });
}

function updateButtonState() {
    const btnText = document.querySelector('#btn-ascend .btn-text');
    const priceDisplay = document.getElementById('next-price-display');
    const t = TRANSLATIONS[state.lang];

    if (state.isSoldOut) {
        btnText.innerText = t.btn_closed;
        priceDisplay.style.display = 'none';
        document.getElementById('btn-ascend').classList.add('sold-out-btn');
    } else {
        btnText.innerText = t.btn_offer;
        priceDisplay.style.display = 'block';
        priceDisplay.innerText = state.currentPrice.toFixed(2) + "€";
        document.getElementById('btn-ascend').classList.remove('sold-out-btn');
    }
}

function handleAscension() {
    if (state.isSoldOut) return alert(TRANSLATIONS[state.lang].alert_soldout);
    const alias = document.getElementById('user-alias').value;
    const decree = document.getElementById('user-decree').value;
    const email = document.getElementById('user-email').value;

    if(!alias || !decree || !email) return alert("Required fields missing.");
    
    document.getElementById('modal-price-display').innerText = state.currentPrice.toFixed(2) + "€";
    document.getElementById('wallet-address').innerText = CONFIG.MY_WALLET;
    document.getElementById('qr-image').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${CONFIG.MY_WALLET}`;
    document.getElementById('cryptoModal').style.display = 'flex';
    playAudio();
}

function submitPayment() {
    const txHash = document.getElementById('tx-hash').value.trim();
    if(txHash.length < 5) return;
    
    const btn = document.getElementById('btn-confirm-payment');
    const status = document.getElementById('payment-status');
    const t = TRANSLATIONS[state.lang];

    btn.style.display = 'none';
    status.innerText = t.status_verify;

    const formData = new FormData();
    formData.append('alias', document.getElementById('user-alias').value);
    formData.append('decreto', document.getElementById('user-decree').value);
    formData.append('email', document.getElementById('user-email').value);
    formData.append('crypto_type', 'ETH');
    formData.append('tx_hash', txHash);

    fetch(CONFIG.SCRIPT_URL, { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => {
        if(data.result === 'success') {
            alert(t.status_success);
            window.location.reload();
        } else { throw new Error(data.error); }
    })
    .catch(err => {
        btn.style.display = 'block';
        status.innerText = "Error: " + err.message;
    });
}

function openLegal(type) {
    const content = document.getElementById('legal-content');
    const title = document.getElementById('legal-title');
    title.innerText = type.toUpperCase();
    content.innerHTML = LEGAL_TEXTS[state.lang][type];
    document.getElementById('legal-modal').style.display = 'flex';
}
function closeLegal() { document.getElementById('legal-modal').style.display = 'none'; }
function closeCryptoModal() { document.getElementById('cryptoModal').style.display = 'none'; }
function copyAddress() { navigator.clipboard.writeText(CONFIG.MY_WALLET); }
function updateCharCount(el) { document.getElementById('char-count').innerText = el.value.length + "/60"; }
function initLegalAndCookies() {
    if(!localStorage.getItem('cookiesAccepted')) document.getElementById('cookie-banner').style.display = 'flex';
    if(!localStorage.getItem('hasSeenRules')) { openLegal('rules'); localStorage.setItem('hasSeenRules', 'true'); }
}
function acceptCookies() {
    localStorage.setItem('cookiesAccepted', 'true');
    document.getElementById('cookie-banner').style.display = 'none';
}
function setupAudio() {
    const audio = document.getElementById('altar-audio');
    document.body.addEventListener('click', () => { 
        if(!state.audioUnlocked && audio) { audio.volume=0.2; audio.play().catch(e=>{}); state.audioUnlocked=true; } 
    }, {once:true});
}
function playAudio() {
    const audio = document.getElementById('altar-audio');
    if(audio && state.audioUnlocked) audio.play();
}