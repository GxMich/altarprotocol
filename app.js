// --- CONFIGURAZIONE ---
const CONFIG = {
    SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxQLW-RAAqoO3mSQBeLUm_1mcYu08X2BDjz8u2ZrZXHnaCJixUnurNrb0XYAoBnp8SnGw/exec", // <--- IMPORTANTE
    MY_WALLET: "0x63F75cbDF27A0e4f6F2453bd075F3c10cAe729A4", // <--- IMPORTANTE
    MAX_CAP: 85000
};
let state = { currentPrice: 49.00, audioUnlocked: false };

document.addEventListener("DOMContentLoaded", () => {
    fetchData(); 
    setupAudio();
    setInterval(fetchData, 30000);
});

function fetchData() {
    fetch(CONFIG.SCRIPT_URL)
    .then(res => res.json())
    .then(data => {
        // Prezzo
        state.currentPrice = parseFloat(data.current_price);
        document.getElementById('next-price-display').innerText = `${state.currentPrice.toFixed(2)}€`;
        
        // Re Attuale
        if(data.current_king && data.current_king !== "NESSUNO") {
            document.getElementById('king-name').innerText = data.current_king;
        }
        if(data.current_decree) {
            document.getElementById('king-decree').innerText = data.current_decree.replace(/"/g, '');
            document.getElementById('king-price').innerText = `${(state.currentPrice / 1.1).toFixed(2)}€`;
        }
        
        // Progress Bar
        const raised = parseFloat(data.total_raised);
        document.getElementById('total-raised-display').innerText = `${raised.toLocaleString()}€`;
        const percent = (raised / CONFIG.MAX_CAP) * 100;
        document.getElementById('progress-bar').style.width = `${Math.min(percent, 100)}%`;

        // Storico
        const list = document.getElementById('graveyard-list');
        if (data.history && data.history.length > 0) {
            list.innerHTML = "";
            data.history.forEach(item => {
                list.innerHTML += `<div class="grave-item"><strong>${item.alias}</strong><span>${item.importo}€</span></div>`;
            });
        } else {
            list.innerHTML = '<div class="grave-item" style="justify-content:center">Nessun caduto.</div>';
        }
    })
    .catch(err => console.error(err));
}

function handleAscension() {
    const alias = document.getElementById('user-alias').value;
    const decree = document.getElementById('user-decree').value;
    const email = document.getElementById('user-email').value;

    if(!alias || !decree || !email) return alert("Compila tutti i campi.");
    if(decree.length > 60) return alert("Decreto troppo lungo.");

    openCryptoModal();
}

function openCryptoModal() {
    document.getElementById('modal-price-display').innerText = `${state.currentPrice.toFixed(2)}€`;
    document.getElementById('wallet-address').innerText = CONFIG.MY_WALLET;
    document.getElementById('qr-image').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${CONFIG.MY_WALLET}`;
    document.getElementById('cryptoModal').style.display = 'flex';
    playAudio();
}

function closeCryptoModal() {
    document.getElementById('cryptoModal').style.display = 'none';
}

function copyAddress() {
    navigator.clipboard.writeText(CONFIG.MY_WALLET);
    alert("Indirizzo copiato!");
}

function submitPayment() {
    const txHash = document.getElementById('tx-hash').value.trim();
    if(txHash.length < 5) return alert("Hash non valido.");
    
    const btn = document.getElementById('btn-confirm-payment');
    const status = document.getElementById('payment-status');
    btn.style.display = 'none';
    status.innerText = "VERIFICA IN CORSO...";

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
            alert(`PAGAMENTO CONFERMATO.\nBenvenuto sul trono, ${data.position}° Re.`);
            window.location.reload();
        } else { throw new Error(data.error); }
    })
    .catch(err => {
        btn.style.display = 'block';
        status.innerText = "ERRORE: " + err.message;
    });
}

function setupAudio() {
    const audio = document.getElementById('altar-audio');
    audio.volume = 0.2;
    document.body.addEventListener('click', () => { if(!state.audioUnlocked) { audio.play(); state.audioUnlocked = true; } }, {once:true});
}
function playAudio() {
    const audio = document.getElementById('altar-audio');
    if(audio.paused) audio.play();
    audio.volume = 0.5;
}
window.updateCharCount = function(el) {
    document.getElementById('char-count').innerText = `${el.value.length}/60`;
}
// --- GESTIONE LEGALE & COOKIE ---

const LEGAL_TEXTS = {
    privacy: `
        <h4>1. RACCOLTA DATI</h4>
        <p>Raccogliamo esclusivamente l'Alias e l'email forniti per la gestione del protocollo. I dati della transazione sono pubblici sulla blockchain di riferimento.</p>
        <h4>2. FINALITÀ</h4>
        <p>I dati servono per l'attribuzione del titolo di Dominus e per comunicazioni relative all'ordine.</p>
    `,
    terms: `
        <h4>1. NATURA DEL SERVIZIO</h4>
        <p>L'ascesa al trono è un atto simbolico e digitale. Il tributo inviato non è rimborsabile data la natura irreversibile della blockchain.</p>
        <h4>2. RESPONSABILITÀ</h4>
        <p>L'utente è responsabile del contenuto del proprio Decreto. Contenuti illeciti verranno rimossi senza preavviso.</p>
    `,
    cookies: `
        <h4>COOKIE TECNICI</h4>
        <p>Utilizziamo esclusivamente cookie tecnici necessari al funzionamento del sito e alla memorizzazione del consenso. Nessun dato di tracciamento marketing viene utilizzato.</p>
    `
};

function openLegal(type) {
    const modal = document.getElementById('legal-modal');
    const title = document.getElementById('legal-title');
    const content = document.getElementById('legal-content');

    const titles = { privacy: "PRIVACY POLICY", terms: "TERMINI DEL SERVIZIO", cookies: "COOKIE POLICY" };
    
    title.innerText = titles[type];
    content.innerHTML = LEGAL_TEXTS[type];
    modal.style.display = 'flex';
}

function closeLegal() {
    document.getElementById('legal-modal').style.display = 'none';
}

function acceptCookies() {
    localStorage.setItem('cookiesAccepted', 'true');
    document.getElementById('cookie-banner').style.display = 'none';
}

// Controlla cookie all'avvio
document.addEventListener("DOMContentLoaded", () => {
    if(!localStorage.getItem('cookiesAccepted')) {
        document.getElementById('cookie-banner').style.display = 'flex';
    }
});