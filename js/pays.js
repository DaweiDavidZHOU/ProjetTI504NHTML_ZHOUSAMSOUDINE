// js/pays.js

const infosPays = {
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

function getLikes() {
    return JSON.parse(localStorage.getItem('recettesLikes') || '{}');
}

function sauvegarderLike(idRecette, aime) {
    const likes = getLikes();
    likes[idRecette] = aime;
    localStorage.setItem('recettesLikes', JSON.stringify(likes));
}

// Fonction pour générer le nom du fichier image
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

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const codePays = params.get('pays');

    const titre = document.getElementById('nom-pays-titre');
    const compte = document.getElementById('compte-recettes-pays');
    const conteneur = document.getElementById('conteneur-recettes');

    if (!codePays) {
        titre.textContent = 'Pays non spécifié';
        compte.textContent = 'Veuillez sélectionner un pays sur la carte.';
        return;
    }

    try {
        const reponse = await fetch('../json/recdata.json');
        if (!reponse.ok) throw new Error('Fichier introuvable');
        
        const donnees = await reponse.json();
        const toutesLesRecettes = donnees.recettes || donnees;
        const likes = getLikes();

        const nomPays = infosPays[codePays] || codePays;
        const recettesDuPays = toutesLesRecettes.filter(r => r.rec_codePays === codePays);

        titre.textContent = nomPays;
        compte.textContent = `${recettesDuPays.length} recette${recettesDuPays.length > 1 ? 's' : ''} trouvée${recettesDuPays.length > 1 ? 's' : ''}`;

        if (recettesDuPays.length === 0) {
            conteneur.innerHTML = '<p class="aucune-recette">Aucune recette pour ce pays pour le moment.</p>';
            return;
        }

        conteneur.innerHTML = recettesDuPays.map((recette) => {
            const idRecette = recette.rec_id;
            const aimeDeja = likes[idRecette] === true;

            // Générer le nom de l'image
            const nomImage = obtenirNomImage(recette.rec_nom);
            const cheminImage = `../img/${nomImage}`; // ../ car pays.html est à la racine ou dans un dossier ? Ajuste si besoin

            // Métadonnées
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
                const niveauPiquant = [
                    'Pas piquant',
                    'Peu piquant',
                    'Moyennement piquant',
                    'Très piquant',
                    '🔥 Hardcore 🔥'
                ];
                const index = Math.max(0, Math.min(4, parseInt(recette.rec_hotness) - 1));
                metaHTML += `<span>🌶️ ${niveauPiquant[index]}</span>`;
            }

            // Ingrédients
            let ingredientsHTML = '';
            if (recette.rec_ingredients && Array.isArray(recette.rec_ingredients) && recette.rec_ingredients.length > 0) {
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

            // Étapes
            let etapesHTML = '';
            if (recette.rec_etapes && Array.isArray(recette.rec_etapes) && recette.rec_etapes.length > 0) {
                etapesHTML = `
                <div class="recette-section">
                    <h4>👩‍🍳 Étapes de préparation</h4>
                    <div class="recette-etapes">
                        <ol>
                            ${recette.rec_etapes.map(etape => `<li>${etape}</li>`).join('')}
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

            return `
            <div class="carte-recette" data-id="${idRecette}">
                <div class="recette-image">
                    <img src="${cheminImage}" alt="${recette.rec_nom}" loading="lazy"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <span class="emoji-fallback">🍽️</span>
                </div>
                <div class="recette-contenu">
                    <h3>${recette.rec_nom || 'Recette sans nom'}</h3>
                    <p class="recette-description">${recette.rec_description || ''}</p>
                    
                    <div class="recette-meta">${metaHTML}</div>
                    
                    ${ingredientsHTML}
                    ${etapesHTML}
                    
                    <div class="recette-actions">
                        <button class="bouton-like ${aimeDeja ? 'aimé' : ''}" data-id="${idRecette}">
                            ♡ <span class="compteur-like">${recette.rec_likes || 0}</span>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        // Gestion des likes
        conteneur.querySelectorAll('.bouton-like').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                const compteur = this.querySelector('.compteur-like');
                let valeur = parseInt(compteur.textContent || '0');
                const aime = !this.classList.contains('aimé');

                if (aime) {
                    valeur++;
                    this.classList.add('aimé');
                } else {
                    valeur--;
                    this.classList.remove('aimé');
                }

                compteur.textContent = valeur;
                sauvegarderLike(id, aime);
            });
        });

    } catch (erreur) {
        console.error('Erreur chargement JSON :', erreur);
        titre.textContent = 'Erreur';
        compte.textContent = 'Impossible de charger les recettes.';
    }
});
