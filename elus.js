// Configuration
const DATA_URL = 'jura_data.json';
const DEBATES_URL = 'debates_data.json';
const ITEMS_PER_PAGE = 6;

// Élus jurassiens actuels
const ELUS_ACTUELS = [
    { nom: 'Juillard', prenom: 'Charles', pattern: /Charles\s+Juillard|Juillard\s+Charles/i, conseil: 'CE', parti: 'Le Centre' },
    { nom: 'Crevoisier Crelier', prenom: 'Mathilde', pattern: /Mathilde\s+Crevoisier|Crevoisier\s+(Crelier\s+)?Mathilde/i, conseil: 'CE', parti: 'PS' },
    { nom: 'Stettler', prenom: 'Thomas', pattern: /Thomas\s+Stettler|Stettler\s+Thomas/i, conseil: 'CN', parti: 'Le Centre' },
    { nom: 'Dobler', prenom: 'Loïc', pattern: /Lo[iï]c\s+Dobler|Dobler\s+Lo[iï]c/i, conseil: 'CN', parti: 'Le Centre' }
];

// Anciens élus jurassiens
const ANCIENS_ELUS = [
    { nom: 'Fridez', prenom: 'Pierre-Alain', pattern: /Pierre[- ]?Alain\s+Fridez|Fridez\s+Pierre[- ]?Alain/i, conseil: 'CN', parti: 'PS', fin: '2026' }
];

// Tous les élus (actuels + anciens)
const ELUS_JURASSIENS = [...ELUS_ACTUELS, ...ANCIENS_ELUS];

// State
let allObjets = [];
let allDebats = [];
let filteredObjets = [];
let filteredDebats = [];
let displayedObjets = 0;
let displayedDebats = 0;

// Traduction des types
const typeLabels = {
    'Mo.': 'Motion',
    'Po.': 'Postulat',
    'Ip.': 'Interpellation',
    'Fra.': 'Question',
    'Pa. Iv.': 'Initiative parlementaire',
    'Iv. pa.': 'Initiative parlementaire',
    'Iv. ct.': 'Initiative cantonale'
};

// Couleurs des partis
const partyColors = {
    'Le Centre': '#FF9800',
    'M-E': '#FF9800',
    'PS': '#E53935',
    'S': '#E53935',
    'PLR': '#2196F3',
    'RL': '#2196F3',
    'UDC': '#4CAF50',
    'V': '#4CAF50',
    'VERT-E-S': '#8BC34A',
    'G': '#8BC34A',
    'Vert\'libéraux': '#C6FF00',
    'GL': '#C6FF00'
};

// Traduction des partis
function translateParty(party) {
    const translations = {
        'V': 'UDC', 'S': 'PS', 'RL': 'PLR',
        'M-E': 'Le Centre', 'M': 'Le Centre',
        'G': 'VERT-E-S', 'GL': 'Vert\'libéraux',
        'BD': 'Le Centre', 'CEg': 'Le Centre'
    };
    return translations[party] || party;
}

// Vérifier si c'est un élu jurassien (par nom complet)
function isEluJurassien(author) {
    if (!author) return false;
    return ELUS_JURASSIENS.some(elu => elu.pattern.test(author));
}

// Vérifier si le speaker est jurassien (par canton JU uniquement pour les débats)
function isSpeakerJurassien(speaker, canton) {
    // Pour les débats, on utilise le canton JU comme critère principal
    if (canton === 'JU') return true;
    // Fallback sur le nom si pas de canton
    if (!speaker) return false;
    return ELUS_JURASSIENS.some(elu => elu.pattern.test(speaker));
}

// Trouver quel élu correspond
function findElu(text) {
    if (!text) return null;
    for (const elu of ELUS_JURASSIENS) {
        if (elu.pattern.test(text)) return elu;
    }
    return null;
}

// Initialisation
document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        // Charger les objets
        const objetsResponse = await fetch(DATA_URL);
        const objetsJson = await objetsResponse.json();
        allObjets = objetsJson.items || [];
        
        // Filtrer les objets des élus jurassiens
        filteredObjets = allObjets.filter(item => isEluJurassien(item.author));
        filteredObjets.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        
        // Charger les débats
        const debatsResponse = await fetch(DEBATES_URL);
        const debatsJson = await debatsResponse.json();
        allDebats = debatsJson.items || [];
        
        // Filtrer les débats des élus jurassiens
        filteredDebats = allDebats.filter(item => isSpeakerJurassien(item.speaker, item.canton));
        filteredDebats.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        
        // Afficher les stats
        updateStats();
        
        // Afficher les résultats
        renderObjets();
        renderDebats();
        
        // Setup load more buttons
        setupLoadMore();
        
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        document.getElementById('objetsResults').innerHTML = '<p class="error">Erreur de chargement</p>';
        document.getElementById('debatsResults').innerHTML = '<p class="error">Erreur de chargement</p>';
    }
}

function updateStats() {
    const objetsStats = document.getElementById('objetsStats');
    const debatsStats = document.getElementById('debatsStats');
    
    // Stats objets par élu
    const objetsParElu = {};
    ELUS_JURASSIENS.forEach(elu => objetsParElu[elu.nom] = 0);
    filteredObjets.forEach(obj => {
        const elu = findElu(obj.author);
        if (elu) objetsParElu[elu.nom]++;
    });
    
    objetsStats.innerHTML = `
        <span class="stat-total">${filteredObjets.length} objets</span>
        <div class="stat-detail">
            ${ELUS_JURASSIENS.map(elu => 
                `<span class="stat-elu">${elu.prenom} ${elu.nom}: ${objetsParElu[elu.nom]}</span>`
            ).join('')}
        </div>
    `;
    
    // Stats débats par élu (basé sur canton JU)
    const debatsParElu = {};
    ELUS_JURASSIENS.forEach(elu => debatsParElu[elu.nom] = 0);
    filteredDebats.forEach(debat => {
        // Compter par speaker si on peut identifier l'élu
        const elu = findElu(debat.speaker);
        if (elu) {
            debatsParElu[elu.nom]++;
        }
    });
    
    debatsStats.innerHTML = `
        <span class="stat-total">${filteredDebats.length} interventions</span>
        <div class="stat-detail">
            ${ELUS_JURASSIENS.map(elu => 
                `<span class="stat-elu">${elu.prenom} ${elu.nom}: ${debatsParElu[elu.nom]}</span>`
            ).join('')}
        </div>
    `;
}

function renderObjets() {
    const container = document.getElementById('objetsResults');
    const itemsToShow = filteredObjets.slice(displayedObjets, displayedObjets + ITEMS_PER_PAGE);
    
    if (displayedObjets === 0) {
        container.innerHTML = '';
    }
    
    if (filteredObjets.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucun objet trouvé pour nos élus.</p>';
        return;
    }
    
    itemsToShow.forEach(item => {
        const card = createObjetCard(item);
        container.appendChild(card);
    });
    
    displayedObjets += itemsToShow.length;
    
    // Bouton load more
    const loadMoreBtn = document.getElementById('loadMoreObjets');
    if (displayedObjets < filteredObjets.length) {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.textContent = `Voir plus (${filteredObjets.length - displayedObjets} restants)`;
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

function createObjetCard(item) {
    const card = document.createElement('article');
    card.className = 'card';
    
    const party = translateParty(item.party);
    const partyColor = partyColors[party] || partyColors[item.party] || '#6B7280';
    const type = typeLabels[item.type] || item.type;
    const url = item.url_fr || item.url_de;
    const date = item.date ? new Date(item.date).toLocaleDateString('fr-CH') : '';
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-id">${item.shortId}</span>
            <div class="card-badges">
                <span class="badge badge-type">${type}</span>
                <span class="badge badge-council">${item.council === 'NR' ? 'CN' : 'CE'}</span>
            </div>
        </div>
        <h3 class="card-title">
            <a href="${url}" target="_blank" rel="noopener">${item.title || item.title_de || 'Titre non disponible'}</a>
        </h3>
        <div class="card-meta">
            <span>👤 ${item.author || 'Inconnu'}</span>
            <span style="background: ${partyColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${party}</span>
            <span>📅 ${date}</span>
        </div>
    `;
    
    return card;
}

function renderDebats() {
    const container = document.getElementById('debatsResults');
    const itemsToShow = filteredDebats.slice(displayedDebats, displayedDebats + ITEMS_PER_PAGE);
    
    if (displayedDebats === 0) {
        container.innerHTML = '';
    }
    
    if (filteredDebats.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucune intervention trouvée pour nos élus.</p>';
        return;
    }
    
    itemsToShow.forEach(item => {
        const card = createDebatCard(item);
        container.appendChild(card);
    });
    
    displayedDebats += itemsToShow.length;
    
    // Bouton load more
    const loadMoreBtn = document.getElementById('loadMoreDebats');
    if (displayedDebats < filteredDebats.length) {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.textContent = `Voir plus (${filteredDebats.length - displayedDebats} restants)`;
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

function createDebatCard(item) {
    const card = document.createElement('article');
    card.className = 'card debate-card';
    
    const party = translateParty(item.party);
    const partyColor = partyColors[party] || partyColors[item.party] || '#6B7280';
    const council = item.council === 'N' ? 'CN' : (item.council === 'S' ? 'CE' : item.council);
    
    // Formater la date
    const dateStr = String(item.date);
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const formattedDate = `${day}.${month}.${year}`;
    
    // Lien bulletin
    const bulletinUrl = item.id ? `https://www.parlament.ch/fr/ratsbetrieb/amtliches-bulletin/amtliches-bulletin-die-verhandlungen?SubjectId=${item.id_subject}#votum${item.id}` : null;
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-id">${item.business_number || ''}</span>
            <div class="card-badges">
                <span class="badge badge-council">${council}</span>
            </div>
        </div>
        <h3 class="card-title">
            ${bulletinUrl ? `<a href="${bulletinUrl}" target="_blank">${item.business_title_fr || item.business_title || 'Débat'}</a>` : (item.business_title_fr || item.business_title || 'Débat')}
        </h3>
        <div class="card-meta">
            <span>� ${item.speaker}</span>
            <span style="background: ${partyColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${party}</span>
            <span>📅 ${formattedDate}</span>
        </div>
    `;
    
    return card;
}

function setupLoadMore() {
    document.getElementById('loadMoreObjets').addEventListener('click', () => {
        renderObjets();
    });
    
    document.getElementById('loadMoreDebats').addEventListener('click', () => {
        renderDebats();
    });
}
