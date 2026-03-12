import { ConvergenceFinder } from './convergenceFinder.js';


describe('ConvergenceFinder', () => {

    const createMoveList = (moves) => ({
        getSize: () => moves.length,
        get: (index) => moves[index]
    });

    describe('findConvergence', () => {
        it('finds convergence for the given test case', () => {
            // Données initiales
            const numbers = [80, 82, 81, 84, 83];
            
            // Création des listes de mouvements avec l'interface attendue
            const moveListA = createMoveList(['pb', 'pb', 'pb', 'rra', 'pa', 'rrb', 'rrb', 'pa', 'sa', 'pa', 'sa']);
            const moveListB = createMoveList(['pb', 'pb', 'pb', 'rrr', 'rrb', 'pa', 'sb', 'pa', 'pa', 'sa']);
            
            // Test
            const finder = new ConvergenceFinder(numbers);

            let result = finder.findConvergence(moveListA, moveListB, 3, 3);
            // Vérification du résultat attendu {8, 7}
            expect(result).toEqual({ convA: 8, convB: 7 });

            result = finder.findConvergence(moveListA, moveListB, 5, 5);
            // Vérification du résultat attendu {8, 7}
            expect(result).toEqual({ convA: 8, convB: 7 });

            // return positions if stacks are equals at positions passed as parameters
            result = finder.findConvergence(moveListA, moveListB, 2, 2);
            expect(result).toEqual({ convA: 2, convB: 2 });

            result = finder.findConvergence(moveListA, moveListB, 8, 7);
            expect(result).toEqual({ convA: 8, convB: 7 });

            result = finder.findConvergence(moveListA, moveListB, 0, 0);
            expect(result).toEqual({ convA: 0, convB: 0 });
 
            result = finder.findConvergence(moveListA, moveListB, -1, 0);
            expect(result).toEqual({ convA: 0, convB: 0 });

            result = finder.findConvergence(moveListA, moveListB, 0, -1);
            expect(result).toEqual({ convA: 0, convB: 0 });
        });

        it('returns works with -1 as positions', () => {
            const numbers = [1, 2, 3];
            
            const moveListA = createMoveList([]);
            const moveListB = createMoveList([]);
            
            const finder = new ConvergenceFinder(numbers);
            
            const result = finder.findConvergence(moveListA, moveListB, -1, -1);
            
            expect(result).toEqual({ convA: -1, convB: -1 });
        });

        it('returns null when no convergence is found', () => {
            const numbers = [1, 2, 3];

            const moveListA = createMoveList(['sa', 'sb']);
            const moveListB = createMoveList(['ra', 'rb']);
            
            const finder = new ConvergenceFinder(numbers);
            const result = finder.findConvergence(moveListA, moveListB, 1, 1);
            
            expect(result).toBeNull();
        });

        it('errors when positions are invalid', () => {
            const numbers = [1, 2, 3];
            
            const moveListA = createMoveList([]);
            const moveListB = createMoveList([]);
            
            const finder = new ConvergenceFinder(numbers);
            
            // Should throw an error for negative positions
            expect(() => {
                finder.findConvergence(moveListA, moveListB, 0, 0);
            }).toThrow();
        });

        it('finds immediate convergence when states are already equal', () => {
            const numbers = [1, 2, 3];
            
            const moveListA = createMoveList(['pb', 'pa']);
            const moveListB = createMoveList(['pb', 'pa']);
            
            const finder = new ConvergenceFinder(numbers);
            const result = finder.findConvergence(moveListA, moveListB, 1, 1);
            
            expect(result).toEqual({ convA: 1, convB: 1 });
        });
    });
});
