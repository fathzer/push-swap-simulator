// =============================================================================
// StackDrawer — dessine une liste d'entiers positifs ou nuls sous forme
//               de barres dégradées, avec une valeur de référence pour 100%.
//
// Usage :
//   const drawer = new StackDrawer(items, maxValue);
//   drawer.draw(ctx, value, index, x, y, w, h);   // passé à CircularList
//
//   drawer.setItems(items)      // remplace la liste (ListAdapter d'entiers)
//   drawer.setMaxValue(max)     // redéfinit la référence 100%
//
// Le dégradé reproduit le CSS original :
//   background: linear-gradient(to right,
//     hsl(hue, 70%, 50%) var(--width),
//     #222               var(--width))
// avec hue = 200 + ratio * 120  (bleu ciel → violet)
// =============================================================================

import { ListAdapter } from './circularList.js';

export class StackDrawer {
  #items;
  #maxValue;

  /**
   * @param {ListAdapter} items     - ListAdapter contenant des entiers >= 0
   * @param {number}      maxValue  - valeur correspondant à 100%
   */
  constructor(items, maxValue) {
    console.log('StackDrawer constructor', items, maxValue);
    this.#items    = items;
    this.#maxValue = maxValue;

    // On bind draw() pour qu'il puisse être passé directement à CircularList
    // sans perdre le contexte `this`
    this.draw = this.draw.bind(this);
  }

  // ── API publique ───────────────────────────────────────────────────────────

  setItems(items) {
    this.#items = items;
  }

  setMaxValue(maxValue) {
    this.#maxValue = maxValue;
  }

  getItems() {
    return this.#items;
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
    const dark  = '#222222';

    // Largeur du label index : calé sur le nombre de chiffres de maxValue
    const indexDigits = String(this.#maxValue).length;
    const fontSize    = Math.min(11, Math.max(9, (h - MARGIN * 2) * 0.5));

    ctx.font = `500 ${fontSize}px monospace`;
    const indexLabel = '#' + String(index).padStart(indexDigits, '0');
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
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font      = `500 ${fontSize}px monospace`;
    ctx.fillText(indexLabel, PAD, textY);

    // Valeur brute (dans la barre, côté gauche)
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(String(value), barX + PAD, textY);
  }
}