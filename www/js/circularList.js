// =============================================================================
// CircularList.js
//
// Usage :
//   const list = new CircularList(container, items, options, draw);
//
// items   : tout objet exposant .get(index) et .getSize()
//           (utiliser ListAdapter pour wrapper un tableau simple)
//
// options : { itemHeight=14, gap=0, wheelStep=40, friction=0.92 }
//
// draw    : (ctx, value, index, x, y, width, height) => void
//           appelée pour chaque élément visible à chaque frame
//
// API :
//   list.setItems(items)
//   list.setOptions(opts)
//   list.scrollTo(index, anchor='middle')   anchor : 'top' | 'middle' | 'bottom'
// =============================================================================

export class CircularList {
  // ── Champs privés ──────────────────────────────────────────────────────────
  #container;
  #items;
  #drawFn;
  #opt;

  #canvas;
  #ctx;
  #ro;

  #W = 0;
  #H = 0;
  #offset   = 0;
  #velocity = 0;
  #raf      = null;

  #dragging = false;
  #lastY    = 0;
  #lastT    = 0;

  #onWheel;
  #onMouseDown;
  #onMouseMove;
  #onMouseUp;
  #onTouchStart;
  #onTouchMove;
  #onTouchEnd;

  #lastSize = 0;

  // ── Méthodes utilitaires ───────────────────────────────────────────────────────
  
  #snapOffsetToGrid(offset) {
    const { itemHeight, gap } = this.#opt;
    const STEP = itemHeight + gap;
    const n = this.#items.getSize();
    if (!n) return offset;
    
    const totalH = n * STEP;
    const norm = ((offset % totalH) + totalH) % totalH;
    const snappedNorm = Math.round(norm / STEP) * STEP;
    return offset + (snappedNorm - norm);
  }

  #handleDrag(dy, dt) {
    this.#velocity = (-dy / dt) * this.#opt.itemHeight;
    this.#offset  -= dy;
    this.#draw();
  }

  // ── Constructeur ───────────────────────────────────────────────────────────
  constructor(container, items, options, draw) {
    this.#container = container;
    this.#items     = items;
    this.#drawFn    = draw;
    this.#opt = {
      itemHeight: 14,
      gap:        0,
      wheelStep:  40,
      friction:   0.92,
      ...options
    };

    this.#canvas = document.createElement('canvas');
    this.#ctx    = this.#canvas.getContext('2d');

    container.style = {
      ...container.style,
      position:    'relative',
      overflow:    'hidden',
      cursor:      'grab',
      userSelect:  'none',
      touchAction: 'none',
    };
    this.#canvas.style = {
      ...this.#canvas.style,
      position: 'absolute',
      top:      '0',
      left:     '0',
    };
    container.appendChild(this.#canvas);

    this.#bindEvents();
    this.#ro = new ResizeObserver(() => this.#resize());
    this.#ro.observe(container);
    this.#resize();
  }

  // ── API publique ───────────────────────────────────────────────────────────

  setItems(items) {
    const newN = items.getSize();
    const oldN = this.#lastSize;
    if (newN === 0 || oldN === 0) {
      this.#offset = 0;
    } else if (oldN !== newN) {
      const STEP = this.#opt.itemHeight + this.#opt.gap;

      const oldTotalH = oldN * STEP;

      // Position visuelle de l'item 0 : k-ième ligne (0 = tout en haut)
      const norm = ((this.#offset % oldTotalH) + oldTotalH) % oldTotalH;
      const k    = (oldN - Math.round(norm / STEP)) % oldN;

      // Clamp : si la nouvelle liste a moins d'éléments que k, on prend le max possible
      const newK = Math.min(k, newN - 1);

      // Reconstruire l'offset : item 0 en k-ième position
      const newTotalH  = newN * STEP;
      this.#offset = ((newN - newK) * STEP) % newTotalH;
    }
    this.#items    = items;
    this.#lastSize = newN;
    this.#velocity = 0;
    this.#stopInertia();
    this.#draw();
  }

  setOptions(opts) {
    this.#opt = {
      ...this.#opt,
      ...opts
    };
    this.#draw();
  }

  /**
   * Amène l'élément `index` à la position `anchor` dans la vue.
   * @param {number} index
   * @param {'top'|'middle'|'bottom'} [anchor='middle']
   */
  scrollTo(index, anchor = 'middle') {
    const { itemHeight, gap } = this.#opt;
    const STEP = itemHeight + gap;
    const n    = this.#items.getSize();
    if (!n) return;

    const i = ((index % n) + n) % n;
    let offset = i * STEP;

    if (anchor === 'middle') {
      offset -= (this.#H - itemHeight) / 2;
    } else if (anchor === 'bottom') {
      offset -= this.#H - itemHeight;
    }
    // anchor === 'top' : offset inchangé

    this.#offset   = offset;
    this.#velocity = 0;
    this.#stopInertia();
    this.#draw();
  }

  redraw() {
    this.#draw();
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────

  #resize() {
    const dpr  = globalThis.devicePixelRatio ?? 1;
    this.#W    = this.#container.clientWidth;
    this.#H    = this.#container.clientHeight;
    this.#ctx.resetTransform();
    this.#canvas.width        = this.#W * dpr;
    this.#canvas.height       = this.#H * dpr;
    this.#canvas.style.width  = `${this.#W}px`;
    this.#canvas.style.height = `${this.#H}px`;
    this.#ctx.scale(dpr, dpr);
    this.#draw();
  }

  #draw() {
    const ctx = this.#ctx;
    const W   = this.#W;
    const H   = this.#H;
    ctx.clearRect(0, 0, W, H);

    const n = this.#items.getSize();
    if (!n) return;

    const { itemHeight, gap } = this.#opt;
    const STEP   = itemHeight + gap;
    const totalH = n * STEP;
    const snappedOffset = this.#snapOffsetToGrid(this.#offset);
    const norm   = ((snappedOffset % totalH) + totalH) % totalH;
    const firstI = Math.floor(norm / STEP);
    const firstY = -(norm % STEP);
    const count  = Math.min(Math.ceil((H - firstY) / STEP), n);

    for (let k = 0; k < count; k++) {
      const idx = (firstI + k) % n;
      const y   = firstY + k * STEP;
      if (y >= H) break;
      this.#drawFn(ctx, this.#items.get(idx), idx, 0, y, W, itemHeight);
    }
  }

  // ── Inertie ────────────────────────────────────────────────────────────────

  #stopInertia() {
    cancelAnimationFrame(this.#raf);
    this.#raf = null;
  }

  #startInertia() {
    this.#stopInertia();
    const tick = () => {
      if (Math.abs(this.#velocity) < 0.15) { this.#velocity = 0; return; }
      this.#offset   += this.#velocity;
      this.#velocity *= this.#opt.friction;
      this.#draw();
      this.#raf = requestAnimationFrame(tick);
    };
    this.#raf = requestAnimationFrame(tick);
  }

  // ── Événements ─────────────────────────────────────────────────────────────

  #bindEvents() {
    const el = this.#container;

    this.#onWheel = e => {
      e.preventDefault();
      let raw = e.deltaY;
      if (e.deltaMode === 1) raw *= 20;           // lignes → px
      else if (e.deltaMode === 2) raw *= this.#H; // pages  → px
      const step = Math.sign(raw) * Math.min(Math.abs(raw), this.#opt.wheelStep);
      this.#stopInertia();
      this.#offset   += step;
      this.#velocity  = step * 0.12;
      this.#draw();
      this.#startInertia();
    };

    this.#onMouseDown = e => {
      this.#dragging = true;
      this.#lastY    = e.clientY;
      this.#lastT    = performance.now();
      this.#velocity = 0;
      this.#stopInertia();
      el.style.cursor = 'grabbing';
    };

    this.#onMouseMove = e => {
      if (!this.#dragging) return;
      const now = performance.now();
      const dy  = e.clientY - this.#lastY;
      const dt  = now - this.#lastT;
      
      this.#lastY = e.clientY;
      this.#lastT = now;
      this.#handleDrag(dy, dt);
    };

    this.#onMouseUp = () => {
      if (!this.#dragging) return;
      this.#dragging = false;
      el.style.cursor = 'grab';
      
      // Détecte l'immobilité : si le dernier mouvement est trop ancien
      const timeSinceLastMove = performance.now() - this.#lastT;
      if (timeSinceLastMove > 100) {
        this.#velocity = 0;
      }
      
      this.#startInertia();
    };

    this.#onTouchStart = e => {
      this.#lastY    = e.touches[0].clientY;
      this.#lastT    = performance.now();
      this.#velocity = 0;
      this.#stopInertia();
    };

    this.#onTouchMove = e => {
      e.preventDefault();
      const now = performance.now();
      const dy  = e.touches[0].clientY - this.#lastY;
      const dt  = now - this.#lastT;
      
      this.#lastY = e.touches[0].clientY;
      this.#lastT = now;
      this.#handleDrag(dy, dt);
    };

    this.#onTouchEnd = () => {
      // Détecte l'immobilité : si le dernier mouvement est trop ancien
      const timeSinceLastMove = performance.now() - this.#lastT;
      if (timeSinceLastMove > 100) {
        this.#velocity = 0;
      }
      
      this.#startInertia();
    };

    el.addEventListener('wheel',      this.#onWheel,      { passive: false });
    el.addEventListener('mousedown',  this.#onMouseDown);
    el.addEventListener('touchstart', this.#onTouchStart, { passive: true });
    el.addEventListener('touchmove',  this.#onTouchMove,  { passive: false });
    el.addEventListener('touchend',   this.#onTouchEnd);
    globalThis.addEventListener('mousemove', this.#onMouseMove);
    globalThis.addEventListener('mouseup',   this.#onMouseUp);
  }
}

// =============================================================================
// ListAdapter — wrappe un tableau JS en objet { get(i), getSize() }
//
// Usage :
//   const items = new ListAdapter([1, 2, 3, 'hello', ...]);
//   items.get(0)      // → 1
//   items.getSize()   // → 4
// =============================================================================

export class ListAdapter {
  #arr;

  constructor(arr) {
    this.#arr = arr;
  }

  get(i)    { return this.#arr[i]; }
  getSize() { return this.#arr.length; }
}