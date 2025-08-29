export interface TaxBracket {
  hasta_uit: number | null;
  tasa: number;
}

export interface Gratificacion {
  mes: number;
  monto: number;
}

export interface PagoExtraordinario {
  concepto: string;
  monto: number;
}

export interface RemuneracionHistorial {
  mes: number;
  monto: number;
}

export interface CalculationInput {
  mes_calculo: number;
  mes_inicio: number;
  salario_mensual: number;
  gratificaciones_previstas: Gratificacion[];
  pagos_extraordinarios_mes: PagoExtraordinario[];
  retenciones_previas_acumuladas: number;
  uit: number;
  tasas: TaxBracket[];
  historial_remuneraciones?: RemuneracionHistorial[];
}

export interface MonthlyResult {
  mes: number;
  impuesto_anual_proyectado: number;
  retenciones_previas: number;
  divisor_reglamentario: number;
  retencion_del_mes: number;
  retencion_adicional_mes: number;
  total_retencion_mes: number;
}

export interface CalculationResult {
  input: CalculationInput;
  monthly_results: MonthlyResult[];
  summary: {
    total_annual_income: number;
    deductible_amount: number;
    taxable_income: number;
    annual_tax: number;
    total_withholdings: number;
  };
}