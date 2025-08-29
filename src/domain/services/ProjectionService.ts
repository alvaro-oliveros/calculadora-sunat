import { CalculationInput, Gratificacion, RemuneracionHistorial } from '../models/types';

export class ProjectionService {
  static projectAnnualIncome(input: CalculationInput): number {
    const { mes_calculo, mes_inicio, salario_mensual, gratificaciones_previstas, historial_remuneraciones } = input;
    
    let totalIncome = 0;

    const mesesRestantes = 12 - mes_calculo + 1;
    const salarioProyectado = salario_mensual * mesesRestantes;
    totalIncome += salarioProyectado;

    const gratificacionesPendientes = gratificaciones_previstas.filter(g => g.mes >= mes_calculo);
    const totalGratificaciones = gratificacionesPendientes.reduce((sum, g) => sum + g.monto, 0);
    totalIncome += totalGratificaciones;

    if (historial_remuneraciones && historial_remuneraciones.length > 0) {
      const ingresosDevengadosPrevios = historial_remuneraciones
        .filter(h => h.mes >= mes_inicio && h.mes < mes_calculo)
        .reduce((sum, h) => sum + h.monto, 0);
      totalIncome += ingresosDevengadosPrevios;
    } else {
      const mesesTranscurridos = mes_calculo - mes_inicio;
      const ingresosDevengadosPrevios = salario_mensual * mesesTranscurridos;
      totalIncome += ingresosDevengadosPrevios;
    }

    const gratificacionesPasadas = gratificaciones_previstas.filter(g => g.mes >= mes_inicio && g.mes < mes_calculo);
    const totalGratificacionesPasadas = gratificacionesPasadas.reduce((sum, g) => sum + g.monto, 0);
    totalIncome += totalGratificacionesPasadas;

    return Math.round(totalIncome * 100) / 100;
  }

  static getRemainingMonths(mesCalculo: number): number {
    return 12 - mesCalculo + 1;
  }

  static getElapsedMonths(mesInicio: number, mesCalculo: number): number {
    return mesCalculo - mesInicio;
  }
}