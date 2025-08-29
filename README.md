# Calculadora de Retenciones de Quinta Categoría - Perú

Herramienta de línea de comando para calcular la retención mensual del impuesto a la renta de quinta categoría para trabajadores dependientes en Perú, siguiendo **estrictamente** el procedimiento oficial de SUNAT.

## Instalación y Uso

```bash
npm install
npm run build

# Simular retención con parámetros CLI
npm run dev simulate --mes-calculo 8 --mes-inicio 3 --salario 4200 --gratificaciones '[{"mes":7,"monto":2100},{"mes":12,"monto":2100}]' --ret-previas 0 --extra-mes '[{"concepto":"utilidades","monto":1500}]'

# Explicar cálculo detallado con archivo JSON
npm run dev explain --input ./ejemplo.json --export-csv retenciones.csv
```

## Procedimiento SUNAT Implementado

### PASO 1 - Proyección de Ingresos Anuales
- **Fórmula**: `salario_mensual × meses_restantes + gratificaciones_futuras + ingresos_devengados_previos`
- Considera ingresos desde el mes de inicio hasta diciembre
- Incluye gratificaciones y conceptos extraordinarios

### PASO 2 - Deducción de 7 UIT
- **Fórmula**: `RBA_proyectada - (7 × UIT)`
- UIT 2025 = S/ 5,350 (configurable)
- Si el resultado ≤ 0, no hay retención

### PASO 3 - Impuesto Anual Progresivo
Tramos de renta anual del trabajo:
- **0 a 5 UIT**: 8%
- **>5 a 20 UIT**: 14%
- **>20 a 35 UIT**: 17%
- **>35 a 45 UIT**: 20%
- **>45 UIT**: 30%

### PASO 4 - Distribución Mensual
Divisores reglamentarios según mes:
- **Enero–Marzo**: ÷ 12
- **Abril**: ÷ 9
- **Mayo–Julio**: ÷ 8
- **Agosto**: ÷ 5
- **Septiembre–Noviembre**: ÷ 4
- **Diciembre**: Regularización (saldo total)

**Fórmula**: `(impuesto_anual - retenciones_previas) ÷ divisor_mes`

### PASO 5 - Retención Adicional
Para pagos extraordinarios en el mes:
- **Fórmula**: `(pago_extraordinario ÷ rba_proyectada) × impuesto_anual`
- Se suma a la retención regular del mes

## Entrada de Datos

### Formato JSON (recomendado para --input)
```json
{
  "mes_calculo": 8,
  "mes_inicio": 3,
  "salario_mensual": 4200,
  "gratificaciones_previstas": [
    {"mes": 7, "monto": 2100},
    {"mes": 12, "monto": 2100}
  ],
  "pagos_extraordinarios_mes": [
    {"concepto": "utilidades", "monto": 1500}
  ],
  "retenciones_previas_acumuladas": 0,
  "uit": 5350,
  "tasas": [
    {"hasta_uit": 5, "tasa": 0.08},
    {"hasta_uit": 20, "tasa": 0.14},
    {"hasta_uit": 35, "tasa": 0.17},
    {"hasta_uit": 45, "tasa": 0.20},
    {"hasta_uit": null, "tasa": 0.30}
  ]
}
```

## Comandos

### `simulate`
Calcula retenciones con parámetros CLI:
```bash
perutax simulate --mes-calculo 8 --mes-inicio 1 --salario 5000 --gratificaciones '[]' --ret-previas 500 --export-csv output.csv
```

### `explain`
Muestra procedimiento SUNAT paso a paso:
```bash
perutax explain --input ./escenario.json --export-csv detalle.csv
```

## Casos de Prueba - Comandos Exactos

### Caso 1: Ingreso bajo (S/ 1,000) → Sin retención
```bash
npm run dev simulate -- --mes-calculo 1 --mes-inicio 1 --salario 1000 --gratificaciones "[]" --ret-previas 0 --extra-mes "[]"
```
**Resultado esperado**: Total Retenciones S/ 0.00 (RBA < 7 UIT)

### Caso 2: Ingreso normal (S/ 5,000) → Retención distribuida
```bash
npm run dev simulate -- --mes-calculo 1 --mes-inicio 1 --salario 5000 --gratificaciones "[]" --ret-previas 0 --extra-mes "[]"
```
**Resultado esperado**: Total Retenciones S/ 1,804.00

### Caso 3: Pago extraordinario junio (S/ 10,000) → Retención adicional
```bash
npm run dev simulate -- --mes-calculo 6 --mes-inicio 1 --salario 5000 --gratificaciones "[]" --ret-previas 568.85 --extra-mes "[{\"concepto\":\"adicional\",\"monto\":10000}]"
```
**Resultado esperado**: Retención adicional S/ 300.67 cada mes

### Caso 4: Cálculo desde septiembre → Divisor menor
```bash
npm run dev simulate -- --mes-calculo 9 --mes-inicio 1 --salario 5000 --gratificaciones "[]" --ret-previas 0 --extra-mes "[]"
```
**Resultado esperado**: Retenciones mayores por divisor 4

### Caso 5: Pago extraordinario noviembre desde julio
```bash
# Julio sin adicional
npm run dev simulate -- --mes-calculo 7 --mes-inicio 1 --salario 5000 --gratificaciones "[]" --ret-previas 0 --extra-mes "[]"

# Noviembre con adicional S/ 10,000
npm run dev simulate -- --mes-calculo 11 --mes-inicio 1 --salario 5000 --gratificaciones "[]" --ret-previas 1093.67 --extra-mes "[{\"concepto\":\"adicional\",\"monto\":10000}]"
```
**Resultado esperado**: Noviembre S/ 507.53 (S/ 177.58 + S/ 300.67 adicional)

## Actualización de Parámetros

Para actualizar la UIT o los tramos tributarios:

### 1. UIT (Unidad Impositiva Tributaria)
```bash
# Usar UIT personalizada
```

### 2. Tramos Tributarios
Modificar el JSON de entrada:
```json
{
  "tasas": [
    {"hasta_uit": 5, "tasa": 0.08},
    {"hasta_uit": 20, "tasa": 0.14},
    {"hasta_uit": null, "tasa": 0.25}
  ]
}
```

## Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar tests
npm test

# Verificar tipos
npm run typecheck

# Linter
npm run lint

# Modo desarrollo
npm run dev simulate --help
```

## Arquitectura

- **`domain/`**: Lógica pura de negocio (UIT, tramos, reglas SUNAT)
- **`services/`**: Servicios de proyección y cálculo
- **`cli/`**: Comandos de línea y interfaz
- **`utils/`**: Validación y exportación CSV
- **`tests/`**: Tests unitarios para toda la lógica core

**Funciones puras**: Todo el núcleo de cálculo está implementado sin efectos secundarios para facilitar testing y mantenimiento.