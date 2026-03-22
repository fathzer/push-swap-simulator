// =============================================================================
// StackDrawer — dessine une liste d'entiers positifs ou nuls sous forme
//               de barres dégradées, avec une valeur de référence pour 100%.
//
// Usage :
//   const drawer = new StackDrawer(maxValue);
//   drawer.draw(ctx, value, index, x, y, w, h);   // passé à CircularList
//
//   drawer.setMaxValue(max)     // redéfinit la référence 100%
// =============================================================================

export class StackDrawer {
  #highlightedNumbers = [];
  #maxValue;

  /**
   * @param {number}      maxValue  - valeur correspondant à 100%
   */
  constructor(maxValue) {
    this.#maxValue = maxValue;

    // On bind draw() pour qu'il puisse être passé directement à CircularList
    // sans perdre le contexte `this`
    this.draw = this.draw.bind(this);
  }

  // ── API publique ───────────────────────────────────────────────────────────

  setMaxValue(maxValue) {
    this.#maxValue = maxValue;
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────

  /**
   * Fonction de dessin compatible avec la signature attendue par CircularList :
   *   draw(ctx, value, index, x, y, width, height)
   *
   * Ici `value` est l'entier brut stocké dans la liste ; le ratio est calculé
   * en interne par rapport à #maxValue.
   */
  draw(ctx, value, index, x, y, w, h) {
    const PAD    = 5;
    const MARGIN = 1;

    const ratio = this.#maxValue > 0 ? Math.min(value / this.#maxValue, 1) : 0;

    // Teinte : hue = 200 + ratio * 120  (bleu ciel 200° → violet 320°)
    const hue   = 200 + ratio * 120;
    const color = `hsl(${hue}, 70%, 50%)`;
    const dark  = '#222';

    // Largeur du label index : calé sur le nombre de chiffres de maxValue
    const indexDigits = String(this.#maxValue).length;
    const fontSize    = Math.min(11, Math.max(9, (h - MARGIN * 2) * 0.5));

    ctx.font = `500 ${fontSize}px monospace`;
    let indexLabel = String(index).padStart(indexDigits, '0');
    indexLabel = (index === 0 ? ' ' : '#') + indexLabel;
    const indexW     = ctx.measureText(indexLabel).width;

    // barX : PAD (bord gauche) + texte index + PAD (séparation)
    const barX   = PAD + indexW + PAD;
    const barMax = w - barX - PAD;       // barre jusqu'au bord droit - PAD
    const barH   = h - MARGIN * 2;
    const barY   = y + MARGIN;

    // Dégradé avec transition franche à `ratio`
    const grad = ctx.createLinearGradient(barX, 0, barX + barMax, 0);
    if (ratio > 0) {
      grad.addColorStop(0,                          color);
      grad.addColorStop(ratio,                      color);
      grad.addColorStop(Math.min(ratio + 0.001, 1), dark);
    }
    grad.addColorStop(1, dark);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barMax, barH, 4);
    ctx.fill();

    // Label index (à gauche de la barre)
    const textY = y + h / 2 + fontSize * 0.35;
    const isHighlighted = this.#highlightedNumbers.includes(value);
    if (isHighlighted) {
      ctx.fillStyle = 'orange';
    } else {
      ctx.fillStyle = `rgba(255,255,255, ${index === 0 ? 1 : 0.55})`;
    }
    ctx.font      = `500 ${fontSize}px monospace`;
    ctx.fillText(indexLabel, PAD, textY);

    // Add white triangle to the left of index 0
    if (index === 0) {
      const triangleSize = 8;
      const triangleX = Math.max(1, PAD - triangleSize - 2);
      const triangleY = y + h / 2;
      
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.moveTo(triangleX + triangleSize, triangleY);
      ctx.lineTo(triangleX, triangleY - triangleSize/2);
      ctx.lineTo(triangleX, triangleY + triangleSize/2);
      ctx.closePath();
      ctx.fill();
    }

    // Valeur brute (dans la barre, côté gauche)
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(String(value), barX + PAD, textY);
  }

  highlightNumbers(numbers) {
    // TODO: Implement highlighting logic
    console.log('Highlighting numbers:', numbers);
    this.#highlightedNumbers = numbers;
  }
}
