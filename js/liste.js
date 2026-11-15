function getLikes() {
    return JSON.parse(localStorage.getItem('recettesLikes') || '{}');
}

function sauvegarderLike(idRecette, aime) {
    const likes = getLikes();
    likes[idRecette] = aime;
    localStorage.setItem('recettesLikes', JSON.stringify(likes));
}

const libellePiquant = [
    'Pas piquant',
    'Peu piquant',
    'Moyennement piquant',
    'Très piquant',
    '🔥 Hardcore 🔥'
];

const libelleBudget = {
    1: '💰 Petit',
    2: '💰💰 Moyen',
    3: '💰💰💰 Grand'
};

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

let toutesLesRecettes = [];
let colonneTri = null;
let sensTri = 1;
const ordreInitial = [];

async function chargerRecettes() {
    try {
        const reponse = await fetch('../json/recdata.json');
        if (!reponse.ok) throw new Error('Fichier introuvable');
        const donnees = await reponse.json();
        toutesLesRecettes = donnees.recettes || donnees;
        toutesLesRecettes.forEach(r => ordreInitial.push(r.rec_id));

        const selectPays = document.getElementById('filtre-pays');
        Object.entries(tousLesPays).forEach(([code, nom]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = nom;
            selectPays.appendChild(option);
        });

        appliquerFiltres();
        attacherEvenements();
        attacherTri();
        gererModale();
    } catch (erreur) {
        console.error('Erreur chargement JSON :', erreur);
        document.getElementById('corps-tableau').innerHTML =
            '<tr><td colspan="10" class="aucune-ligne">Impossible de charger les recettes. Vérifie le chemin vers json/recdata.json</td></tr>';
    }
}

function trierResultats(resultats) {
    if (!colonneTri) {
        return resultats.slice().sort((a, b) => {
            return ordreInitial.indexOf(a.rec_id) - ordreInitial.indexOf(b.rec_id);
        });
    }

    return resultats.slice().sort((a, b) => {
        let valA = a[colonneTri];
        let valB = b[colonneTri];

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (colonneTri === 'rec_difficulte') {
            const ordre = { 'Facile': 1, 'Moyenne': 2, 'Difficile': 3 };
            return ((ordre[valA] || 0) - (ordre[valB] || 0)) * sensTri;
        }

        if (colonneTri === 'rec_temps') {
            const ordre = { '<30min': 1, '<1h': 2, '>1h': 3 };
            return ((ordre[valA] || 0) - (ordre[valB] || 0)) * sensTri;
        }

        if (colonneTri === 'rec_hotness') {
            return ((valA || 0) - (valB || 0)) * sensTri;
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
            return (valA - valB) * sensTri;
        }

        return String(valA).localeCompare(String(valB), 'fr') * sensTri;
    });
}

function appliquerFiltres() {
    const recherche = document.getElementById('recherche').value.toLowerCase();
    const pays = document.getElementById('filtre-pays').value;
    const difficulte = document.getElementById('filtre-difficulte').value;
    const temps = document.getElementById('filtre-temps').value;
    const piquant = document.getElementById('filtre-piquant').value;
    const budget = document.getElementById('filtre-budget').value;
    const vegeSeulement = document.getElementById('filtre-vege').checked;
    const seulementLikees = document.getElementById('filtre-likees').checked;
    const likes = getLikes();

    const resultats = toutesLesRecettes.filter(recette => {
        if (seulementLikees && !likes[recette.rec_id]) return false;
        if (recherche) {
            const nom = (recette.rec_nom || '').toLowerCase();
            const desc = (recette.rec_description || '').toLowerCase();
            const ingredients = Array.isArray(recette.rec_ingredients)
                ? recette.rec_ingredients.join(' ').toLowerCase()
                : '';
            if (!nom.includes(recherche) && !desc.includes(recherche) && !ingredients.includes(recherche)) {
                return false;
            }
        }
        if (pays && recette.rec_codePays !== pays) return false;
        if (difficulte && recette.rec_difficulte !== difficulte) return false;
        if (temps && recette.rec_temps !== temps) return false;
        if (piquant && recette.rec_hotness !== parseInt(piquant)) return false;
        if (budget && recette.rec_budget !== parseInt(budget)) return false;
        if (vegeSeulement && recette.rec_vege !== true) return false;
        return true;
    });

    const resultatsTries = trierResultats(resultats);
    afficherTableau(resultatsTries);
}

function afficherTableau(resultats) {
    const corps = document.getElementById('corps-tableau');
    const compteur = document.getElementById('compte-resultats');
    const likes = getLikes();

    compteur.textContent = `${resultats.length} recette${resultats.length > 1 ? 's' : ''} trouvée${resultats.length > 1 ? 's' : ''}`;

    if (resultats.length === 0) {
        corps.innerHTML = '<tr><td colspan="10" class="aucune-ligne">Aucune recette ne correspond à vos filtres.</td></tr>';
        return;
    }

    corps.innerHTML = resultats.map(recette => {
        const id = recette.rec_id;
        const aime = likes[id] === true;

        let affichagePiquant = '-';
        if (recette.rec_hotness >= 1) {
            const idx = Math.max(0, Math.min(4, parseInt(recette.rec_hotness) - 1));
            affichagePiquant = libellePiquant[idx];
        }
        const affichageBudget = recette.rec_budget ? libelleBudget[recette.rec_budget] : '-';
        const affichageVege = recette.rec_vege === true ? '✅' : '❌';

        let affichageAllergene = '-';
        if (recette.rec_allergie?.length > 0) {
            affichageAllergene = `<span class="allergene">${recette.rec_allergie.join(', ')}</span>`;
        }

        return `
        <tr>
            <td><strong><a href="#" class="lien-recette" data-id="${id}">${recette.rec_nom}</a></strong></td>
            <td>${tousLesPays[recette.rec_codePays] || recette.rec_pays}</td>
            <td>${recette.rec_difficulte || '-'}</td>
            <td>${recette.rec_temps || '-'}</td>
            <td>${affichagePiquant}</td>
            <td>${affichageBudget}</td>
            <td>${affichageVege}</td>
            <td>${affichageAllergene}</td>
            <td>${recette.rec_likes || 0}</td>
            <td>
                <button class="bouton-like-tableau ${aime ? 'aimé' : ''}" data-id="${id}">
                    ♡
                </button>
            </td>
        </tr>
        `;
    }).join('');

    attacherEvenementsLikes();
    attacherLiensRecettes();
}

function attacherTri() {
    document.querySelectorAll('#tableau-recettes th[data-tri]').forEach(entete => {
        entete.style.cursor = 'pointer';
        entete.addEventListener('click', function() {
            const colonneCliquee = this.dataset.tri;

            if (colonneTri === colonneCliquee) {
                if (sensTri === 1) {
                    sensTri = -1;
                } else if (sensTri === -1) {
                    colonneTri = null;
                    sensTri = 1;
                }
            } else {
                colonneTri = colonneCliquee;
                sensTri = 1;
            }

            appliquerFiltres();
        });
    });
}

function attacherLiensRecettes() {
    document.querySelectorAll('.lien-recette').forEach(lien => {
        lien.addEventListener('click', function(e) {
            e.preventDefault();
            const id = parseInt(this.dataset.id);
            const recette = toutesLesRecettes.find(r => r.rec_id === id);
            if (recette) ouvrirModale(recette);
        });
    });
}

function obtenirNomImage(texte) {
    return texte.toLowerCase()
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
}

function ouvrirModale(recette) {
    const fond = document.getElementById('modale-fond');
    const corps = document.getElementById('modale-corps');
    const likes = getLikes();
    const aimeDeja = likes[recette.rec_id] === true;

    const nomImage = obtenirNomImage(recette.rec_nom);
    const cheminImage = `../img/${nomImage}`;

    let metaHTML = '';
    if (recette.rec_temps) metaHTML += `<span>⏱️ ${recette.rec_temps}</span>`;
    if (recette.rec_difficulte) metaHTML += `<span>📊 Difficulté : ${recette.rec_difficulte}</span>`;
    if (recette.rec_budget !== undefined) {
        const budget = '💰'.repeat(recette.rec_budget);
        metaHTML += `<span>Budget : ${budget}</span>`;
    }
    if (recette.rec_vege === true) metaHTML += `<span>🥗 Végétarien</span>`;
    if (recette.rec_allergie && recette.rec_allergie.length > 0) {
        metaHTML += `<span class="allergene">⚠️ Allergènes : ${recette.rec_allergie.join(', ')}</span>`;
    }
    if (recette.rec_hotness !== undefined) {
        const idx = Math.max(0, Math.min(4, parseInt(recette.rec_hotness) - 1));
        metaHTML += `<span>🌶️ ${libellePiquant[idx]}</span>`;
    }
    metaHTML += `<span>🌍 ${tousLesPays[recette.rec_codePays] || recette.rec_pays}</span>`;

    let ingredientsHTML = '';
    if (recette.rec_ingredients?.length > 0) {
        ingredientsHTML = `
        <div class="recette-section">
            <h4>🥗 Ingrédients</h4>
            <div class="recette-ingredients">
                <ul>
                    ${recette.rec_ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>
            </div>
        </div>`;
    }

    let etapesHTML = '';
    if (recette.rec_etapes?.length > 0) {
        etapesHTML = `
        <div class="recette-section">
            <h4>👩‍🍳 Étapes de préparation</h4>
            <div class="recette-etapes">
                <ol>
                    ${recette.rec_etapes.map(e => `<li>${e}</li>`).join('')}
                </ol>
            </div>
        </div>`;
    } else {
        etapesHTML = `
        <div class="recette-section">
            <h4>👩‍🍳 Étapes de préparation</h4>
            <p style="color:#999;font-style:italic;">Aucune étape détaillée pour cette recette.</p>
        </div>`;
    }

    corps.innerHTML = `
        <div class="modale-image">
            <img src="${cheminImage}" alt="${recette.rec_nom}" loading="lazy"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <span class="emoji-fallback">🍽️</span>
        </div>
        <h2 style="color:#2c5f2d; margin-bottom:0.5rem;">${recette.rec_nom}</h2>
        <p class="recette-description">${recette.rec_description || ''}</p>
        <div class="recette-meta">${metaHTML}</div>
        ${ingredientsHTML}
        ${etapesHTML}
        <div class="recette-actions" style="margin-top:1.5rem; padding-top:1rem; border-top:1px solid #eee;">
            <button class="bouton-like ${aimeDeja ? 'aimé' : ''}" data-id="${recette.rec_id}">
                ♡ <span class="compteur-like">${recette.rec_likes || 0}</span>
            </button>
        </div>
    `;

    fond.classList.add('ouverte');

    const btnLike = corps.querySelector('.bouton-like');
    btnLike.addEventListener('click', function() {
        const id = parseInt(this.dataset.id);
        const compteur = this.querySelector('.compteur-like');
        let valeur = parseInt(compteur.textContent || '0');
        const aime = !this.classList.contains('aimé');

        if (aime) { valeur++; this.classList.add('aimé'); }
        else { valeur--; this.classList.remove('aimé'); }

        compteur.textContent = valeur;
        sauvegarderLike(id, aime);
        appliquerFiltres();
    });
}

function gererModale() {
    const fond = document.getElementById('modale-fond');
    const boutonFermer = document.getElementById('modale-fermer');

    boutonFermer.addEventListener('click', () => fond.classList.remove('ouverte'));
    fond.addEventListener('click', (e) => { if (e.target === fond) fond.classList.remove('ouverte'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && fond.classList.contains('ouverte')) fond.classList.remove('ouverte'); });
}

function attacherEvenementsLikes() {
    const seulementLikees = document.getElementById('filtre-likees');
    document.querySelectorAll('.bouton-like-tableau').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            const aimeMaintenant = !this.classList.contains('aimé');

            if (aimeMaintenant) this.classList.add('aimé');
            else this.classList.remove('aimé');

            const recette = toutesLesRecettes.find(r => r.rec_id === id);
            if (recette) {
                if (aimeMaintenant) recette.rec_likes = (recette.rec_likes || 0) + 1;
                else recette.rec_likes = Math.max(0, (recette.rec_likes || 0) - 1);
            }

            sauvegarderLike(id, aimeMaintenant);
            appliquerFiltres();
        });
    });
}

function attacherEvenements() {
    document.getElementById('recherche').addEventListener('input', appliquerFiltres);
    document.getElementById('filtre-pays').addEventListener('change', appliquerFiltres);
    document.getElementById('filtre-difficulte').addEventListener('change', appliquerFiltres);
    document.getElementById('filtre-temps').addEventListener('change', appliquerFiltres);
    document.getElementById('filtre-piquant').addEventListener('change', appliquerFiltres);
    document.getElementById('filtre-budget').addEventListener('change', appliquerFiltres);
    document.getElementById('filtre-vege').addEventListener('change', appliquerFiltres);
    document.getElementById('filtre-likees').addEventListener('change', appliquerFiltres);
}

document.addEventListener('DOMContentLoaded', chargerRecettes);
