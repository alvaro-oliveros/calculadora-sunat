import { CalculationInput, CalculationResult, MonthlyResult } from '../models/types';
import { SunatRules } from './SunatRules';
import { UIT } from '../models/UIT';
import { TaxBrackets } from '../models/TaxBrackets';

export class RetentionService {
  static calculateFullYear(input: CalculationInput): CalculationResult {
    const uit = UIT.createCustom(input.uit);
    const taxBrackets = TaxBrackets.createCustom(input.tasas, uit);

    const projectedIncome = SunatRules.step1_ProjectIncome(input);
    const taxableIncome = SunatRules.step2_ApplyDeduction(projectedIncome, uit);
    const annualTax = SunatRules.step3_CalculateAnnualTax(taxableIncome, taxBrackets);

    const monthlyResults: MonthlyResult[] = [];
    let accumulatedWithholdings = input.retenciones_previas_acumuladas;

    for (let month = input.mes_calculo; month <= 12; month++) {
      const monthInput = { ...input, mes_calculo: month, retenciones_previas_acumuladas: accumulatedWithholdings };
      const monthlyResult = SunatRules.calculateMonthlyWithholding(monthInput);
      monthlyResults.push(monthlyResult);
      accumulatedWithholdings += monthlyResult.total_retencion_mes;
    }

    return {
      input,
      monthly_results: monthlyResults,
      summary: {
        total_annual_income: projectedIncome,
        deductible_amount: uit.multiply(7),
        taxable_income: taxableIncome,
        annual_tax: annualTax,
        total_withholdings: accumulatedWithholdings
      }
    };
  }

  static calculateSingleMonth(input: CalculationInput): MonthlyResult {
    return SunatRules.calculateMonthlyWithholding(input);
  }
}