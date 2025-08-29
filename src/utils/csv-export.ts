import * as fs from 'fs';
import { CalculationResult, MonthlyResult } from '../domain/models/types';

export class CSVExporter {
  static async exportToCSV(result: CalculationResult, filePath: string): Promise<void> {
    const headers = [
      'Mes',
      'Impuesto Anual Proyectado',
      'Retenciones Previas',
      'Divisor Reglamentario',
      'Retención del Mes',
      'Retención Adicional',
      'Total Retención Mes'
    ];

    const csvContent = [
      headers.join(','),
      ...result.monthly_results.map(row => [
        row.mes,
        row.impuesto_anual_proyectado.toFixed(2),
        row.retenciones_previas.toFixed(2),
        row.divisor_reglamentario,
        row.retencion_del_mes.toFixed(2),
        row.retencion_adicional_mes.toFixed(2),
        row.total_retencion_mes.toFixed(2)
      ].join(','))
    ].join('\n');

    await fs.promises.writeFile(filePath, csvContent, 'utf-8');
  }

  static formatTable(result: CalculationResult): string {
    const headers = ['Mes', 'Imp.Anual', 'Ret.Previas', 'Divisor', 'Ret.Mes', 'Ret.Adic', 'Total'];
    const separator = headers.map(h => '-'.repeat(Math.max(h.length, 10))).join('|');
    
    const headerRow = headers.map(h => h.padEnd(10)).join('|');
    
    const dataRows = result.monthly_results.map(row => [
      row.mes.toString().padEnd(10),
      row.impuesto_anual_proyectado.toFixed(2).padStart(10),
      row.retenciones_previas.toFixed(2).padStart(10),
      row.divisor_reglamentario.toString().padStart(10),
      row.retencion_del_mes.toFixed(2).padStart(10),
      row.retencion_adicional_mes.toFixed(2).padStart(10),
      row.total_retencion_mes.toFixed(2).padStart(10)
    ].join('|'));

    return [headerRow, separator, ...dataRows].join('\n');
  }
}