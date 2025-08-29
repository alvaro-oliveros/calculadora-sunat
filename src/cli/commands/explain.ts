import { Command } from 'commander';
import * as fs from 'fs';
import { RetentionService } from '../../domain/services/RetentionService';
import { SunatRules } from '../../domain/services/SunatRules';
import { CSVExporter } from '../../utils/csv-export';
import { InputValidator } from '../../utils/validation';
import { CalculationInput } from '../../domain/models/types';
import { UIT } from '../../domain/models/UIT';
import { TaxBrackets } from '../../domain/models/TaxBrackets';

export function createExplainCommand(): Command {
  const command = new Command('explain');
  
  command
    .description('Explicar cálculo tributario con procedimiento SUNAT detallado paso a paso')
    .option('--input <path>', 'Ruta del archivo JSON de entrada')
    .option('--export-csv <path>', 'Exportar resultados a archivo CSV')
    .action(async (options) => {
      try {
        let input: CalculationInput;

        if (options.input) {
          const inputData = await fs.promises.readFile(options.input, 'utf-8');
          input = JSON.parse(inputData);
        } else {
          throw new Error('El parámetro --input con la ruta del archivo JSON es requerido');
        }

        InputValidator.validate(input);

        console.log('=== PROCEDIMIENTO SUNAT - CÁLCULO DETALLADO ===\n');

        const uit = UIT.createCustom(input.uit);
        const taxBrackets = TaxBrackets.createCustom(input.tasas, uit);

        console.log(`PASO 1 - PROYECCIÓN DE INGRESOS ANUALES:`);
        const projectedIncome = SunatRules.step1_ProjectIncome(input);
        console.log(`- Salario mensual: S/ ${input.salario_mensual.toFixed(2)}`);
        console.log(`- Meses restantes: ${12 - input.mes_calculo + 1}`);
        console.log(`- Gratificaciones pendientes: S/ ${input.gratificaciones_previstas.filter(g => g.mes >= input.mes_calculo).reduce((sum, g) => sum + g.monto, 0).toFixed(2)}`);
        console.log(`- RBA Proyectada Total: S/ ${projectedIncome.toFixed(2)}\n`);

        console.log(`PASO 2 - DEDUCCIÓN (7 UIT):`);
        const deduction = uit.multiply(7);
        const taxableIncome = SunatRules.step2_ApplyDeduction(projectedIncome, uit);
        console.log(`- UIT 2025: S/ ${uit.getValue().toFixed(2)}`);
        console.log(`- Deducción (7 UIT): S/ ${deduction.toFixed(2)}`);
        console.log(`- Renta Neta Anual: S/ ${taxableIncome.toFixed(2)}\n`);

        if (taxableIncome <= 0) {
          console.log('RESULTADO: No hay retención (renta neta ≤ 0)\n');
          return;
        }

        console.log(`PASO 3 - IMPUESTO ANUAL (TRAMOS PROGRESIVOS):`);
        const annualTax = SunatRules.step3_CalculateAnnualTax(taxableIncome, taxBrackets);
        console.log(`- Aplicando tramos de: 8%, 14%, 17%, 20%, 30%`);
        console.log(`- Impuesto Anual: S/ ${annualTax.toFixed(2)}\n`);

        console.log(`PASO 4 - DISTRIBUCIÓN MENSUAL:`);
        const divisor = SunatRules.step4_GetMonthlyDivisor(input.mes_calculo);
        console.log(`- Mes ${input.mes_calculo}: Divisor reglamentario = ${divisor}`);
        console.log(`- Retenciones previas: S/ ${input.retenciones_previas_acumuladas.toFixed(2)}\n`);

        const extraordinaryTotal = input.pagos_extraordinarios_mes.reduce((sum, p) => sum + p.monto, 0);
        if (extraordinaryTotal > 0) {
          console.log(`PASO 5 - RETENCIÓN ADICIONAL:`);
          const additionalWithholding = SunatRules.step5_CalculateAdditionalWithholding(
            extraordinaryTotal, annualTax, projectedIncome
          );
          console.log(`- Pagos extraordinarios: S/ ${extraordinaryTotal.toFixed(2)}`);
          console.log(`- Retención adicional: S/ ${additionalWithholding.toFixed(2)}\n`);
        }

        const result = RetentionService.calculateFullYear(input);

        console.log('RESULTADO MENSUAL:');
        console.log(CSVExporter.formatTable(result));

        if (options.exportCsv) {
          await CSVExporter.exportToCSV(result, options.exportCsv);
          console.log(`\nResultados exportados a: ${options.exportCsv}`);
        }

      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}