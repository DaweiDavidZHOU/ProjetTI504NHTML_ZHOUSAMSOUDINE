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

const libellePiquant = [
    'Pas piquant',
    'Peu piquant',
    'Moyennement piquant',
    'Très piquant',
    '🔥 Hardcore 🔥'
];

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

let toutesLesRecettes = [];

function getLikes() {
    return JSON.parse(localStorage.getItem('recettesLikes') || '{}');
}

function sauvegarderLike(idRecette, aime) {
    const likes = getLikes();
    likes[idRecette] = aime;
    localStorage.setItem('recettesLikes', JSON.stringify(likes));
}

function fermerModale() {
    document.getElementById('modale-fond').classList.remove('ouverte');
}

function ouvrirModaleRecette(id) {
    const recette = toutesLesRecettes.find(r => r.rec_id === parseInt(id));
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

    const libelleBudget = { 1: '💰 Petit', 2: '💰💰 Moyen', 3: '💰💰💰 Grand' };
    const idxPiquant = Math.max(0, Math.min(4, parseInt(recette.rec_hotness) - 1));
    const piquant = libellePiquant[idxPiquant];
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
        const recetteCible = toutesLesRecettes.find(r => r.rec_id === id);
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

async function chargerRecettes() {
    try {
        const reponse = await fetch('../json/recdata.json');
        if (!reponse.ok) throw new Error('Fichier introuvable');
        const donnees = await reponse.json();
        toutesLesRecettes = donnees.recettes || donnees;
        
        afficherRecettesAleatoires();
    } catch (erreur) {
        console.error('Erreur chargement JSON :', erreur);
        document.getElementById('conteneur-recettes-aleatoires').innerHTML =
            '<p class="chargement-erreur">Impossible de charger les recettes. Vérifie le chemin vers json/recdata.json</p>';
    }
}

function choisirRecettesAleatoires(nombre = 5) {
    const melangees = [...toutesLesRecettes].sort(() => Math.random() - 0.5);
    
    const dejaVu = new Set();
    const selection = [];
    for (const r of melangees) {
        if (!dejaVu.has(r.rec_codePays)) {
            dejaVu.add(r.rec_codePays);
            selection.push(r);
        }
        if (selection.length >= nombre) break;
    }
    if (selection.length < nombre) {
        for (const r of melangees) {
            if (!selection.includes(r)) {
                selection.push(r);
            }
            if (selection.length >= nombre) break;
        }
    }
    return selection;
}

function afficherRecettesAleatoires() {
    const conteneur = document.getElementById('conteneur-recettes-aleatoires');
    const selection = choisirRecettesAleatoires(5);

    conteneur.innerHTML = selection.map(recette => {
        const paysNom = tousLesPays[recette.rec_codePays] || recette.rec_pays;
        const idxPiquant = Math.max(0, Math.min(4, parseInt(recette.rec_hotness) - 1));
        const piquant = libellePiquant[idxPiquant];
        const cheminImage = getCheminImage(recette.rec_nom);
        const emoji = getEmojiCategorie(paysNom);
        
        console.log("📸", recette.rec_nom, "→", cheminImage);

        return `
        <div class="carte-recette carte-recette-accueil">
            <div class="recette-image">
                <img src="${cheminImage}" alt="${recette.rec_nom}" loading="lazy"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <span class="emoji-fallback">${emoji}</span>
            </div>
            <div class="recette-contenu">
                <div class="recette-pays">${paysNom}</div>
                <h3>${recette.rec_nom}</h3>
                <div class="recette-meta">
                    <span>📊 ${recette.rec_difficulte || '-'}</span>
                    <span>⏱️ ${recette.rec_temps || '-'}</span>
                    <span>🌶️ ${piquant}</span>
                </div>
                <p class="recette-description">${(recette.rec_description || '').substring(0, 90)}...</p>
                <button class="lien-vers-recette" data-id="${recette.rec_id}">Voir →</button>
            </div>
        </div>
        `;
    }).join('');

    // Attacher les événements clic aux boutons "Voir →"
    document.querySelectorAll('.lien-vers-recette').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            ouvrirModaleRecette(this.dataset.id);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    chargerRecettes();
    
    // Fermeture modale
    document.getElementById('modale-fermer')?.addEventListener('click', fermerModale);
    document.getElementById('modale-fond')?.addEventListener('click', function(e) {
        if (e.target === this) fermerModale();
    });
});
