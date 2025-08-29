import { TaxBracket } from './types';
import { UIT } from './UIT';

export class TaxBrackets {
  constructor(private brackets: TaxBracket[], private uit: UIT) {
    this.validateBrackets();
  }

  private validateBrackets(): void {
    if (this.brackets.length === 0) {
      throw new Error('Tax brackets cannot be empty');
    }

    for (let i = 0; i < this.brackets.length - 1; i++) {
      const current = this.brackets[i];
      const next = this.brackets[i + 1];
      
      if (current.hasta_uit === null) {
        throw new Error('Only the last bracket can have null hasta_uit');
      }
      
      if (next.hasta_uit !== null && current.hasta_uit >= next.hasta_uit) {
        throw new Error('Tax brackets must be in ascending order');
      }
    }

    if (this.brackets[this.brackets.length - 1].hasta_uit !== null) {
      throw new Error('Last bracket must have null hasta_uit for unlimited range');
    }
  }

  calculateTax(taxableIncome: number): number {
    if (taxableIncome <= 0) return 0;

    const taxableUIT = taxableIncome / this.uit.getValue();
    let tax = 0;
    let previousThreshold = 0;

    for (const bracket of this.brackets) {
      const currentThreshold = bracket.hasta_uit || Infinity;
      
      if (taxableUIT > previousThreshold) {
        const taxableInThisBracket = Math.min(taxableUIT - previousThreshold, currentThreshold - previousThreshold);
        const taxInThisBracket = taxableInThisBracket * this.uit.getValue() * bracket.tasa;
        tax += taxInThisBracket;
      }

      if (taxableUIT <= currentThreshold) break;
      previousThreshold = currentThreshold;
    }

    return Math.round(tax * 100) / 100;
  }

  static createDefault2025(uit: UIT): TaxBrackets {
    const brackets: TaxBracket[] = [
      { hasta_uit: 5, tasa: 0.08 },
      { hasta_uit: 20, tasa: 0.14 },
      { hasta_uit: 35, tasa: 0.17 },
      { hasta_uit: 45, tasa: 0.20 },
      { hasta_uit: null, tasa: 0.30 }
    ];
    return new TaxBrackets(brackets, uit);
  }

  static createCustom(brackets: TaxBracket[], uit: UIT): TaxBrackets {
    return new TaxBrackets(brackets, uit);
  }
}