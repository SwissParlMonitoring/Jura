// Configuration
const DATA_URL = 'jura_data.json';
const DEBATES_URL = 'debates_data.json';
const ITEMS_PER_PAGE = 9;

// Élus jurassiens actuels
const ELUS_ACTUELS = [
    { nom: 'Juillard', prenom: 'Charles', pattern: /Charles\s+Juillard|Juillard\s+Charles/i, conseil: 'CE', parti: 'Le Centre', color: '#FF9900' },
    { nom: 'Crevoisier Crelier', prenom: 'Mathilde', pattern: /Mathilde\s+Crevoisier|Crevoisier\s+(Crelier\s+)?Mathilde/i, conseil: 'CE', parti: 'PS', color: '#E41019' },
    { nom: 'Stettler', prenom: 'Thomas', pattern: /Thomas\s+Stettler|Stettler\s+Thomas/i, conseil: 'CN', parti: 'UDC', color: '#009F4D' },
    { nom: 'Dobler', prenom: 'Loïc', pattern: /Lo[iï]c\s+Dobler|Dobler\s+Lo[iï]c/i, conseil: 'CN', parti: 'PS', color: '#E41019' }
];

// Anciens élus jurassiens
const ANCIENS_ELUS = [
    { nom: 'Fridez', prenom: 'Pierre-Alain', pattern: /Pierre[- ]?Alain\s+Fridez|Fridez\s+Pierre[- ]?Alain/i, conseil: 'CN', parti: 'PS', color: '#E41019', fin: '2026' }
];

// Tous les élus (actuels + anciens)
const ELUS_JURASSIENS = [...ELUS_ACTUELS, ...ANCIENS_ELUS];

// State
let allObjets = [];
let allDebats = [];
let baseObjets = [];   // objets filtrés par élus jurassiens
let baseDebats = [];   // débats filtrés par élus jurassiens
let filteredObjets = [];
let filteredDebats = [];
let displayedObjets = 0;
let displayedDebats = 0;
let activeElu = null;  // null = tous

// Couleurs des partis
const partyColors = {
    'Le Centre': '#FF9900', 'PS': '#E41019', 'PLR': '#0066CC',
    'UDC': '#009F4D', 'VERT-E-S': '#84B414', 'Vert\'libéraux': '#A8CF45'
};

function translateParty(party) {
    const t = { 'V': 'UDC', 'S': 'PS', 'RL': 'PLR', 'M-E': 'Le Centre', 'M': 'Le Centre', 'G': 'VERT-E-S', 'GL': 'Vert\'libéraux', 'BD': 'Le Centre', 'CEg': 'Le Centre' };
    return t[party] || party;
}

function isEluJurassien(author) {
    if (!author) return false;
    return ELUS_JURASSIENS.some(elu => elu.pattern.test(author));
}

function isSpeakerJurassien(speaker, canton) {
    if (canton === 'JU') return true;
    if (!speaker) return false;
    return ELUS_JURASSIENS.some(elu => elu.pattern.test(speaker));
}

function shouldIncludeDebat(item) {
    const speaker = item.speaker || '';
    const text = (item.text || '').toLowerCase();
    const year = parseInt(String(item.date || '').substring(0, 4)) || 0;
    if (speaker.includes('Baume') && year >= 2023) {
        return text.includes('jura') || text.includes('jurassien') || text.includes('jurassienne');
    }
    return true;
}

function findElu(text) {
    if (!text) return null;
    for (const elu of ELUS_JURASSIENS) {
        if (elu.pattern.test(text)) return elu;
    }
    return null;
}

// Badges basés UNIQUEMENT sur les mots-clés présents dans le texte
function getThemeBadges(item) {
    const themes = [];
    const text = [item.title || '', item.title_de || '', item.text || ''].join(' ');
    if (/\bjura\b/i.test(text)) themes.push('Jura');
    if (/\bmoutier\b/i.test(text)) themes.push('Moutier');
    if (/\b(rpt|nfa|finanzausgleich|péréquation\s*financière)\b/i.test(text)) themes.push('RPT');
    return themes.map(t => `<span class="badge badge-theme badge-theme-${t.toLowerCase()}">${t}</span>`).join('');
}

// Initialisation
document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        const [objetsJson, debatsJson] = await Promise.all([
            fetch(DATA_URL).then(r => r.json()),
            fetch(DEBATES_URL).then(r => r.json())
        ]);

        allObjets = objetsJson.items || [];
        allDebats = debatsJson.items || [];

        baseObjets = allObjets.filter(item => isEluJurassien(item.author))
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        baseDebats = allDebats.filter(item => isSpeakerJurassien(item.speaker, item.canton) && shouldIncludeDebat(item))
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        buildFilterButtons();
        setupEluCardClicks();
        applyFilter(null);
        setupLoadMore();

    } catch (error) {
        console.error('Erreur lors du chargement:', error);
    }
}

function buildFilterButtons() {
    const container = document.getElementById('elusFilterBtns');
    container.innerHTML = '';
    ELUS_JURASSIENS.forEach(elu => {
        const nbObjets = baseObjets.filter(o => elu.pattern.test(o.author)).length;
        const nbDebats = baseDebats.filter(d => elu.pattern.test(d.speaker)).length;
        const btn = document.createElement('button');
        btn.className = 'filter-btn-elu';
        btn.dataset.nom = elu.nom;
        btn.style.setProperty('--elu-color', elu.color);
        btn.innerHTML = `<span class="filter-btn-name">${elu.prenom} ${elu.nom}</span><span class="filter-btn-counts">${nbObjets} obj. · ${nbDebats} déb.</span>`;
        btn.addEventListener('click', () => {
            if (activeElu === elu.nom) {
                applyFilter(null);
            } else {
                applyFilter(elu.nom);
            }
        });
        container.appendChild(btn);
    });

    document.getElementById('filterReset').addEventListener('click', () => applyFilter(null));
}

function setupEluCardClicks() {
    document.querySelectorAll('.elu-card-filter').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const nom = card.dataset.nom;
            if (activeElu === nom) {
                applyFilter(null);
            } else {
                applyFilter(nom);
                document.getElementById('elusFilterBar').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function applyFilter(eluNom) {
    activeElu = eluNom;

    // Mettre à jour les boutons de la barre
    document.querySelectorAll('.filter-btn-elu').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.nom === eluNom);
    });
    // Mettre à jour les cartes élus
    document.querySelectorAll('.elu-card-filter').forEach(card => {
        card.classList.toggle('elu-card-active', card.dataset.nom === eluNom);
    });
    document.getElementById('filterReset').style.display = eluNom ? 'inline-flex' : 'none';

    // Filtrer
    if (eluNom) {
        const elu = ELUS_JURASSIENS.find(e => e.nom === eluNom);
        filteredObjets = baseObjets.filter(o => elu.pattern.test(o.author));
        filteredDebats = baseDebats.filter(d => elu.pattern.test(d.speaker));
    } else {
        filteredObjets = [...baseObjets];
        filteredDebats = [...baseDebats];
    }

    // Reset et re-render
    displayedObjets = 0;
    displayedDebats = 0;
    renderObjets(true);
    renderDebats(true);
}

function renderObjets(reset = false) {
    const container = document.getElementById('objetsResults');
    if (reset) container.innerHTML = '';

    document.getElementById('objetsCount').textContent = `${filteredObjets.length} objet${filteredObjets.length > 1 ? 's' : ''}`;

    if (filteredObjets.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucun objet trouvé.</p>';
        document.getElementById('loadMoreObjets').style.display = 'none';
        return;
    }

    const items = filteredObjets.slice(displayedObjets, displayedObjets + ITEMS_PER_PAGE);
    items.forEach(item => container.appendChild(createObjetCard(item)));
    displayedObjets += items.length;

    const btn = document.getElementById('loadMoreObjets');
    if (displayedObjets < filteredObjets.length) {
        btn.style.display = 'block';
        btn.textContent = `Voir plus (${filteredObjets.length - displayedObjets} restants)`;
    } else {
        btn.style.display = 'none';
    }
}

function renderDebats(reset = false) {
    const container = document.getElementById('debatsResults');
    if (reset) container.innerHTML = '';

    document.getElementById('debatsCount').textContent = `${filteredDebats.length} intervention${filteredDebats.length > 1 ? 's' : ''}`;

    if (filteredDebats.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucune intervention trouvée.</p>';
        document.getElementById('loadMoreDebats').style.display = 'none';
        return;
    }

    const items = filteredDebats.slice(displayedDebats, displayedDebats + ITEMS_PER_PAGE);
    items.forEach(item => container.appendChild(createDebatCard(item)));
    displayedDebats += items.length;

    const btn = document.getElementById('loadMoreDebats');
    if (displayedDebats < filteredDebats.length) {
        btn.style.display = 'block';
        btn.textContent = `Voir plus (${filteredDebats.length - displayedDebats} restants)`;
    } else {
        btn.style.display = 'none';
    }
}

function createObjetCard(item) {
    const card = document.createElement('article');
    card.className = 'card';

    const party = translateParty(item.party) || '';
    const partyColor = partyColors[party] || '#6B7280';
    const url = item.url_fr || item.url_de;
    const date = item.date ? new Date(item.date).toLocaleDateString('fr-CH') : '';
    const typeLabel = { 'Mo.': 'Mo.', 'Po.': 'Po.', 'Ip.': 'Ip.', 'Fra.': 'Fra.', 'Pa. Iv.': 'Iv. pa.', 'BRG': 'BRG', 'Kt. Iv.': 'Iv. ct.' }[item.type] || item.type;
    const council = item.council === 'NR' ? 'CN' : 'CE';
    const themeBadges = getThemeBadges(item);
    const isTitleMissing = !item.title || ['titre suit', 'titel folgt', 'titolo segue'].includes((item.title || '').toLowerCase().trim());
    const displayTitle = isTitleMissing && item.title_de ? item.title_de : (item.title || item.title_de || '');
    const langWarning = isTitleMissing && item.title_de ? '<span class="lang-warning">🌐 Uniquement en allemand</span>' : '';

    card.innerHTML = `
        <div class="card-header">
            <div class="card-header-left">
                <span class="badge badge-type">${typeLabel}</span>
                <span class="badge badge-council">${council}</span>
                ${themeBadges}
            </div>
            <span class="card-id">${item.shortId}</span>
        </div>
        <h3 class="card-title"><a href="${url}" target="_blank" rel="noopener">${displayTitle}</a></h3>
        ${langWarning}
        <div class="card-meta">
            <span>👤 ${item.author || ''}</span>
            <span class="card-party-badge" style="background:${partyColor};">${party}</span>
            <span>📅 ${date}</span>
        </div>
    `;
    return card;
}

function createDebatCard(item) {
    const card = document.createElement('article');
    card.className = 'card';

    const party = translateParty(item.party) || '';
    const partyColor = partyColors[party] || '#6B7280';
    const council = item.council === 'N' ? 'CN' : (item.council === 'S' ? 'CE' : item.council || '');
    const dateStr = String(item.date || '');
    const formattedDate = dateStr.length >= 8
        ? `${dateStr.substring(6, 8)}.${dateStr.substring(4, 6)}.${dateStr.substring(0, 4)}`
        : dateStr;
    const bulletinUrl = item.id
        ? `https://www.parlament.ch/fr/ratsbetrieb/amtliches-bulletin/amtliches-bulletin-die-verhandlungen?SubjectId=${item.id_subject}#votum${item.id}`
        : null;

    card.innerHTML = `
        <div class="card-header">
            <div class="card-header-left">
                <span class="badge badge-council">${council}</span>
            </div>
            <span class="card-id">${item.business_number || ''}</span>
        </div>
        <h3 class="card-title">${bulletinUrl
            ? `<a href="${bulletinUrl}" target="_blank">${item.business_title_fr || item.business_title || 'Débat'}</a>`
            : (item.business_title_fr || item.business_title || 'Débat')}</h3>
        <div class="card-meta">
            <span>👤 ${item.speaker || ''}</span>
            <span class="card-party-badge" style="background:${partyColor};">${party}</span>
            <span>📅 ${formattedDate}</span>
        </div>
    `;
    return card;
}

function setupLoadMore() {
    document.getElementById('loadMoreObjets').addEventListener('click', () => renderObjets());
    document.getElementById('loadMoreDebats').addEventListener('click', () => renderDebats());
}
