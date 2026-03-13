export class TwoStacksView {
    #container;
    #viewA;
    #viewB;
    #stacks;
    #renderScheduled = false;
    
    static #moveActions = {
        'sa': (view) => view.#swapTopElements(view.#viewA),
        'sb': (view) => view.#swapTopElements(view.#viewB),
        'ss': (view) => { view.#swapTopElements(view.#viewA); view.#swapTopElements(view.#viewB); },
        'pa': (view) => view.#pushElement(view.#viewB, view.#viewA),
        'pb': (view) => view.#pushElement(view.#viewA, view.#viewB),
        'ra': (view) => view.#rotateStack(view.#viewA),
        'rb': (view) => view.#rotateStack(view.#viewB),
        'rr': (view) => { view.#rotateStack(view.#viewA); view.#rotateStack(view.#viewB); },
        'rra': (view) => view.#reverseRotateStack(view.#viewA),
        'rrb': (view) => view.#reverseRotateStack(view.#viewB),
        'rrr': (view) => { view.#reverseRotateStack(view.#viewA); view.#reverseRotateStack(view.#viewB); }
    };

    constructor(parentContainer) {
        this.#container = parentContainer;
        this.#container.classList.add('ps-visualizer');
        this.#container.innerHTML = `
            <div class="stack-container"><strong>A</strong><div class="stack stack-a"></div></div>
            <div class="stack-container"><strong>B</strong><div class="stack stack-b"></div></div>
        `;

        this.#viewA = this.#container.querySelector('.stack-a');
        this.#viewB = this.#container.querySelector('.stack-b');
    }

    /**
     * Remplace les stacks actuelles et déclenche le rendu.
     */
    setStacks(stacks) {
        this.#stacks = stacks;
        this.#scheduleRender();
    }

    getStacks() {
        return this.#stacks;
    }

    /**
     * Applique un mouvement directement sur les stacks et met à jour la vue.
     */
    applyMove(move) {
        // Apply the move to the data model first
        this.#stacks.applyMove(move);
        
        // Apply DOM manipulation for the move
        this.#applyDOMMove(move);
    }

    #applyDOMMove(move) {
        TwoStacksView.#moveActions[move](this);

        // Update visual feedback
        this.#container.classList.toggle('success-border', this.#stacks.isSorted());
    }

    #swapTopElements(viewElement) {
        const elements = viewElement.children;
        if (elements.length < 2) return;
        
        // Swap the first two elements using modern DOM methods
        const first = elements[0];
        const second = elements[1];
        
        // Insert second before first, then first before second
        second.before(first);
        first.before(second);
    }

    #pushElement(fromView, toView) {
        const fromElements = fromView.children;
        if (fromElements.length === 0) return;
        
        // Move the top element from source to destination
        const topElement = fromElements[0];
        
        // Move the element from source to destination
        topElement.remove();
        toView.insertBefore(topElement, toView.firstChild);
    }

    #rotateStack(viewElement) {
        const elements = viewElement.children;
        if (elements.length < 2) return;
        
        // Move the first element (top) to the end (bottom)
        const topElement = elements[0];
        topElement.remove();
        viewElement.appendChild(topElement);
    }

    #reverseRotateStack(viewElement) {
        const elements = viewElement.children;
        if (elements.length < 2) return;
        
        // Move the last element (bottom) to the beginning (top)
        const bottomElement = elements[elements.length - 1];
        bottomElement.remove();
        viewElement.insertBefore(bottomElement, viewElement.firstChild);
    }

    #scheduleRender() {
        if (this.#renderScheduled) return;

        this.#renderScheduled = true;

        requestAnimationFrame(() => {
            this.#renderScheduled = false;
            this.#render();
        });
    }

    #render() {
        if (!this.#stacks) return;

        // On récupère les valeurs pour calculer les ratios de largeur
        const stackA = this.#stacks.getStackA();
        const stackB = this.#stacks.getStackB();
        
        // Calcul du max pour les barres (on pourrait l'optimiser en le passant en paramètre)
        let maxVal = 1;
        const allValues = [...stackA.iterator(), ...stackB.iterator()];
        if (allValues.length > 0) {
            maxVal = Math.max(...allValues.map(Math.abs));
        }

        this.#drawStack(stackA, this.#viewA, maxVal);
        this.#drawStack(stackB, this.#viewB, maxVal);

        // Feedback visuel du tri
        this.#container.classList.toggle('success-border', this.#stacks.isSorted());
    }

    #drawStack(stack, element, maxVal) {
        element.innerHTML = '';
        for (const val of stack.iterator()) {
            const el = document.createElement('div');
            el.className = 'element';
            const width = maxVal !== 0 ? (Math.abs(val) / maxVal) * 100 : 0;
            el.textContent = val;
            el.style.setProperty('--width', `${width}%`);
            el.style.setProperty('--hue', 200 + (width * 1.2));
            element.appendChild(el);
        }
    }
}