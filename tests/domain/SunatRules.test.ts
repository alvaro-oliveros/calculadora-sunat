import { SunatRules } from '../../src/domain/services/SunatRules';
import { UIT } from '../../src/domain/models/UIT';
import { TaxBrackets } from '../../src/domain/models/TaxBrackets';
import { CalculationInput } from '../../src/domain/models/types';

describe('SunatRules', () => {
  let uit: UIT;
  let taxBrackets: TaxBrackets;
  let baseInput: CalculationInput;

  beforeEach(() => {
    uit = UIT.create2025();
    taxBrackets = TaxBrackets.createDefault2025(uit);
    baseInput = {
      mes_calculo: 8,
      mes_inicio: 3,
      salario_mensual: 4200,
      gratificaciones_previstas: [
        { mes: 7, monto: 2100 },
        { mes: 12, monto: 2100 }
      ],
      pagos_extraordinarios_mes: [],
      retenciones_previas_acumuladas: 0,
      uit: 5350,
      tasas: [
        { hasta_uit: 5, tasa: 0.08 },
        { hasta_uit: 20, tasa: 0.14 },
        { hasta_uit: 35, tasa: 0.17 },
        { hasta_uit: 45, tasa: 0.20 },
        { hasta_uit: null, tasa: 0.30 }
      ]
    };
  });

  describe('STEP 1 - Income Projection', () => {
    it('should project annual income correctly', () => {
      const projected = SunatRules.step1_ProjectIncome(baseInput);
      // Remaining months: Aug-Dec = 5 months = 4200 * 5 = 21000
      // Past income: Mar-Jul = 5 months = 4200 * 5 = 21000  
      // Gratifications: July (2100) + December (2100) = 4200
      // Total: 21000 + 21000 + 4200 = 46200
      expect(projected).toBe(46200);
    });

    it('should handle mid-year entry correctly', () => {
      const midYearInput = { ...baseInput, mes_inicio: 6, mes_calculo: 8 };
      const projected = SunatRules.step1_ProjectIncome(midYearInput);
      // Remaining: Aug-Dec = 5 months = 21000
      // Past: Jun-Jul = 2 months = 8400
      // Gratifications: July (2100) + December (2100) = 4200  
      // Total: 21000 + 8400 + 4200 = 33600
      expect(projected).toBe(33600);
    });
  });

  describe('STEP 2 - Deduction', () => {
    it('should apply 7 UIT deduction correctly', () => {
      const income = 50000;
      const taxable = SunatRules.step2_ApplyDeduction(income, uit);
      expect(taxable).toBe(50000 - (7 * 5350));
    });

    it('should return 0 if income is less than or equal to 7 UIT', () => {
      const income = 7 * 5350;
      const taxable = SunatRules.step2_ApplyDeduction(income, uit);
      expect(taxable).toBe(0);
    });

    it('should return 0 for negative result', () => {
      const income = 20000; // Less than 7 UIT
      const taxable = SunatRules.step2_ApplyDeduction(income, uit);
      expect(taxable).toBe(0);
    });
  });

  describe('STEP 4 - Monthly Divisors', () => {
    it('should return correct divisors for each month', () => {
      expect(SunatRules.step4_GetMonthlyDivisor(1)).toBe(12);
      expect(SunatRules.step4_GetMonthlyDivisor(2)).toBe(12);
      expect(SunatRules.step4_GetMonthlyDivisor(3)).toBe(12);
      expect(SunatRules.step4_GetMonthlyDivisor(4)).toBe(9);
      expect(SunatRules.step4_GetMonthlyDivisor(5)).toBe(8);
      expect(SunatRules.step4_GetMonthlyDivisor(6)).toBe(8);
      expect(SunatRules.step4_GetMonthlyDivisor(7)).toBe(8);
      expect(SunatRules.step4_GetMonthlyDivisor(8)).toBe(5);
      expect(SunatRules.step4_GetMonthlyDivisor(9)).toBe(4);
      expect(SunatRules.step4_GetMonthlyDivisor(10)).toBe(4);
      expect(SunatRules.step4_GetMonthlyDivisor(11)).toBe(4);
      expect(SunatRules.step4_GetMonthlyDivisor(12)).toBe(1);
    });

    it('should throw error for invalid month', () => {
      expect(() => SunatRules.step4_GetMonthlyDivisor(0)).toThrow();
      expect(() => SunatRules.step4_GetMonthlyDivisor(13)).toThrow();
    });
  });

  describe('STEP 4 - Monthly Withholding Calculation', () => {
    it('should calculate monthly withholding with divisor', () => {
      const annualTax = 1000;
      const month = 4; // April, divisor = 9
      const previousWithholdings = 0;
      
      const monthly = SunatRules.step4_CalculateMonthlyWithholding(annualTax, month, previousWithholdings);
      expect(monthly).toBeCloseTo(1000 / 9, 2);
    });

    it('should handle December regularization', () => {
      const annualTax = 1000;
      const month = 12;
      const previousWithholdings = 800;
      
      const monthly = SunatRules.step4_CalculateMonthlyWithholding(annualTax, month, previousWithholdings);
      expect(monthly).toBe(200); // 1000 - 800
    });

    it('should return 0 if previous withholdings exceed annual tax', () => {
      const annualTax = 1000;
      const month = 8;
      const previousWithholdings = 1200;
      
      const monthly = SunatRules.step4_CalculateMonthlyWithholding(annualTax, month, previousWithholdings);
      expect(monthly).toBe(0);
    });
  });

  describe('STEP 5 - Additional Withholding', () => {
    it('should calculate additional withholding for extraordinary payments', () => {
      const extraordinaryPayments = 1500;
      const annualTax = 3000;
      const projectedIncome = 60000;
      
      const additional = SunatRules.step5_CalculateAdditionalWithholding(
        extraordinaryPayments, annualTax, projectedIncome
      );
      
      const expected = (1500 / 60000) * 3000; // 75
      expect(additional).toBeCloseTo(expected, 2);
    });

    it('should return 0 for no extraordinary payments', () => {
      const additional = SunatRules.step5_CalculateAdditionalWithholding(0, 3000, 60000);
      expect(additional).toBe(0);
    });

    it('should return 0 for zero projected income', () => {
      const additional = SunatRules.step5_CalculateAdditionalWithholding(1500, 3000, 0);
      expect(additional).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle case where RBA - 7 UIT ≤ 0 (no withholding)', () => {
      const lowIncomeInput = {
        ...baseInput,
        salario_mensual: 1000,
        gratificaciones_previstas: []
      };
      
      const result = SunatRules.calculateMonthlyWithholding(lowIncomeInput);
      expect(result.total_retencion_mes).toBe(0);
    });

    it('should handle case with mid-year entry and bonuses', () => {
      const midYearInput = {
        ...baseInput,
        mes_inicio: 5,
        mes_calculo: 8,
        salario_mensual: 4200,
        gratificaciones_previstas: [{ mes: 7, monto: 2100 }, { mes: 12, monto: 2100 }]
      };
      
      const result = SunatRules.calculateMonthlyWithholding(midYearInput);
      expect(result.total_retencion_mes).toBeGreaterThan(0);
      expect(result.divisor_reglamentario).toBe(5);
    });

    it('should handle extraordinary payments triggering additional withholding', () => {
      const extraPaymentInput = {
        ...baseInput,
        pagos_extraordinarios_mes: [{ concepto: 'utilidades', monto: 1500 }]
      };
      
      const result = SunatRules.calculateMonthlyWithholding(extraPaymentInput);
      expect(result.retencion_adicional_mes).toBeGreaterThan(0);
      expect(result.total_retencion_mes).toBe(result.retencion_del_mes + result.retencion_adicional_mes);
    });
  });
});