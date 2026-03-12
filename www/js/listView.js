import { Feedback } from './feedback.js';
import { Move } from './stack.js';

export class ListView {
    #id;
    #container;
    #listContainer;
    #elementCountSpan;
    #list = [];
    #currentIndex = -1;
    #onItemMouseEnter;
    #onItemClicked;
    #visibleRange = { start: 0, end: 0 }; // Cache de la plage visible
    #selection = { start: -1, end: -1, type: null }; // Mémorisation de la sélection
    #editMode = 'truncate';

    /**
     * @param {HTMLElement} container - L'élément où injecter la liste
     * @param {string} title - Le titre de la liste
     * @param {Object} options - Callbacks pour les interactions
     */
    constructor(container, id, title, options = {}) {
        this.#id = id;
        this.#onItemMouseEnter = options.onItemMouseEnter || null;
        this.#onItemClicked = options.onItemClicked || null;
        
        container.innerHTML = `
            <div style="font-weight: bold; font-size: 11px; color: #888; display:flex; justify-content:space-between; align-items:center;">
                <span>${title}</span> <span class="element-count"> - </span>
                <div class="toolbar-moves">
                    <button class="icon-btn btn-copy" title="Copy">📄</button>
                    <button class="icon-btn btn-paste" title="Paste">📋</button>
                    <button class="icon-btn btn-clear" title="Clear">🗑️</button>
                </div>
            </div>
            <div class="moves-display"></div>
            <div class="edit-mode-container" style="margin-top: 3px">
                    <button class="btn-action btn-mode-edit active" data-mode="truncate">TRUNC</button>
                    <button class="btn-action btn-mode-edit" data-mode="insert">INS</button>
                    <button class="btn-action btn-mode-edit" data-mode="overwrite">OVER</button>
            </div>
        `;
        this.#container = container;
        this.#listContainer = container.querySelector('.moves-display');
        this.#elementCountSpan = container.querySelector('.element-count');
        
        // Initialiser le cache de la plage visible
        this.#updateVisibleRange();
        
        // Observer les changements de taille pour invalider le cache
        if (globalThis.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => {
                this.#updateVisibleRange();
            });
            resizeObserver.observe(this.#listContainer);
        }

        container.querySelector('.btn-copy').onclick = () => this.#copyMoves();
        container.querySelector('.btn-paste').onclick = () => this.#pasteMoves();
        container.querySelector('.btn-clear').onclick = () => this.#clearMoves();
        container.querySelector('.moves-display').oninput = () => { this.#syncMoves(); this.#saveList(); };
        container.querySelectorAll('.btn-mode-edit').forEach(btn => {
            btn.onclick = () => {
                this.#editMode = btn.dataset.mode;
                this.#saveEditMode(); 
                // Only update button active states, don't rebuild the whole list
                this.#container.querySelectorAll('.btn-mode-edit').forEach(b => {
                    b.classList.toggle('active', b.dataset.mode === this.#editMode);
                });
            };
        });

        
        // Observer les scroll pour mettre à jour la plage visible
        this.#listContainer.addEventListener('scroll', () => {
            this.#updateVisibleRange();
        }, { passive: true });

        this.#loadLocal();
    }

    /**
     * Met à jour la liste complète et l'index actuel
     */
    update(list, currentIndex, redraw = true, save = true) {
        if (currentIndex < -1 || currentIndex >= list.length) {
            throw new Error("Invalid index");
        }
        const listChanged = !this.#arraysEqual(this.#list, list);
        const indexChanged = this.#currentIndex !== currentIndex;
        
        if (!listChanged && !indexChanged) return;

        const oldIndex = this.#currentIndex;
        this.#currentIndex = currentIndex;
        
        if (listChanged) {
            this.#list = list;
            if (save) {
                this.#saveList();
            }
            if (redraw) {
                this.#render();
            }
        } else if (indexChanged && redraw) {
            // Seul l'index a changé, on met juste à jour les classes
            this.#updateClassesOnly(oldIndex);
        }
    }

    #saveEditMode() {
        localStorage.setItem(`ps_edit_mode_${this.#id}`, this.#editMode); 
    }

    #saveList() {
        localStorage.setItem(`ps_moves_${this.#id}`, JSON.stringify(this.#list)); 
    }

    #loadLocal() {
        const savedMoves = localStorage.getItem(`ps_moves_${this.#id}`);
        const savedIdx = localStorage.getItem(`ps_idx_${this.#id}`);
        const savedMode = localStorage.getItem(`ps_edit_mode_${this.#id}`);
        let idx = savedIdx ? Number.parseInt(savedIdx) : -1;
        this.#editMode = savedMode || 'truncate';
        if (savedMoves) {
            const moves = JSON.parse(savedMoves);
            // Prevent crashing if saved state is inconsistent (possibly by a previous release)
            if (idx < -1) {
                idx = -1;
            } else if (idx >= moves.length) {
                idx = moves.length - 1;
            }
            this.update(moves, idx, false, false);
        }
        this.#render();
    }
    #copyMoves() { navigator.clipboard.writeText(this.#list.join(' ')); }
    #pasteMoves() { 
        const pasteBtn = this.#container.querySelector('.btn-paste');
        navigator.clipboard.readText().then(text => {
            try {
                this.#syncMoves(text);
            } catch (error) {
                Feedback.animateButton(pasteBtn, error.message, 1500, 'bottom');
            }
        }).catch(err => {
            Feedback.animateButton(pasteBtn, 'Clipboard error!', 1500, 'bottom');
        });
    }
    #clearMoves() { 
        this.update([], -1);
    }

    #syncMoves(text=null) {
        if (text === null) {
            text = this.#listContainer.querySelector('.moves-display').innerText;
        }
        let moves = text.trim().replaceAll(',', ' ').split(/\s+/).filter(x => x !== "").map(x => x.toLowerCase());

        for (let move of moves) {
            if (!Object.values(Move).includes(move)) {
                throw new Error('Invalid move: ' + move);
            }
        }

        if (this.#currentIndex >= moves.length) this.#currentIndex = moves.length-1;
        this.update(moves, this.#currentIndex);
    }

    /**
     * Rendu complet de la liste (Méthode gourmande à optimiser plus tard)
     */
    #render() {
        this.#elementCountSpan.textContent = this.#list.length==0 ? "-" : "("+this.#list.length+" el)"
        this.#listContainer.innerHTML = '';
        
        this.#list.forEach((item, i) => {
            const span = document.createElement('span');
            this.#style(span, i);
            span.innerText = item + (i < this.#list.length - 1 ? ' ' : '');

            span.onclick = () => {
                this.setIndex(i);
                if (this.#onItemClicked) {
                    this.#onItemClicked(i);
                }
            };

            if (this.#onItemMouseEnter) {
                span.onmouseenter = () => this.#onItemMouseEnter(item, i, span);
            }

            this.#listContainer.appendChild(span);
        });
        this.#container.querySelectorAll('.btn-mode-edit').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.#editMode);
        });

        // Invalider le cache de plage visible après reconstruction DOM
        this.#visibleRange = { start: -1, end: -1 };
        
        // Déferer le scroll pour laisser le temps au DOM de se mettre à jour
        requestAnimationFrame(() => this.#scrollToSelected());
    }

    /** Scroll automatique vers l'élément actif */
    #scrollToSelected(currentElement = null) {
        // Optimisation: utiliser le cache de plage visible pour éviter les calculs
        const targetIndex = this.#currentIndex;
        
        // Si le cache est invalide, le mettre à jour immédiatement
        if (this.#visibleRange.start === -1) {
            this.#updateVisibleRange();
        }
        
        // Si l'index cible est dans la plage visible, pas besoin de scroller
        if (targetIndex >= this.#visibleRange.start && targetIndex <= this.#visibleRange.end) {
            return;
        }
        
        const current = currentElement || this.#listContainer.children[targetIndex];
        if (!current) return;

        // Sinon, scroller et mettre à jour le cache
        current.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        this.#updateVisibleRange();
    }

    /**
     * Met à jour le cache de la plage d'éléments visibles
     */
    #updateVisibleRange() {
        const spans = this.#listContainer.children;
        if (spans.length === 0) {
            this.#visibleRange = { start: 0, end: 0 };
            return;
        }

        const containerRect = this.#listContainer.getBoundingClientRect();
        const containerTop = containerRect.top;
        const containerBottom = containerRect.bottom;

        let start = -1;
        let end = -1;

        for (let i = 0; i < spans.length; i++) {
            const span = spans[i];
            const spanRect = span.getBoundingClientRect();
            
            // Require full visibility: element must be completely within container bounds
            if (spanRect.top >= containerTop && spanRect.bottom <= containerBottom) {
                if (start === -1) start = i;
                end = i;
            }
        }

        this.#visibleRange = { start, end };
    }

    getIndex() { return this.#currentIndex; }

    setIndex(idx) {
        if (idx === this.#currentIndex) return;
        const oldIndex = this.#currentIndex;
        this.#currentIndex = idx;
        
        // Optimisation: mise à jour des classes seulement
        this.#updateClassesOnly(oldIndex);
    }

    getList() { return this.#list; }

    addMove(op) {
        this.#currentIndex++;
        if (this.#editMode === 'truncate') {
            this.#list = this.#list.slice(0, this.#currentIndex);
            this.#list.push(op);
        } else if (this.#editMode === 'insert') {
            // Insert at current index + 1
            this.#list.splice(this.#currentIndex, 0, op);
        } else if (this.#editMode === 'overwrite') {
            // Overwrite after current index
            if (this.#currentIndex < this.#list.length) {
                this.#list[this.#currentIndex] = op;
            } else {
                this.#list.push(op);
            }
        }
        this.#saveList();
        this.#render();
    }

    deleteMove() {
        if (this.#currentIndex < 0) return null;
        const deleted = this.#list.splice(this.#currentIndex, 1)[0];
        this.#currentIndex--;
        this.#saveList();
        this.#render();
        return deleted;
    }

    /**
     * Applique une sélection sur une plage d'éléments avec un type spécifique
     * @param {number} start - Index de début (inclus)
     * @param {number} end - Index de fin (exclus)
     * @param {string} type - Type de sélection: 'better', 'neutral', 'worse'
     */
    applySelection(start, end, type = 'neutral') {
        // Mémoriser la sélection
        this.#selection = { start, end, type };
        
        const spans = this.#listContainer.querySelectorAll('.move-item');
        
        // Retirer toutes les classes de sélection existantes
        spans.forEach(span => {
            span.classList.remove('move-diff-better', 'move-diff-worse', 'move-diff-neutral');
        });
        
        // Appliquer la nouvelle sélection
        for (let i = Math.max(0, start); i <= end; i++) {
            spans[i].classList.add(`move-diff-${type}`);
        }
    }

    /**
     * Efface toutes les sélections
     */
    clearSelection() {
        // Réinitialiser la sélection mémorisée
        this.#selection = { start: -1, end: -1, type: null };
        
        const spans = this.#listContainer.querySelectorAll('.move-item');
        spans.forEach(span => {
            span.classList.remove('move-diff-better', 'move-diff-worse', 'move-diff');
        });
    }

    /**
     * Compare deux tableaux pour savoir s'ils sont égaux
     */
    #arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }

    /**
     * Met à jour uniquement les classes CSS des éléments entre oldIndex et newIndex
     */
    #updateClassesOnly(oldIndex) {
		// Note: Could be optimized: we only have to remove or add move-past instead of rebuild the whole class
		// Nevertheless it would be more complex to make style customizable.
        const spans = this.#listContainer.querySelectorAll('.move-item');
        
        // Déterminer la plage d'éléments à mettre à jour
        const minIndex = Math.min(oldIndex, this.#currentIndex);
        const maxIndex = Math.max(oldIndex, this.#currentIndex);
        
        let selectedElement = null;

        for (let i = minIndex; i <= maxIndex; i++) {
            const span = spans[i];
            if (span) {
                this.#style(span, i);
                if (i === this.#currentIndex) {
                    selectedElement = span;
                }
            }
        }
        this.#scrollToSelected(selectedElement);
    }

    #style(span, i) {
        // Note: On pourrait passer une fonction de style en option pour détacher la logique métiers
        span.className = "move-item";
        if (i <= this.#currentIndex) {
            span.classList.add('move-past');
        }
        
        // Appliquer la sélection mémorisée si applicable
        if (this.#selection.type && i >= this.#selection.start && i <= this.#selection.end) {
            span.classList.add(`move-diff-${this.#selection.type}`);
        }
    }
}