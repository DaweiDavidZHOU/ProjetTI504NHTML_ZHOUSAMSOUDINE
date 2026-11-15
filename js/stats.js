const tousLesPays = {
    'DZ': 'Algérie',
    'FR': 'France',
    'IT': 'Italie',
    'US': 'États-Unis',
    'DE': 'Allemagne',
    'BR': 'Brésil',
    'CN': 'Chine',
    'ES': 'Espagne',
    'GR': 'Grèce',
    'IN': 'Inde',
    'JP': 'Japon',
    'MA': 'Maroc',
    'MX': 'Mexique',
    'TH': 'Thaïlande',
    'VN': 'Vietnam',
    'GB': 'Royaume-Uni'
};

// Retourne la classe de la médaille selon la position
function getClasseMedaille(position) {
    if (position === 1) return 'or';
    if (position === 2) return 'argent';
    if (position === 3) return 'bronze';
    return '';
}

// Emoji par catégorie de recette (fallback image)
function getEmojiCategorie(pays) {
    const emojis = {
        'France': '🥐',
        'Italie': '🍝',
        'États-Unis': '🍔',
        'Allemagne': '🥨',
        'Brésil': '🥩',
        'Chine': '🥢',
        'Espagne': '🥘',
        'Grèce': '🫓',
        'Inde': '🍛',
        'Japon': '🍣',
        'Maroc': '🫓',
        'Mexique': '🌮',
        'Thaïlande': '🍜',
        'Vietnam': '🍜',
        'Royaume-Uni': '🥧',
        'Algérie': '🫓'
    };
    return emojis[pays] || '🍽️';
}

// Génère le nom du fichier image comme dans index.js
function getCheminImage(nomRecette) {
    const nomFichier = nomRecette.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/'/g, '-')
        .replace(/[éèêë]/g, 'e')
        .replace(/[àâäã]/g, 'a')
        .replace(/[ùûü]/g, 'u')
        .replace(/[ôöõ]/g, 'o')
        .replace(/[ïî]/g, 'i')
        .replace(/[ç]/g, 'c')
        .replace(/œ/g, 'oe')
        .replace(/æ/g, 'ae')
        .replace(/ñ/g, 'n')
        .replace(/[^a-z0-9-]/g, '') + '.jpg';
    return `../img/${nomFichier}`;
}

// Génère le HTML pour la miniature image
function creerMiniatureImage(recette, nomPays) {
    const emoji = getEmojiCategorie(nomPays);
    const cheminImage = getCheminImage(recette.rec_nom);

    return `
    <div class="miniature-image">
        <img src="${cheminImage}" alt="${recette.rec_nom}"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <span class="emoji-miniature" style="display:none;">${emoji}</span>
    </div>
    `;
}

// Génère le HTML pour un élément du classement
function creerElementClassement(recette, position) {
    const classeMedaille = getClasseMedaille(position);
    const nomPays = tousLesPays[recette.rec_codePays] || recette.rec_pays;
    const nbLikes = recette.rec_likes || 0;
    const miniatureHTML = creerMiniatureImage(recette, nomPays);

    return `
    <div class="element-classement">
        <div class="position ${classeMedaille}">${position}</div>
        ${miniatureHTML}
        <div class="contenu-classement">
            <div class="nom">${recette.rec_nom}</div>
            <div class="infos">${nomPays} • ${recette.rec_difficulte || '-'}</div>
        </div>
        <div class="votes-classement">❤️ ${nbLikes}</div>
        <button class="lien-vers-recette" data-id="${recette.rec_id}">Voir →</button>
    </div>
    `;
}

// Génère le HTML pour un élément de classement par pays — AVEC IMAGE DRAPEAU
function creerElementPays(nomPays, totalLikes, nbRecettes, position, codePays) {
    const classeMedaille = getClasseMedaille(position);
    const cheminDrapeau = `../img/flag-${codePays}.png`;

    return `
    <div class="element-classement">
        <div class="position ${classeMedaille}">${position}</div>
        <div class="miniature-image">
            <img src="${cheminDrapeau}" alt="Drapeau ${nomPays}" class="image-drapeau">
        </div>
        <div class="contenu-classement">
            <div class="nom">${nomPays}</div>
            <div class="infos">${nbRecettes} recette${nbRecettes > 1 ? 's' : ''}</div>
        </div>
        <div class="votes-classement">❤️ ${totalLikes}</div>
    </div>
    `;
}

// === GESTION DE LA MODALE ===
let donneesRecettes = [];

function getLikes() {
    return JSON.parse(localStorage.getItem('recettesLikes') || '{}');
}

function sauvegarderLike(idRecette, aime) {
    const likes = getLikes();
    likes[idRecette] = aime;
    localStorage.setItem('recettesLikes', JSON.stringify(likes));
}

function ouvrirModaleRecette(id) {
    const recette = donneesRecettes.find(r => r.rec_id === parseInt(id));
    if (!recette) return;

    const fond = document.getElementById('modale-fond');
    const corps = document.getElementById('modale-corps');
    const zoneImage = document.getElementById('modale-image');

    const nomPays = tousLesPays[recette.rec_codePays] || recette.rec_pays;
    const cheminImage = getCheminImage(recette.rec_nom);

    zoneImage.innerHTML = `
        <img src="${cheminImage}" alt="${recette.rec_nom}"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <span class="emoji-fallback" style="display:none;">${getEmojiCategorie(nomPays)}</span>
    `;

    const libellePiquant = [
        'Pas piquant',
        'Peu piquant',
        'Moyennement piquant',
        'Très piquant',
        '🔥 Hardcore 🔥'
    ];
    const libelleBudget = { 1: '💰 Petit', 2: '💰💰 Moyen', 3: '💰💰💰 Grand' };
    const piquant = libellePiquant[(recette.rec_hotness - 1)] || '-';
    const budget = libelleBudget[recette.rec_budget] || '-';
    const vege = recette.rec_vege ? '🥗 Végétarienne' : '';
    const allergeneHTML = recette.rec_allergie?.length
        ? `<span class="allergene">⚠️ ${recette.rec_allergie.join(', ')}</span>`
        : '';

    const metaHTML = `
    <div class="recette-meta">
        <span>📍 ${nomPays}</span>
        <span>⏱️ ${recette.rec_temps || '-'}</span>
        <span>🔥 ${piquant}</span>
        <span>${budget}</span>
        ${vege ? `<span>${vege}</span>` : ''}
        ${allergeneHTML}
    </div>
    `;

    const ingredientsHTML = recette.rec_ingredients?.length
        ? `<div class="recette-section">
            <h4>📝 Ingrédients</h4>
            <div class="recette-ingredients">
                <ul>${recette.rec_ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
            </div>
           </div>`
        : '';

    const etapesHTML = recette.rec_etapes?.length
        ? `<div class="recette-section">
            <h4>👨‍🍳 Étapes</h4>
            <div class="recette-etapes">
                <ol>${recette.rec_etapes.map(e => `<li>${e}</li>`).join('')}</ol>
            </div>
           </div>`
        : '';

    const likes = getLikes();
    const aimeDeja = !!likes[recette.rec_id];
    const nbLikesActuel = recette.rec_likes || 0;

    corps.innerHTML = `
        <h2 style="color:#2c5f2d; margin-bottom:0.5rem;">${recette.rec_nom}</h2>
        <div class="recette-meta">${metaHTML}</div>
        ${ingredientsHTML}
        ${etapesHTML}
        <div class="recette-actions" style="margin-top:1.5rem; padding-top:1rem; border-top:1px solid #eee;">
            <button class="bouton-like ${aimeDeja ? 'aimé' : ''}" data-id="${recette.rec_id}">
                ${aimeDeja ? '❤️' : '🤍'} <span class="compteur-like">${nbLikesActuel}</span>
            </button>
        </div>
    `;

    fond.classList.add('ouverte');

    corps.querySelector('.bouton-like').addEventListener('click', function() {
        const id = parseInt(this.dataset.id);
        const likes = getLikes();
        const aimeDeja = !!likes[id];
        const recetteCible = donneesRecettes.find(r => r.rec_id === id);
        if (!recetteCible) return;

        if (aimeDeja) {
            delete likes[id];
            recetteCible.rec_likes = (recetteCible.rec_likes || 0) - 1;
            this.classList.remove('aimé');
            this.innerHTML = `🤍 <span class="compteur-like">${recetteCible.rec_likes}</span>`;
        } else {
            likes[id] = true;
            recetteCible.rec_likes = (recetteCible.rec_likes || 0) + 1;
            this.classList.add('aimé');
            this.innerHTML = `❤️ <span class="compteur-like">${recetteCible.rec_likes}</span>`;
        }
        sauvegarderLike(id, !aimeDeja);
    });
}

function fermerModale() {
    document.getElementById('modale-fond').classList.remove('ouverte');
}

async function chargerStats() {
    try {
        const reponse = await fetch('../json/recdata.json');
        if (!reponse.ok) throw new Error('Fichier introuvable');
        
        const donnees = await reponse.json();
        donneesRecettes = donnees.recettes || donnees;

        // === 🏆 TOP 10 GLOBAL ===
        const topRecettes = [...donneesRecettes]
            .sort((a, b) => (b.rec_likes || 0) - (a.rec_likes || 0))
            .slice(0, 10);
        
        document.getElementById('top-recettes').innerHTML = topRecettes.map((r, i) => 
            creerElementClassement(r, i + 1)
        ).join('');

        // === 🌍 PAYS LES PLUS POPULAIRES — AVEC DRAPEAU ===
        const statsParPays = {};
        donneesRecettes.forEach(r => {
            const nomPays = tousLesPays[r.rec_codePays] || r.rec_pays;
            if (!statsParPays[nomPays]) {
                statsParPays[nomPays] = { likes: 0, count: 0, code: r.rec_codePays };
            }
            statsParPays[nomPays].likes += r.rec_likes || 0;
            statsParPays[nomPays].count++;
        });

        const topPays = Object.entries(statsParPays)
            .sort((a, b) => b[1].likes - a[1].likes)
            .slice(0, 8);
        
        document.getElementById('top-pays').innerHTML = topPays.map(([nom, data], i) => 
            creerElementPays(nom, data.likes, data.count, i + 1, data.code)
        ).join('');

        // === ⏱️ RECETTES RAPIDES ===
        const topRapides = [...donneesRecettes]
            .filter(r => r.rec_temps === '<30min')
            .sort((a, b) => (b.rec_likes || 0) - (a.rec_likes || 0))
            .slice(0, 5);
        
        if (topRapides.length > 0) {
            document.getElementById('top-rapides').innerHTML = topRapides.map((r, i) => 
                creerElementClassement(r, i + 1)
            ).join('');
        } else {
            document.getElementById('top-rapides').innerHTML = '<p class="chargement">Aucune recette rapide dans le classement pour le moment.</p>';
        }

        // === 🥗 RECETTES VÉGÉTARIENNES ===
        const topVege = [...donneesRecettes]
            .filter(r => r.rec_vege === true)
            .sort((a, b) => (b.rec_likes || 0) - (a.rec_likes || 0))
            .slice(0, 5);
        
        if (topVege.length > 0) {
            document.getElementById('top-vege').innerHTML = topVege.map((r, i) => 
                creerElementClassement(r, i + 1)
            ).join('');
        } else {
            document.getElementById('top-vege').innerHTML = '<p class="chargement">Aucune recette végétarienne dans le classement pour le moment.</p>';
        }

        // === 🖱️ GESTION DES CLICS ===
        document.querySelectorAll('.lien-vers-recette').forEach(lien => {
            lien.addEventListener('click', function(e) {
                e.preventDefault();
                ouvrirModaleRecette(this.dataset.id);
            });
        });

    } catch (erreur) {
        console.error('Erreur chargement stats :', erreur);
        document.getElementById('top-recettes').innerHTML = '<p class="chargement">Impossible de charger les classements.</p>';
        document.getElementById('top-pays').innerHTML = '<p class="chargement">Impossible de charger les classements.</p>';
        document.getElementById('top-rapides').innerHTML = '<p class="chargement">Impossible de charger les classements.</p>';
        document.getElementById('top-vege').innerHTML = '<p class="chargement">Impossible de charger les classements.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    chargerStats();
    
    document.getElementById('modale-fermer')?.addEventListener('click', fermerModale);
    document.getElementById('modale-fond')?.addEventListener('click', function(e) {
        if (e.target === this) fermerModale();
    });
});
