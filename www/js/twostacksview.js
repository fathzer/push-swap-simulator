import { CircularList } from './circularList.js';
import { StackDrawer } from './stackDrawer.js';
import { Stack } from './stack.js';

export class TwoStacksView {
    #container;
    #viewA;
    #viewB;
    #drawer
    #stacks;
    #renderScheduled = false;
    
    constructor(parentContainer) {
        this.#container = parentContainer;
        this.#container.classList.add('ps-visualizer');
        this.#container.innerHTML = `
            <div class="stack-container"><strong>A</strong><div class="stack stack-a"></div></div>
            <div class="stack-container"><strong>B</strong><div class="stack stack-b"></div></div>
        `;

        this.#drawer = new StackDrawer(0);
        this.#viewA = new CircularList(this.#container.querySelector('.stack-a'), new Stack([]),{}, this.#drawer.draw);
        this.#viewB = new CircularList(this.#container.querySelector('.stack-b'), new Stack([]),{}, this.#drawer.draw);
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
        this.#scheduleRender();
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

        this.#drawer.setMaxValue(maxVal);
        this.#viewA.setItems(stackA);
        this.#viewB.setItems(stackB);

        // Feedback visuel du tri
        this.#container.classList.toggle('success-border', this.#stacks.isSorted());
    }
}