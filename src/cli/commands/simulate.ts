import { Command } from 'commander';
import { RetentionService } from '../../domain/services/RetentionService';
import { CSVExporter } from '../../utils/csv-export';
import { InputValidator } from '../../utils/validation';
import { CalculationInput, TaxBracket } from '../../domain/models/types';

export function createSimulateCommand(): Command {
  const command = new Command('simulate');
  
  command
    .description('Calculate monthly tax withholding for a Peruvian worker')
    .option('--mes-calculo <number>', 'Calculation month (1-12)', (val) => parseInt(val))
    .option('--mes-inicio <number>', 'Start month (1-12)', (val) => parseInt(val))
    .option('--salario <number>', 'Monthly salary in soles', (val) => parseFloat(val))
    .option('--gratificaciones <json>', 'Bonuses as JSON array', (val) => JSON.parse(val))
    .option('--ret-previas <number>', 'Previous accumulated withholdings', (val) => parseFloat(val))
    .option('--extra-mes <json>', 'Extraordinary payments as JSON array', (val) => JSON.parse(val))
    .option('--uit <number>', 'UIT value (default: 5350)', (val) => parseFloat(val))
    .option('--export-csv <path>', 'Export results to CSV file')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const defaultTaxBrackets: TaxBracket[] = [
          { hasta_uit: 5, tasa: 0.08 },
          { hasta_uit: 20, tasa: 0.14 },
          { hasta_uit: 35, tasa: 0.17 },
          { hasta_uit: 45, tasa: 0.20 },
          { hasta_uit: null, tasa: 0.30 }
        ];

        const input: CalculationInput = {
          mes_calculo: options.mesCalculo || 1,
          mes_inicio: options.mesInicio || 1,
          salario_mensual: options.salario || 0,
          gratificaciones_previstas: options.gratificaciones || [],
          pagos_extraordinarios_mes: options.extraMes || [],
          retenciones_previas_acumuladas: options.retPrevias || 0,
          uit: options.uit || 5350,
          tasas: defaultTaxBrackets
        };

        InputValidator.validate(input);

        const result = RetentionService.calculateFullYear(input);

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log('\n=== CÁLCULO DE RETENCIÓN MENSUAL ===\n');
          console.log(`RBA Proyectada: S/ ${result.summary.total_annual_income.toFixed(2)}`);
          console.log(`Deducción (7 UIT): S/ ${result.summary.deductible_amount.toFixed(2)}`);
          console.log(`Renta Neta: S/ ${result.summary.taxable_income.toFixed(2)}`);
          console.log(`Impuesto Anual: S/ ${result.summary.annual_tax.toFixed(2)}\n`);
          
          console.log(CSVExporter.formatTable(result));
          
          console.log(`\nTotal Retenciones: S/ ${result.summary.total_withholdings.toFixed(2)}`);
        }

        if (options.exportCsv) {
          await CSVExporter.exportToCSV(result, options.exportCsv);
          console.log(`\nResults exported to: ${options.exportCsv}`);
        }

      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}