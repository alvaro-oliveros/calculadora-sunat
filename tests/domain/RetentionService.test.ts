import { RetentionService } from '../../src/domain/services/RetentionService';
import { CalculationInput } from '../../src/domain/models/types';

describe('RetentionService', () => {
  let baseInput: CalculationInput;

  beforeEach(() => {
    baseInput = {
      mes_calculo: 8,
      mes_inicio: 3,
      salario_mensual: 4200,
      gratificaciones_previstas: [
        { mes: 7, monto: 2100 },
        { mes: 12, monto: 2100 }
      ],
      pagos_extraordinarios_mes: [{ concepto: 'utilidades', monto: 1500 }],
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

  describe('calculateSingleMonth', () => {
    it('should calculate single month withholding correctly', () => {
      const result = RetentionService.calculateSingleMonth(baseInput);
      
      expect(result.mes).toBe(8);
      expect(result.impuesto_anual_proyectado).toBeGreaterThan(0);
      expect(result.divisor_reglamentario).toBe(5);
      expect(result.retencion_del_mes).toBeGreaterThan(0);
      expect(result.retencion_adicional_mes).toBeGreaterThan(0);
      expect(result.total_retencion_mes).toBe(result.retencion_del_mes + result.retencion_adicional_mes);
    });
  });

  describe('calculateFullYear', () => {
    it('should calculate full year withholdings from calculation month to December', () => {
      const result = RetentionService.calculateFullYear(baseInput);
      
      expect(result.monthly_results).toHaveLength(5); // Aug to Dec
      expect(result.monthly_results[0].mes).toBe(8);
      expect(result.monthly_results[4].mes).toBe(12);
      
      expect(result.summary.total_annual_income).toBeGreaterThan(0);
      expect(result.summary.deductible_amount).toBe(7 * 5350);
      expect(result.summary.taxable_income).toBeGreaterThan(0);
      expect(result.summary.annual_tax).toBeGreaterThan(0);
    });

    it('should accumulate withholdings correctly across months', () => {
      const result = RetentionService.calculateFullYear(baseInput);
      
      let expectedAccumulated = baseInput.retenciones_previas_acumuladas;
      for (let i = 0; i < result.monthly_results.length; i++) {
        const monthResult = result.monthly_results[i];
        expect(monthResult.retenciones_previas).toBe(expectedAccumulated);
        expectedAccumulated += monthResult.total_retencion_mes;
      }
    });

    it('should handle December regularization correctly', () => {
      const decemberInput = { ...baseInput, mes_calculo: 12 };
      const result = RetentionService.calculateFullYear(decemberInput);
      
      expect(result.monthly_results).toHaveLength(1);
      expect(result.monthly_results[0].divisor_reglamentario).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero income scenario', () => {
      const zeroIncomeInput = {
        ...baseInput,
        salario_mensual: 0,
        gratificaciones_previstas: []
      };
      
      const result = RetentionService.calculateSingleMonth(zeroIncomeInput);
      expect(result.total_retencion_mes).toBe(0);
    });

    it('should handle high previous withholdings', () => {
      const highWithholdingsInput = {
        ...baseInput,
        retenciones_previas_acumuladas: 10000
      };
      
      const result = RetentionService.calculateSingleMonth(highWithholdingsInput);
      expect(result.retencion_del_mes).toBeGreaterThanOrEqual(0);
    });

    it('should validate UIT and tax bracket changes', () => {
      const customInput = {
        ...baseInput,
        uit: 6000,
        tasas: [
          { hasta_uit: 5, tasa: 0.10 },
          { hasta_uit: null, tasa: 0.25 }
        ]
      };
      
      const result = RetentionService.calculateSingleMonth(customInput);
      expect(result.impuesto_anual_proyectado).toBeGreaterThan(0);
    });
  });
});