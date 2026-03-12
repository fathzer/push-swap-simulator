import { Stack, TwoStacks } from './stack.js';

class HashedStack extends Stack {
    #hash = 0;
    static #P = 31;
    
    static #powers = (() => {
        const p = new Int32Array(1001);
        p[0] = 1;
        for (let i = 1; i <= 1000; i++) {
            p[i] = Math.imul(p[i - 1], HashedStack.#P);
        }
        return p;
    })();

    constructor(input = []) {
        super(input);
        this.#recomputeFullHash();
    }

    /**
     * Force la conversion en entier 32 bits signé (débordement cyclique).
     * Requis pour la stabilité de l'algorithme de hachage.
     */
    #asInt32(val) {
        return val | 0;
    }

    #recomputeFullHash() {
        let h = 0;
        let i = 0;
        const elements = this.toArray().reverse(); 
        for (const val of elements) {
            h = this.#asInt32(h + Math.imul(val, HashedStack.#powers[i]));
            i++;
        }
        this.#hash = h;
    }

    hashCode() { return this.#hash; }

    push(val) {
        const p = HashedStack.#powers[this.getSize()];
        this.#hash = this.#asInt32(this.#hash + Math.imul(val, p));
        super.push(val);
    }

    pop() {
        const val = super.pop();
        if (val !== undefined) {
            const p = HashedStack.#powers[this.getSize()];
            this.#hash = this.#asInt32(this.#hash - Math.imul(val, p));
        }
        return val;
    }

    rotate() {
        if (this.getSize() < 2) return;
        const topValue = this.top();
        const pTop = HashedStack.#powers[this.getSize() - 1];

        let h = this.#asInt32(this.#hash - Math.imul(topValue, pTop));
        h = Math.imul(h, HashedStack.#P);
        this.#hash = this.#asInt32(h + topValue);

        super.rotate();
    }

    reverseRotate() {
        if (this.getSize() < 2) return;
        super.reverseRotate();
        this.#recomputeFullHash();
    }

    swap() {
        if (this.getSize() < 2) return;
        const n = this.getSize();
        const data = this.toArray();
        const vTop = data[0];
        const vSub = data[1];

        const pSub = HashedStack.#powers[n - 2];
        const pTop = HashedStack.#powers[n - 1];

        let h = this.#asInt32(this.#hash - Math.imul(vSub, pSub));
        h = this.#asInt32(h - Math.imul(vTop, pTop));
        h = this.#asInt32(h + Math.imul(vTop, pSub));
        h = this.#asInt32(h + Math.imul(vSub, pTop));
        
        this.#hash = h;
        super.swap();
    }
}

export class ConvergenceFinder {
    #numbers;
    
    constructor(numbers) {
        this.#numbers = numbers;
    }

    #getStateAt(moveList, offset) {
        let state = new TwoStacks(new HashedStack(this.#numbers), new HashedStack([]));
        for (let i = 0; i <= offset; i++) {
            state.applyMove(moveList.get(i));
        }
        return state;
    }

    findConvergence(moveListA, moveListB, offA, offB) {
        const sizeA = moveListA.getSize() - offA;
        const sizeB = moveListB.getSize() - offB;

        // On décide quel côté sera indexé (celui qui a le moins de mouvements)
        if (sizeA < sizeB) {
            // On indexe A, on parcourt B
            return this.#executeSearch(moveListA, offA, moveListB, offB, true);
        } else {
            // On indexe B, on parcourt A (comportement original)
            return this.#executeSearch(moveListB, offB, moveListA, offA, false);
        }
    }

    #executeSearch(listToMap, offMap, listToScan, offScan, isReversed) {
        const table = this.#buildIndex(listToMap, offMap);

        // 2. Parcourir la liste la plus longue
        let stateScan = this.#getStateAt(listToScan, offScan);
        for (let i = offScan; i < listToScan.getSize(); i++) {
            if (i > offScan) stateScan.applyMove(listToScan.get(i));

            const h = this.#getHashCode(stateScan);
            if (table.has(h)) {
                const convergence = this.#checkRealEquality(table.get(h), stateScan, listToMap, i, isReversed);
                if (convergence) return convergence;
            }
        }
        return null;
    }

    #buildIndex(listToMap, offMap) {
        const table = new Map();
        let stateMap = this.#getStateAt(listToMap, offMap);
        for (let j = offMap; j < listToMap.getSize(); j++) {
            if (j > offMap) stateMap.applyMove(listToMap.get(j));
            const h = this.#getHashCode(stateMap);
            if (!table.has(h)) table.set(h, []);
            table.get(h).push(j);
        }
        return table;
    }

    #checkRealEquality(candidateIndices, stateScan, listToMap, scanIndex, isReversed) {
        for (const j of candidateIndices) {
            const realStateMap = this.#getStateAt(listToMap, j);
            if (stateScan.equals(realStateMap)) {
                return isReversed 
                    ? { convA: j, convB: scanIndex } 
                    : { convA: scanIndex, convB: j };
            }
        }
        return null;
    }
	
	#getHashCode(stacks) {
	    return (Math.imul(stacks.getStackA().hashCode(), 31) + stacks.getStackB().hashCode()) | 0;
	}
}
