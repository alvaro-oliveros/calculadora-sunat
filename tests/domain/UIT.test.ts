import { UIT } from '../../src/domain/models/UIT';

describe('UIT', () => {
  describe('constructor', () => {
    it('should create UIT with positive value', () => {
      const uit = new UIT(5350);
      expect(uit.getValue()).toBe(5350);
    });

    it('should throw error for zero value', () => {
      expect(() => new UIT(0)).toThrow('UIT value must be positive');
    });

    it('should throw error for negative value', () => {
      expect(() => new UIT(-100)).toThrow('UIT value must be positive');
    });
  });

  describe('multiply', () => {
    it('should multiply UIT value correctly', () => {
      const uit = new UIT(5350);
      expect(uit.multiply(7)).toBe(37450);
      expect(uit.multiply(0.5)).toBe(2675);
    });
  });

  describe('static methods', () => {
    it('should create 2025 UIT with correct value', () => {
      const uit = UIT.create2025();
      expect(uit.getValue()).toBe(5350);
    });

    it('should create custom UIT', () => {
      const uit = UIT.createCustom(6000);
      expect(uit.getValue()).toBe(6000);
    });
  });
});