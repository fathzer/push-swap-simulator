import { Stack, TwoStacks, Move, ReverseMove } from './stack.js';

// Helper to get stack contents as array (top first)
const toArray = (stack) => [...stack.iterator()];

describe('Stack', () => {

    describe('constructor', () => {
        it('creates an empty stack', () => {
            const s = new Stack();
            expect(s.getSize()).toBe(0);
        });

        it('creates a stack with top at index 0', () => {
            const s = new Stack([1, 2, 3]); // 1 is top
            expect(toArray(s)).toEqual([1, 2, 3]);
        });

        describe('copy constructor', () => {
            it('creates a copy of an existing stack', () => {
                const original = new Stack([1, 2, 3]);
                const copy = new Stack(original);
                expect(toArray(copy)).toEqual([1, 2, 3]);
                expect(copy.getSize()).toBe(3);
            });

            it('creates an independent copy (deep copy)', () => {
                const original = new Stack([1, 2, 3]);
                const copy = new Stack(original);
                
                // Modify the copy
                copy.push(4);
                copy.pop();
                
                // Original should remain unchanged
                expect(toArray(original)).toEqual([1, 2, 3]);
                expect(toArray(copy)).toEqual([1, 2, 3]);
            });

            it('creates a copy of an empty stack', () => {
                const original = new Stack();
                const copy = new Stack(original);
                expect(copy.getSize()).toBe(0);
                expect(toArray(copy)).toEqual([]);
            });

            it('creates a copy of a single element stack', () => {
                const original = new Stack([42]);
                const copy = new Stack(original);
                expect(toArray(copy)).toEqual([42]);
                expect(copy.getSize()).toBe(1);
            });

            it('copy and original are equal but not the same reference', () => {
                const original = new Stack([1, 2, 3]);
                const copy = new Stack(original);
                
                expect(copy.equals(original)).toBe(true);
                expect(copy).not.toBe(original);
            });
        });
    });

    describe('push / pop', () => {
        it('push adds to the top', () => {
            const s = new Stack([2, 3]);
            s.push(1);
            expect(toArray(s)).toEqual([1, 2, 3]);
        });

        describe('pop', () => {
            it('pop removes from the top', () => {
                const s = new Stack([1, 2, 3]);
                expect(s.pop()).toBe(1);
                expect(toArray(s)).toEqual([2, 3]);
            });

            it('pop on empty stack returns undefined', () => {
                const s = new Stack();
                expect(s.pop()).toBeUndefined();
            });
        });
    });

    describe('top', () => {
        it('returns the top element without removing it', () => {
            const s = new Stack([1, 2, 3]);
            expect(s.top()).toBe(1);
            expect(toArray(s)).toEqual([1, 2, 3]); // Stack unchanged
        });

        it('returns undefined on empty stack', () => {
            const s = new Stack();
            expect(s.top()).toBeUndefined();
        });

        it('returns the same value after multiple calls', () => {
            const s = new Stack([42]);
            expect(s.top()).toBe(42);
            expect(s.top()).toBe(42);
            expect(s.top()).toBe(42);
            expect(toArray(s)).toEqual([42]); // Stack unchanged
        });
    });

    describe('get', () => {
        it('returns top element when index is 0', () => {
            const s = new Stack([1, 2, 3]);
            expect(s.get(0)).toBe(1);
        });

        it('returns second element when index is 1', () => {
            const s = new Stack([1, 2, 3]);
            expect(s.get(1)).toBe(2);
        });

        it('returns bottom element when index is last', () => {
            const s = new Stack([1, 2, 3]);
            expect(s.get(2)).toBe(3);
        });

        it('returns undefined for negative index', () => {
            const s = new Stack([1, 2, 3]);
            expect(s.get(-1)).toBeUndefined();
        });

        it('returns undefined for index out of bounds', () => {
            const s = new Stack([1, 2, 3]);
            expect(s.get(3)).toBeUndefined();
            expect(s.get(10)).toBeUndefined();
        });

        it('returns undefined on empty stack', () => {
            const s = new Stack();
            expect(s.get(0)).toBeUndefined();
            expect(s.get(5)).toBeUndefined();
        });

        it('works with single element stack', () => {
            const s = new Stack([42]);
            expect(s.get(0)).toBe(42);
            expect(s.get(1)).toBeUndefined();
        });

        it('does not modify the stack', () => {
            const s = new Stack([1, 2, 3]);
            s.get(0);
            s.get(1);
            s.get(2);
            expect(toArray(s)).toEqual([1, 2, 3]); // Stack unchanged
        });

        it('works with larger stacks', () => {
            const s = new Stack([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            expect(s.get(0)).toBe(1);
            expect(s.get(4)).toBe(5);
            expect(s.get(9)).toBe(10);
            expect(s.get(10)).toBeUndefined();
        });

        it('works after stack operations', () => {
            const s = new Stack([1, 2, 3]);
            s.push(0);
            expect(s.get(0)).toBe(0);
            expect(s.get(1)).toBe(1);
            expect(s.get(3)).toBe(3);
            
            s.pop();
            expect(s.get(0)).toBe(1);
            expect(s.get(2)).toBe(3);
        });
    });

    describe('swap', () => {
        it('swaps the two top elements', () => {
            const s = new Stack([1, 2, 3]);
            s.swap();
            expect(toArray(s)).toEqual([2, 1, 3]);
        });

        it('does nothing on a single element stack', () => {
            const s = new Stack([1]);
            s.swap();
            expect(toArray(s)).toEqual([1]);
        });
    });

    describe('rotate', () => {
        it('moves top element to bottom', () => {
            const s = new Stack([1, 2, 3]);
            s.rotate();
            expect(toArray(s)).toEqual([2, 3, 1]);
        });

        it('does nothing on a single element stack', () => {
            const s = new Stack([1]);
            s.rotate();
            expect(toArray(s)).toEqual([1]);
        });
    });

    describe('reverseRotate', () => {
        it('moves bottom element to top', () => {
            const s = new Stack([1, 2, 3]);
            s.reverseRotate();
            expect(toArray(s)).toEqual([3, 1, 2]);
        });

        it('does nothing on a single element stack', () => {
            const s = new Stack([1]);
            s.reverseRotate();
            expect(toArray(s)).toEqual([1]);
        });
    });

    describe('equals', () => {
        it('returns true for identical stacks', () => {
            const a = new Stack([1, 2, 3]);
            const b = new Stack([1, 2, 3]);
            expect(a.equals(b)).toBe(true);
        });

        it('returns false for different stacks', () => {
            const a = new Stack([1, 2, 3]);
            const b = new Stack([3, 2, 1]);
            expect(a.equals(b)).toBe(false);
        });

        it('returns false when comparing with a non-Stack', () => {
            const a = new Stack([1, 2, 3]);
            expect(a.equals([1, 2, 3])).toBe(false);
        });
    });

    describe('isStrictlySorted', () => {
        it('returns true for strictly sorted stack (ascending from top)', () => {
            const s = new Stack([1, 2, 3, 4, 5]);
            expect(s.isStrictlySorted()).toBe(true);
        });

        it('returns false for unsorted stack', () => {
            const s = new Stack([3, 1, 2]);
            expect(s.isStrictlySorted()).toBe(false);
        });

        it('returns false for stack with equal elements', () => {
            const s = new Stack([1, 2, 2, 3]);
            expect(s.isStrictlySorted()).toBe(false);
        });

        it('returns true for single element stack', () => {
            const s = new Stack([42]);
            expect(s.isStrictlySorted()).toBe(true);
        });

        it('returns true for empty stack', () => {
            const s = new Stack();
            expect(s.isStrictlySorted()).toBe(true);
        });
    });
});

describe('TwoStacks', () => {

    describe('applyMove / undoMove symmetry', () => {
        const moves = Object.values(Move);

        it.each(moves)('undo(%s) restores original state', (move) => {
            const before = new TwoStacks([3, 2, 1], [6, 5, 4]);
            const ts     = new TwoStacks([3, 2, 1], [6, 5, 4]);

            ts.applyMove(move);
            ts.applyMove(ReverseMove[move]);

            expect(ts.getStackA().equals(before.getStackA())).toBe(true);
            expect(ts.getStackB().equals(before.getStackB())).toBe(true);
        });
    });

    describe('PA / PB', () => {
        it('PB moves top of A to top of B', () => {
            const ts = new TwoStacks([1, 2, 3], []);
            ts.applyMove(Move.PB);
            expect(toArray(ts.getStackA())).toEqual([2, 3]);
            expect(toArray(ts.getStackB())).toEqual([1]);
        });

        it('PA moves top of B to top of A', () => {
            const ts = new TwoStacks([], [1, 2, 3]);
            ts.applyMove(Move.PA);
            expect(toArray(ts.getStackA())).toEqual([1]);
            expect(toArray(ts.getStackB())).toEqual([2, 3]);
        });
    });

    describe('RR / RRR', () => {
        it('RR rotates both stacks', () => {
            const ts = new TwoStacks([1, 2, 3], [4, 5, 6]);
            ts.applyMove(Move.RR);
            expect(toArray(ts.getStackA())).toEqual([2, 3, 1]);
            expect(toArray(ts.getStackB())).toEqual([5, 6, 4]);
        });

        it('RRR reverse-rotates both stacks', () => {
            const ts = new TwoStacks([1, 2, 3], [4, 5, 6]);
            ts.applyMove(Move.RRR);
            expect(toArray(ts.getStackA())).toEqual([3, 1, 2]);
            expect(toArray(ts.getStackB())).toEqual([6, 4, 5]);
        });
    });

    describe('isEmpty', () => {
        it('returns true when both stacks are empty', () => {
            const ts = new TwoStacks([], []);
            expect(ts.isEmpty()).toBe(true);
        });

        it('returns false when stack A has elements', () => {
            const ts = new TwoStacks([1, 2, 3], []);
            expect(ts.isEmpty()).toBe(false);
        });

        it('returns false when stack B has elements', () => {
            const ts = new TwoStacks([], [1, 2, 3]);
            expect(ts.isEmpty()).toBe(false);
        });

        it('returns false when both stacks have elements', () => {
            const ts = new TwoStacks([1, 2], [3, 4]);
            expect(ts.isEmpty()).toBe(false);
        });
    });

    describe('isSorted', () => {
        it('returns true when A is sorted and B is empty', () => {
            const ts = new TwoStacks([1, 2, 3, 4, 5], []);
            expect(ts.isSorted()).toBe(true);
        });

        it('returns false when A is not sorted', () => {
            const ts = new TwoStacks([3, 1, 2], []);
            expect(ts.isSorted()).toBe(false);
        });

        it('returns false when B is not empty', () => {
            const ts = new TwoStacks([1, 2, 3], [4]);
            expect(ts.isSorted()).toBe(false);
        });

        it('returns false when A is not sorted and B is not empty', () => {
            const ts = new TwoStacks([3, 2, 1], [4, 5]);
            expect(ts.isSorted()).toBe(false);
        });

        it('returns true when both stacks are empty', () => {
            const ts = new TwoStacks([], []);
            expect(ts.isSorted()).toBe(true);
        });
    });

    describe('equals', () => {
        it('returns true for identical TwoStacks', () => {
            const a = new TwoStacks([1, 2, 3], [4, 5]);
            const b = new TwoStacks([1, 2, 3], [4, 5]);
            expect(a.equals(b)).toBe(true);
        });

        it('returns false for different TwoStacks', () => {
            const a = new TwoStacks([1, 2, 3], [4, 5]);
            const b = new TwoStacks([3, 2, 1], [4, 5]);
            expect(a.equals(b)).toBe(false);
        });

        it('returns false when comparing with a non-TwoStacks', () => {
            const a = new TwoStacks([1, 2, 3], [4, 5]);
            expect(a.equals({ a: [1, 2, 3], b: [4, 5] })).toBe(false);
        });

        it('returns false when stack A differs', () => {
            const a = new TwoStacks([1, 2, 3], [4, 5]);
            const b = new TwoStacks([1, 2, 4], [4, 5]);
            expect(a.equals(b)).toBe(false);
        });

        it('returns false when stack B differs', () => {
            const a = new TwoStacks([1, 2, 3], [4, 5]);
            const b = new TwoStacks([1, 2, 3], [4, 6]);
            expect(a.equals(b)).toBe(false);
        });
    });
});