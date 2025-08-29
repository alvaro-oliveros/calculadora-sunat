#!/usr/bin/env node

import { Command } from 'commander';
import { createSimulateCommand } from './commands/simulate';
import { createExplainCommand } from './commands/explain';

const program = new Command();

program
  .name('perutax')
  .description('Calculadora de Retenciones de Quinta Categoría siguiendo procedimientos SUNAT')
  .version('1.0.0');

program.addCommand(createSimulateCommand());
program.addCommand(createExplainCommand());

program.parse();