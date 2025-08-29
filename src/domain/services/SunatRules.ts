import { CalculationInput, MonthlyResult } from '../models/types';
import { UIT } from '../models/UIT';
import { TaxBrackets } from '../models/TaxBrackets';
import { ProjectionService } from './ProjectionService';

export class SunatRules {
  private static readonly DEDUCTION_UIT = 7;

  private static readonly MONTHLY_DIVISORS: Record<number, number> = {
    1: 12, 2: 12, 3: 12,
    4: 9,
    5: 8, 6: 8, 7: 8,
    8: 5,
    9: 4, 10: 4, 11: 4,
    12: 1
  };

  static step1_ProjectIncome(input: CalculationInput): number {
    return ProjectionService.projectAnnualIncome(input);
  }

  static step2_ApplyDeduction(projectedIncome: number, uit: UIT): number {
    const deduction = uit.multiply(this.DEDUCTION_UIT);
    const taxableIncome = projectedIncome - deduction;
    return Math.max(0, taxableIncome);
  }

  static step3_CalculateAnnualTax(taxableIncome: number, taxBrackets: TaxBrackets): number {
    return taxBrackets.calculateTax(taxableIncome);
  }

  static step4_GetMonthlyDivisor(month: number): number {
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }
    return this.MONTHLY_DIVISORS[month];
  }

  static step4_CalculateMonthlyWithholding(
    annualTax: number,
    month: number,
    previousWithholdings: number
  ): number {
    if (month === 12) {
      return Math.max(0, annualTax - previousWithholdings);
    }

    const divisor = this.step4_GetMonthlyDivisor(month);
    const monthlyWithholding = (annualTax - previousWithholdings) / divisor;
    
    return Math.round(Math.max(0, monthlyWithholding) * 100) / 100;
  }

  static step5_CalculateAdditionalWithholding(
    extraordinaryPayments: number,
    annualTax: number,
    projectedIncome: number
  ): number {
    if (extraordinaryPayments <= 0 || projectedIncome <= 0) return 0;
    
    const proportionalTax = (extraordinaryPayments / projectedIncome) * annualTax;
    return Math.round(proportionalTax * 100) / 100;
  }

  static calculateMonthlyWithholding(input: CalculationInput): MonthlyResult {
    const uit = UIT.createCustom(input.uit);
    const taxBrackets = TaxBrackets.createCustom(input.tasas, uit);

    const projectedIncome = this.step1_ProjectIncome(input);
    const taxableIncome = this.step2_ApplyDeduction(projectedIncome, uit);
    const annualTax = this.step3_CalculateAnnualTax(taxableIncome, taxBrackets);

    const extraordinaryTotal = input.pagos_extraordinarios_mes.reduce((sum, pago) => sum + pago.monto, 0);
    const additionalWithholding = this.step5_CalculateAdditionalWithholding(
      extraordinaryTotal,
      annualTax,
      projectedIncome
    );

    const regularWithholding = this.step4_CalculateMonthlyWithholding(
      annualTax,
      input.mes_calculo,
      input.retenciones_previas_acumuladas
    );

    const totalWithholding = regularWithholding + additionalWithholding;

    return {
      mes: input.mes_calculo,
      impuesto_anual_proyectado: annualTax,
      retenciones_previas: input.retenciones_previas_acumuladas,
      divisor_reglamentario: this.step4_GetMonthlyDivisor(input.mes_calculo),
      retencion_del_mes: regularWithholding,
      retencion_adicional_mes: additionalWithholding,
      total_retencion_mes: Math.round(totalWithholding * 100) / 100
    };
  }
}