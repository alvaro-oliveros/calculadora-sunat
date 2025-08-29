import { TaxBrackets } from '../../src/domain/models/TaxBrackets';
import { UIT } from '../../src/domain/models/UIT';
import { TaxBracket } from '../../src/domain/models/types';

describe('TaxBrackets', () => {
  let uit: UIT;
  let defaultBrackets: TaxBracket[];

  beforeEach(() => {
    uit = UIT.create2025();
    defaultBrackets = [
      { hasta_uit: 5, tasa: 0.08 },
      { hasta_uit: 20, tasa: 0.14 },
      { hasta_uit: 35, tasa: 0.17 },
      { hasta_uit: 45, tasa: 0.20 },
      { hasta_uit: null, tasa: 0.30 }
    ];
  });

  describe('validation', () => {
    it('should create valid tax brackets', () => {
      expect(() => new TaxBrackets(defaultBrackets, uit)).not.toThrow();
    });

    it('should throw error for empty brackets', () => {
      expect(() => new TaxBrackets([], uit)).toThrow('Tax brackets cannot be empty');
    });

    it('should throw error if last bracket has hasta_uit', () => {
      const invalidBrackets = [
        { hasta_uit: 5, tasa: 0.08 },
        { hasta_uit: 20, tasa: 0.14 }
      ];
      expect(() => new TaxBrackets(invalidBrackets, uit)).toThrow('Last bracket must have null hasta_uit');
    });
  });

  describe('calculateTax', () => {
    let taxBrackets: TaxBrackets;

    beforeEach(() => {
      taxBrackets = new TaxBrackets(defaultBrackets, uit);
    });

    it('should return 0 for zero income', () => {
      expect(taxBrackets.calculateTax(0)).toBe(0);
    });

    it('should return 0 for negative income', () => {
      expect(taxBrackets.calculateTax(-1000)).toBe(0);
    });

    it('should calculate tax correctly for first bracket (5 UIT)', () => {
      const income = 5 * 5350; // 26750
      const expectedTax = income * 0.08;
      expect(taxBrackets.calculateTax(income)).toBe(expectedTax);
    });

    it('should calculate tax correctly spanning multiple brackets', () => {
      const income = 15 * 5350; // 80250 (spans first two brackets)
      const firstBracketTax = 5 * 5350 * 0.08; // 10700
      const secondBracketTax = 10 * 5350 * 0.14; // 7490
      const expectedTax = firstBracketTax + secondBracketTax;
      expect(taxBrackets.calculateTax(income)).toBe(expectedTax);
    });

    it('should calculate tax for high income (top bracket)', () => {
      const income = 50 * 5350; // 267500
      const firstBracket = 5 * 5350 * 0.08;
      const secondBracket = 15 * 5350 * 0.14;
      const thirdBracket = 15 * 5350 * 0.17;
      const fourthBracket = 10 * 5350 * 0.20;
      const fifthBracket = 5 * 5350 * 0.30;
      const expectedTax = firstBracket + secondBracket + thirdBracket + fourthBracket + fifthBracket;
      expect(taxBrackets.calculateTax(income)).toBeCloseTo(expectedTax, 2);
    });
  });

  describe('createDefault2025', () => {
    it('should create default 2025 tax brackets', () => {
      const taxBrackets = TaxBrackets.createDefault2025(uit);
      expect(taxBrackets.calculateTax(5350 * 3)).toBeCloseTo(5350 * 3 * 0.08, 2);
    });
  });
});