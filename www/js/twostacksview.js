import { CircularList } from './circularList.js';
import { StackDrawer } from './stackDrawer.js';
import { Stack } from './stack.js';
import { Dialog } from './dialog.js';

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
        
        // Add right-click event listener
        this.#container.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.#showNumberSuiteDialog();
        });
    }

    /**
     * Remplace les stacks actuelles et déclenche le rendu.
     */
    setStacks(stacks, reinit=false) {
        this.#stacks = stacks;
        if (reinit) {
            this.#drawer.setHighlightNumbers([]);
        }
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

    #showNumberSuiteDialog() {
        const currentNumbers = this.#drawer.getHighlightNumbers();
        const initialValue = currentNumbers.length > 0 ? currentNumbers.join(' ') : '';

        const dialog = new Dialog({
            title: 'Enter numbers to highlight',
            description: 'Please enter numbers (≥0) separated by spaces or commas:',
            placeholder: 'e.g., 1 2 3 4 or 1,2,3,4',
            initialValue: initialValue,
            validate: (text) => {
                const parts = text.split(/[\s,]+/).filter(part => part.trim() !== '');
                
                for (const part of parts) {
                    const num = Number.parseInt(part, 10);
                    if (Number.isNaN(num) || num < 0) {
                        return { valid: false, error: `Invalid number: ${part}. Numbers must be ≥ 0.` };
                    }
                }
                
                return { valid: true };
            },
            parse: (text) => {
                const parts = text.split(/[\s,]+/).filter(part => part.trim() !== '');
                const numbers = [];
                
                for (const part of parts) {
                    const num = Number.parseInt(part, 10);
                    numbers.push(num);
                }
                
                return numbers;
            },
            onConfirm: (numbers) => {
                this.#drawer.setHighlightNumbers(numbers);
                this.#viewA.redraw();
                this.#viewB.redraw();
            }
        });

        dialog.show(this.#container);
    }
}