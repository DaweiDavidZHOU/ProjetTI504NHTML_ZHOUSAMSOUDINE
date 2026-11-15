// js/index.js

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

let toutesLesRecettes = [];

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
    // Mélanger et prendre n recettes
    const melangees = [...toutesLesRecettes].sort(() => Math.random() - 0.5);
    
    // Éviter plusieurs recettes du même pays si possible
    const dejaVu = new Set();
    const selection = [];
    for (const r of melangees) {
        if (!dejaVu.has(r.rec_codePays)) {
            dejaVu.add(r.rec_codePays);
            selection.push(r);
        }
        if (selection.length >= nombre) break;
    }
    // Si pas assez de pays différents, compléter avec les mélangées
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
        
        // Génère le nom du fichier image
        const nomImage = recette.rec_nom.toLowerCase()
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

        const cheminImage = `../img/${nomImage}`;
        
        console.log("📸", recette.rec_nom, "→", cheminImage); // pour déboguer

        return `
        <div class="carte-recette carte-recette-accueil">
            <div class="recette-image">
                <img src="${cheminImage}" alt="${recette.rec_nom}" loading="lazy"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <span class="emoji-fallback">🍽️</span>
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
                <a href="liste.html" class="btn btn-fiche">Voir la recette →</a>
            </div>
        </div>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', chargerRecettes);
