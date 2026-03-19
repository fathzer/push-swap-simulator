export const ReverseMove = Object.freeze({
    'sa': 'sa', 'sb': 'sb', 'ss': 'ss',
    'pa': 'pb', 'pb': 'pa',
    'ra': 'rra', 'rb': 'rrb', 'rr': 'rrr',
    'rra': 'ra', 'rrb': 'rb', 'rrr': 'rr'
});

export const Move = Object.freeze({
    SA: 'sa', SB: 'sb', SS: 'ss',
    PA: 'pa', PB: 'pb',
    RA: 'ra', RB: 'rb', RR: 'rr',
    RRA: 'rra', RRB: 'rrb', RRR: 'rrr',
});

export class Stack {
    #data;

    constructor(input = []) {
        if (input instanceof Stack) {
            // Constructeur par copie
            this.#data = [...input.#data];
        } else {
            // Constructeur normal avec tableau de nombres
            // Entrée : [1, 2, 3] (1 est le top)
            // Interne : [3, 2, 1] (1 est à l'index length-1)
            this.#data = [...input].reverse();
        }
    }

    /**
     * Ajoute une valeur au sommet de la pile (O(1)).
     */
    push(value) {
        this.#data.push(value);
    }

    /**
     * Retire et renvoie la valeur au sommet de la pile (O(1)).
     * Renvoie undefined si la pile est vide.
     */
    pop() {
        return this.#data.pop();
    }

    /**
     * Renvoie la valeur au sommet de la pile sans la retirer (O(1)).
     * Renvoie undefined si la pile est vide.
     */
    top() {
        return this.#data.at(-1);
    }

    /**
     * Renvoie la valeur à l'index spécifié.
     * Index 0 correspond au sommet de la pile.
     * Renvoie undefined si l'index est hors limites.
     */
    get(index) {
        if (index < 0 || index >= this.#data.length) {
            return undefined;
        }
        return this.#data[this.#data.length - 1 - index];
    }

    /**
     * Décale tous les éléments vers le haut d'une position.
     * Le premier élément devient le dernier (ra / rb).
     */
    rotate() {
        if (this.#data.length > 1) {
            // Le top (fin du tableau) est retiré et inséré au fond (début du tableau)
            this.#data.unshift(this.#data.pop());
        }
    }

    /**
     * Décale tous les éléments vers le bas d'une position.
     * Le dernier élément devient le premier (rra / rrb).
     */
    reverseRotate() {
        if (this.#data.length > 1) {
            // Le fond (début du tableau) est retiré et inséré au top (fin du tableau)
            this.#data.push(this.#data.shift());
        }
    }

    /**
     * Échange les deux premiers éléments de la pile (sa / sb).
     */
    swap() {
        if (this.#data.length > 1) {
            const top = this.#data.length - 1;
            [this.#data[top], this.#data[top - 1]] = [this.#data[top - 1], this.#data[top]];
        }
    }

    /**
     * Itérateur du haut vers le bas.
     */
    *iterator() {
        for (let i = this.#data.length - 1; i >= 0; i--) {
            yield this.#data[i];
        }
    }

    /**
     * Renvoie un tableau avec les éléments dans l'ordre du haut vers le bas.
     * @returns {Array} Tableau des éléments de la pile du haut vers le bas.
     */
    toArray() {
        return [...this.#data].reverse();
    }

    equals(otherStack) {
        if (!(otherStack instanceof Stack)) return false;
        const otherData = otherStack.#data; 
        if (this.#data.length !== otherData.length) return false;
        return this.#data.every((val, index) => val === otherData[index]);
    }

    getSize() {
        return this.#data.length;
    }

    isStrictlySorted() {
        return this.#data.every((val, i) => i === 0 || val < this.#data[i-1]);
    }

    toJSON() {
        return `[${this.toArray().join(', ')}]`;
    }
}

export class TwoStacks {
    #a;
    #b;
    
    static #moveActions = {
        [Move.SA]: (stacks) => stacks.getStackA().swap(),
        [Move.SB]: (stacks) => stacks.getStackB().swap(),
        [Move.SS]: (stacks) => { stacks.getStackA().swap(); stacks.getStackB().swap(); },
        [Move.PA]: (stacks) => stacks.#push(stacks.getStackB(), stacks.getStackA()),
        [Move.PB]: (stacks) => stacks.#push(stacks.getStackA(), stacks.getStackB()),
        [Move.RA]: (stacks) => stacks.getStackA().rotate(),
        [Move.RB]: (stacks) => stacks.getStackB().rotate(),
        [Move.RR]: (stacks) => { stacks.getStackA().rotate(); stacks.getStackB().rotate(); },
        [Move.RRA]: (stacks) => stacks.getStackA().reverseRotate(),
        [Move.RRB]: (stacks) => stacks.getStackB().reverseRotate(),
        [Move.RRR]: (stacks) => { stacks.getStackA().reverseRotate(); stacks.getStackB().reverseRotate(); }
    };

	constructor(inputA = [], inputB = []) {
        this.#a = (inputA instanceof Stack) ? inputA : new Stack(inputA);
        this.#b = (inputB instanceof Stack) ? inputB : new Stack(inputB);
    }

    getStackA() {
        // On "re-reverse" pour le constructeur de Stack qui attend le Top en premier
        return this.#a;
    }

    getStackB() {
        return this.#b;
    }

    applyMove(move) {
        TwoStacks.#moveActions[move](this);
    }

    #push(from, to) {
        if (from.getSize() > 0) to.push(from.pop());
    }

    isEmpty() {
        return this.#a.getSize() === 0 && this.#b.getSize() === 0;
    }

    isSorted() {
        return this.#b.getSize() === 0 && this.#a.isStrictlySorted();
    }

    equals(otherStacks) {
        if (!(otherStacks instanceof TwoStacks)) return false;
        return this.#a.equals(otherStacks.#a) && this.#b.equals(otherStacks.#b);
    }

    toJSON() {
        return {
            a: this.#a.toJSON(),
            B: this.#b.toJSON()
        };
    }
}
