export class TimeBasedConductor {
    #getMovesPerSecond;
    #lastTime;
    #lastTargetIndex;

    constructor(getMovesPerSecond) {
        this.#getMovesPerSecond = getMovesPerSecond;
    }

    start(target) {
        this.#lastTime = performance.now();
        this.#lastTargetIndex = target.getIndex();
    }

    getTargetIndex(target) {
        const movesPerSecond = this.#getMovesPerSecond();
        const now = performance.now();
        const deltaTime = now - this.#lastTime;
        const deltaIndex = Math.floor(deltaTime * movesPerSecond / 1000);
        if (deltaIndex > 0) {
            this.#lastTargetIndex = this.#lastTargetIndex + deltaIndex;
            this.#lastTime = now;
            return Math.min(this.#lastTargetIndex, target.getSize() - 1);
        } else {
            return null;
        }
    }
}

export class AnimationRunner {
    #target;
    #onAnimationEnd;
    #isRunning = false;
    #animateFrame;

    constructor(target, onAnimationEnd) {
        this.#target = target;
        this.#onAnimationEnd = onAnimationEnd;
    }

    run(conductor) {
        if (this.#isRunning) return;
        
        this.#isRunning = true;
        conductor.start(this.#target);
        
        const animate = (currentTime) => {
            if (!this.#isRunning || this.#target.getIndex() >= this.#target.getSize() - 1) {
                this.stop();
                return;
            }
            
            const targetIndex = conductor.getTargetIndex(this.#target);
            if (targetIndex !== null) {
                if ('requestIdleCallback' in globalThis) {
                    requestIdleCallback(() => {
                        if (this.#isRunning) {
                            this.#target.setIndex(targetIndex);
                        }
                    });
                } else {
                    this.#target.setIndex(targetIndex);
                }
            }
            
            this.#animateFrame = requestAnimationFrame(animate);
        };
        
        this.#animateFrame = requestAnimationFrame(animate);
    }

    stop() {
        this.#isRunning = false;
        if (this.#animateFrame) {
            cancelAnimationFrame(this.#animateFrame);
            this.#animateFrame = null;
        }
        if (this.#onAnimationEnd) {
            if (this.#onAnimationEnd) {
                this.#onAnimationEnd();
            }
        }
    }

    isRunning() {
        return this.#isRunning;
    }
}
