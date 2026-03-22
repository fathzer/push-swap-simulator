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
        
        // Add right-click event listener
        this.#container.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.#showNumberSuiteDialog();
        });
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

    #showNumberSuiteDialog() {
        // Create dialog container
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 1000;
            min-width: 300px;
        `;

        dialog.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">Enter numbers to search for</h3>
            <p style="margin-bottom: 15px; color: #666;">Please enter numbers (≥0) separated by spaces or commas:</p>
            <input type="text" id="numberInput" style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px;" placeholder="e.g., 1 2 3 4 or 1,2,3,4">
            <div style="text-align: right;">
                <button id="cancelBtn" style="margin-right: 10px; padding: 8px 16px; border: 1px solid #ccc; background: #f5f5f5; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button id="okBtn" style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">OK</button>
            </div>
        `;

        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 999;
        `;

        // Ensure the container has relative positioning for absolute children
        if (getComputedStyle(this.#container).position === 'static') {
            this.#container.style.position = 'relative';
        }

        this.#container.appendChild(backdrop);
        this.#container.appendChild(dialog);

        const input = dialog.querySelector('#numberInput');
        const okBtn = dialog.querySelector('#okBtn');
        const cancelBtn = dialog.querySelector('#cancelBtn');

        const closeDialog = () => {
            backdrop.remove();
            dialog.remove();
        };

        const validateAndParse = (text) => {
            // Split by spaces or commas and filter out empty strings
            const parts = text.split(/[\s,]+/).filter(part => part.trim() !== '');
            const numbers = [];
            
            for (const part of parts) {
                const num = Number.parseInt(part, 10);
                if (Number.isNaN(num) || num < 0) {
                    return { valid: false, error: `Invalid number: ${part}. Numbers must be ≥ 0.` };
                }
                numbers.push(num);
            }
            
            return { valid: true, numbers };
        };

        okBtn.addEventListener('click', () => {
            const text = input.value.trim();
            const result = validateAndParse(text);
            if (result.valid) {
                this.#drawer.highlightNumbers(result.numbers);
                this.#viewA.redraw();
                this.#viewB.redraw();
                closeDialog();
            } else {
                alert(result.error);
            }
        });

        cancelBtn.addEventListener('click', closeDialog);
        backdrop.addEventListener('click', closeDialog);

        // Focus on input and allow Enter key
        input.focus();
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                okBtn.click();
            }
        });
    }
}