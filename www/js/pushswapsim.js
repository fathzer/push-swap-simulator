import { TwoStacks, Move, ReverseMove } from './stack.js';
import { TwoStacksView } from './twostacksview.js';
import { ListView } from './listView.js';
import { AnimationRunner, TimeBasedConductor } from './animationRunner.js';

export class PushSwapSim {
    static #VALID_MOVES = new Set(Object.values(Move));
    
    #id;
    #container;
    #onStateChange;
    #numbers = [];
    #speedInput;
    #stacksView;
    #movesView;
    #animationRunner;

    constructor(containerId, id, title = "Sim", onStateChange = null) {
        this.#id = id;
        this.#onStateChange = onStateChange;

        this.#container = document.createElement('div');
        this.#container.className = 'ps-component';
        this.#container.innerHTML = `
            <div class="ps-sidebar">
                <div class="moves-display-anchor"></div>
                <div class="controls-grid">
                    ${[Move.SA, Move.SB, Move.SS, Move.PA, Move.PB, '', Move.RA, Move.RB, Move.RR, Move.RRA, Move.RRB, Move.RRR].map(op => 
                        op ? `<button class="btn-action" data-op="${op}" ${op.startsWith('p')?'style="background:#1b5e20"':''}>${op}</button>` : `<span></span>`
                    ).join('')}
                </div>
                <button class="btn-action btn-delete btn-stop-style" disabled>DELETE CURRENT ⌫</button>
                <div style="display: flex; gap: 3px;">
                    <button class="btn-action btn-prev btn-play-style" style="flex:1"></button>
                    <button class="btn-action btn-next btn-play-style" style="flex:1"></button>
                    <button class="btn-action btn-play btn-play-style" style="flex:1"></button>
                    <button class="btn-action btn-stop btn-stop-style" style="flex:1" disabled></button>
                </div>
                <input type="range" class="speed-range" min="1" max="1000" value="100" dir="ltr">
            </div>
            <div class="ps-visualizer-anchor"></div>
        `;
        document.getElementById(containerId).appendChild(this.#container);

        const anchor = this.#container.querySelector('.ps-visualizer-anchor');
        this.#stacksView = new TwoStacksView(anchor);

        const movesView = this.#container.querySelector('.moves-display-anchor');
        this.#movesView = new ListView(movesView, id, title,{
            onItemClicked: (index) => {
                this.#rebuildStacks();
                this.#render();
            },
            onItemMouseEnter: (move, i, el) => {
                if (this.isPlaying()) return;
                let title = "Move " + i;
                if (move === 'pa' || move === 'pb') {
                    const val = this.#getSnapshotValue(i);
                    title += ` - Pushed value: ${val}`;
                }
                el.title = title;
            },
            onListBulkChanged: () => {
                if (this.#movesView) {
                    this.#rebuildStacks();
                    this.#render();
                    this.#stateChanged();
                }
            }
        });
        this.#speedInput = this.#container.querySelector('.speed-range');
        
        this.#animationRunner = new AnimationRunner(
            {
                getIndex: () => this.#movesView.getIndex(),
                setIndex: (index) => this.setIndex(index),
                getSize: () => this.getMoveListSize()
            },
            () => {
                this.#render();
                this.#stateChanged();
            }
        );

        this.#initEvents();

        // Initialize stacks if no initial state was set
        if (this.#numbers.length === 0) {
            this.#numbers = [];
        }

        const savedSpeed = localStorage.getItem(`ps_speed_${this.#id}`);
        if (savedSpeed) {
            this.#speedInput.value = savedSpeed;
        }
    }

    #initEvents() {
        this.#container.querySelectorAll('.controls-grid button').forEach(btn => {
            btn.onclick = () => this.#addMove(btn.dataset.op);
        });
        this.#container.querySelector('.btn-next').onclick = () => this.step(1);
        this.#container.querySelector('.btn-prev').onclick = () => this.step(-1);
        this.#container.querySelector('.btn-play').onclick = () => this.#runAuto();
        this.#container.querySelector('.btn-stop').onclick = () => this.stopFastForward();
        this.#container.querySelector('.btn-delete').onclick = () => this.#deleteMove();
        
        this.#speedInput.addEventListener('input', (e) => {
            localStorage.setItem(`ps_speed_${this.#id}`, e.target.value);
        });
    }

    getIndex() { return this.#movesView.getIndex(); }

    setIndex(idx) {
        let futureIndex = Math.max(-1, Math.min(idx, this.#movesView.getList().length));
        const oldIndex = this.#movesView.getIndex();
        if (futureIndex == oldIndex) return;
        this.#movesView.setIndex(futureIndex);
        
        // Use optimized applyMove for adjacent steps
        if (Math.abs(oldIndex - futureIndex) === 1) {
            // Use incremental moves for adjacent steps
            this.#applyIncrementalMoves(oldIndex);
        } else {
            // For non-adjacent changes, rebuild stacks completely
            this.#rebuildStacks();
        }
        this.#render();
    }

    #applyIncrementalMoves(oldIndex) {
        const newIndex = this.#movesView.getIndex();
        if (newIndex < oldIndex) {
            for (let i = oldIndex; i > newIndex; i--) {
                this.#stacksView.applyMove(ReverseMove[this.getMoveAt(i)]);
            }
        } else {
            for (let i = oldIndex + 1; i <= newIndex; i++) {
                this.#stacksView.applyMove(this.getMoveAt(i));
            }
        }
    }

    getMovesList() { return [...this.#movesView.getList()]; }

    getMoveListSize() { return this.#movesView.getList().length; }

    getMoveAt(index) { return this.#movesView.getList()[index]; }

    setMovesList(newList) {
        if (!Array.isArray(newList)) throw new TypeError(`Expected Array, got: ${typeof newList}`);
        const invalidOp = newList.find(op => !PushSwapSim.#VALID_MOVES.has(op.toLowerCase()));        
        if (invalidOp) throw new Error(`Invalid move: "${invalidOp}"`);

        let newIndex = this.#movesView.getIndex();
        if (newIndex >= newList.length) {
            newIndex = -1;
        }
        this.#movesView.update([...newList], newIndex);

        // Rebuild stacks in TwoStacksView
        this.#rebuildStacks();
        this.#render();
    }
    
    getStacks(copy=true) {
        const stacks = this.#stacksView.getStacks();
        return copy ? new TwoStacks(stacks.getStackA().toArray(), stacks.getStackB().toArray()) : stacks;
    }

    #getSnapshotValue(index) {
        const nums = this.#numbers;
        let stacks = new TwoStacks(nums, []);
        let move = this.getMoveAt(index);
        if (move !== 'pa' && move !== 'pb') return null;
        for (let i = 0; i < index; i++) stacks.applyMove(this.getMoveAt(i));
        
        let stack = move === 'pa' ? stacks.getStackB() : stacks.getStackA();
        return stack.getSize() > 0 ? stack.top() : "empty";
    }

    getInitialState() { return [...this.#numbers]; }
    setInitialState(numbers) {
        if (!numbers || !Array.isArray(numbers)) throw new Error('Invalid initial state');
        this.#numbers = [...numbers];
        
        // Initialize TwoStacksView with the initial state
        const stacks = new TwoStacks(numbers, []);
        this.#stacksView.setStacks(stacks, true);
        
        // Reset to beginning and render sidebar
        this.#movesView.setIndex(-1);
        this.#render();
    }
    getCurrentState() {
        return new TwoStacks(this.#stacksView.getStacks().getStackA(), this.#stacksView.getStacks().getStackB());
    }

    #deleteMove() {
        const deleted = this.#movesView.deleteMove();
        if (deleted) {
            this.#stacksView.applyMove(ReverseMove[deleted]);
            this.#render();
        }
    }

    #addMove(op) {
        if(this.isPlaying()) return;
        this.#movesView.addMove(op);
        this.#stacksView.applyMove(op);
        this.#render();
    }

    step(dir) {
        let newIdx = this.#movesView.getIndex() + dir;
        if (newIdx >= -1 && newIdx < this.getMoveListSize()) {
            this.setIndex(newIdx);
            return true;
        }
        return false;
    }

    #rebuildStacks() {
        const stacks = new TwoStacks(this.#numbers, []);
        let end = this.#movesView.getIndex();
        if (end > this.getMoveListSize()) {
            end = this.getMoveListSize()-1;
        }
        for (let i = 0; i <= end; i++) {
            stacks.applyMove(this.getMoveAt(i));
        }
        this.#stacksView.setStacks(stacks);
    }

    #render() {
        // 1. STACKS ARE NOW MANAGED BY TwoStacksView - NO CREATION NEEDED HERE
        const stacks = this.#stacksView.getStacks();
        
        // 2. SIDEBAR Update
        const noMoves = this.getMoveListSize() === 0;
        const noStacks = stacks.isEmpty();
        const isAtEnd = this.#movesView.getIndex() === this.getMoveListSize()-1;
        const isAtStart = this.#movesView.getIndex() < 0;
        const blockAll = this.isPlaying() || noStacks;

        this.#container.querySelector('.btn-play').disabled = blockAll || noMoves || isAtEnd;
        this.#container.querySelector('.btn-next').disabled = blockAll || noMoves || isAtEnd;
        this.#container.querySelector('.btn-prev').disabled = blockAll || noMoves || isAtStart;
        this.#container.querySelector('.btn-stop').disabled = !this.isPlaying();

        this.#container.querySelectorAll('.controls-grid button').forEach(btn => {
            const op = btn.dataset.op;
            if (!op) return;
            let isDisabled = blockAll;
            if (!isDisabled) {
                let aSize = stacks.getStackA().getSize();
                let bSize = stacks.getStackB().getSize();
                if ([Move.SA, Move.RA, Move.RRA].includes(op)) isDisabled = aSize < 2;
                else if ([Move.SB, Move.RB, Move.RRB].includes(op)) isDisabled = bSize < 2;
                else if (op === Move.PA) isDisabled = bSize === 0;
                else if (op === Move.PB) isDisabled = aSize === 0;
                else if ([Move.SS, Move.RR, Move.RRR].includes(op)) isDisabled = (aSize < 2 && bSize < 2);
            }
            btn.disabled = isDisabled;
        });

        this.#container.querySelector('.btn-delete').disabled = blockAll || isAtStart;
        this.#container.querySelectorAll('.btn-mode-edit').forEach(btn => btn.disabled = blockAll);

        this.#stateChanged();
    }

    #stateChanged() {
        if (this.#onStateChange) this.#onStateChange();
    }

    setMovesSelection(start, end, className) {
        this.#movesView.clearSelection();
        if (start <= end) this.#movesView.applySelection(start, end, className);
    }

    #sliderToMovesPerSecond(sliderValue) {
        if (sliderValue <= 1) return 1;
        if (sliderValue >= 1000) return 1000;
        
        // Logarithmic mapping: 1->1, 333->10, 666->100, 1000->1000
        // Using log base 10 for the moves per second scale
        const normalizedPos = (sliderValue - 1) / 999; // 0 to 1
        const logMin = Math.log10(1);
        const logMax = Math.log10(1000);
        const logValue = logMin + normalizedPos * (logMax - logMin);
        return Math.pow(10, logValue);
    }

    #runAuto() {
        this.fastForward(() => this.getFastForwardSpeed());
    }

    fastForward(rateProvider) {
        this.#animationRunner.run(new TimeBasedConductor(rateProvider));
		this.#render();
    }
    
    stopFastForward() {
        this.#animationRunner.stop();
    }
    
    isPlaying() { return this.#animationRunner.isRunning() }
    
    getFastForwardSpeed() { return this.#sliderToMovesPerSecond(Number.parseInt(this.#speedInput.value)) }
}