export class Feedback {
    static animateButton(button, message, duration = 1500, position = 'top') {
        button.classList.add('btn-no-diff');
        
        // Créer ou mettre à jour une balise style pour le message personnalisé
        let styleEl = document.getElementById('dynamic-btn-style');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'dynamic-btn-style';
            document.head.appendChild(styleEl);
        }
        
        // Définir le positionnement en fonction du paramètre
        let positionCSS = '';
        switch(position) {
            case 'top':
                positionCSS = `top: -25px !important; right: 0 !important; bottom: auto !important; left: auto !important; transform: translateY(0) !important;`;
                break;
            case 'bottom':
                positionCSS = `bottom: -25px !important; right: 0 !important; top: auto !important; left: auto !important; transform: translateY(0) !important;`;
                break;
            case 'left':
                positionCSS = `top: 50% !important; left: -80px !important; right: auto !important; bottom: auto !important; transform: translateY(-50%) !important;`;
                break;
            case 'right':
                positionCSS = `top: 50% !important; right: -80px !important; left: auto !important; bottom: auto !important; transform: translateY(-50%) !important;`;
                break;
            default:
                positionCSS = `top: -25px !important; right: 0 !important; bottom: auto !important; left: auto !important; transform: translateY(0) !important;`;
        }
        
        styleEl.textContent = `.btn-no-diff::after { content: '${message}' !important; ${positionCSS} }`;
        
        // Restaurer le bouton après l'animation
        setTimeout(() => {
            button.classList.remove('btn-no-diff');
        }, duration);
    }   
}