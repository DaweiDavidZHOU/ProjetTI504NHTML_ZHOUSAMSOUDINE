document.addEventListener('DOMContentLoaded', () => {
    const objetSvg = document.getElementById('carte-svg');
    const zoneInfo = document.getElementById('info-pays');
    const nomPaysAffichage = document.getElementById('nom-pays');
    const compteRecettes = document.getElementById('compte-recettes');
    const lienVersPays = document.getElementById('lien-vers-pays');

    // Classe CSS dans le SVG → [Nom affiché, nb recettes, code ISO]
    const paysDisponibles = {
        'dz': ['Algérie', 4, 'DZ'],
        'fr': ['France', 8, 'FR'],
        'it': ['Italie', 5, 'IT'],
        'us': ['United States', 4, 'US'],
        'de': ['Germany', 3, 'DE'],
        'br': ['Brazil', 3, 'BR'],
        'cn': ['China', 3, 'CN'],
        'es': ['Spain', 3, 'ES'],
        'gr': ['Greece', 3, 'GR'],
        'in': ['India', 3, 'IN'],
        'jp': ['Japan', 3, 'JP'],
        'ma': ['Morocco', 3, 'MA'],
        'mx': ['Mexico', 3, 'MX'],
        'th': ['Thailand', 3, 'TH'],
        'vn': ['Vietnam', 3, 'VN'],
        'gb': ['United Kingdom', 2, 'GB']
    };

    objetSvg.addEventListener('load', () => {
        const svgDoc = objetSvg.contentDocument;

        Object.entries(paysDisponibles).forEach(([classeSvg, [nom, nbRecettes, codeISO]]) => {
            const tousTerritoires = svgDoc.querySelectorAll(`.landxx.${classeSvg}`);

            if (tousTerritoires.length > 0) {
                tousTerritoires.forEach(el => el.classList.add('disponible'));

                tousTerritoires.forEach(el => {
                    el.addEventListener('click', (e) => {
                        e.preventDefault();
                        svgDoc.querySelectorAll('.landxx').forEach(p => p.classList.remove('selectionne'));
                        tousTerritoires.forEach(t => t.classList.add('selectionne'));

                        nomPaysAffichage.textContent = nom;
                        compteRecettes.textContent = `${nbRecettes} recette${nbRecettes > 1 ? 's' : ''} disponible${nbRecettes > 1 ? 's' : ''}`;
                        lienVersPays.href = `pays.html?pays=${codeISO}`;
                        zoneInfo.classList.add('visible');
                    });
                });
            } else {
                console.warn(`⚠️ Classe ".landxx.${classeSvg}" introuvable dans le SVG — vérifie le code de l'Algérie`);
            }
        });
    });
});
