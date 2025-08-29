import { CalculationInput, TaxBracket } from '../domain/models/types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class InputValidator {
  static validate(input: CalculationInput): void {
    this.validateMonth(input.mes_calculo, 'mes_calculo');
    this.validateMonth(input.mes_inicio, 'mes_inicio');
    
    if (input.mes_inicio > input.mes_calculo) {
      throw new ValidationError('mes_inicio cannot be greater than mes_calculo');
    }

    if (input.salario_mensual < 0) {
      throw new ValidationError('salario_mensual cannot be negative');
    }

    if (input.retenciones_previas_acumuladas < 0) {
      throw new ValidationError('retenciones_previas_acumuladas cannot be negative');
    }

    if (input.uit <= 0) {
      throw new ValidationError('UIT must be positive');
    }

    this.validateTaxBrackets(input.tasas);
    this.validateGratificaciones(input.gratificaciones_previstas);
    this.validateExtraordinaryPayments(input.pagos_extraordinarios_mes);
  }

  private static validateMonth(month: number, fieldName: string): void {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new ValidationError(`${fieldName} must be an integer between 1 and 12`);
    }
  }

  private static validateTaxBrackets(brackets: TaxBracket[]): void {
    if (!brackets || brackets.length === 0) {
      throw new ValidationError('Tax brackets cannot be empty');
    }

    for (let i = 0; i < brackets.length; i++) {
      const bracket = brackets[i];
      
      if (bracket.tasa < 0 || bracket.tasa > 1) {
        throw new ValidationError(`Tax rate must be between 0 and 1, got ${bracket.tasa}`);
      }

      if (i === brackets.length - 1 && bracket.hasta_uit !== null) {
        throw new ValidationError('Last tax bracket must have hasta_uit = null');
      }

      if (i < brackets.length - 1 && (bracket.hasta_uit === null || bracket.hasta_uit <= 0)) {
        throw new ValidationError('Non-final tax brackets must have positive hasta_uit');
      }
    }
  }

  private static validateGratificaciones(gratificaciones: any[]): void {
    for (const grat of gratificaciones) {
      if (!Number.isInteger(grat.mes) || grat.mes < 1 || grat.mes > 12) {
        throw new ValidationError('Gratificacion mes must be between 1 and 12');
      }
      if (typeof grat.monto !== 'number' || grat.monto < 0) {
        throw new ValidationError('Gratificacion monto must be a non-negative number');
      }
    }
  }

  private static validateExtraordinaryPayments(payments: any[]): void {
    for (const payment of payments) {
      if (typeof payment.concepto !== 'string' || payment.concepto.trim() === '') {
        throw new ValidationError('Pago extraordinario concepto must be a non-empty string');
      }
      if (typeof payment.monto !== 'number' || payment.monto < 0) {
        throw new ValidationError('Pago extraordinario monto must be a non-negative number');
      }
    }
  }
}