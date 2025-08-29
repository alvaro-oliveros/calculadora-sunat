import { InputValidator, ValidationError } from '../../src/utils/validation';
import { CalculationInput } from '../../src/domain/models/types';

describe('InputValidator', () => {
  let validInput: CalculationInput;

  beforeEach(() => {
    validInput = {
      mes_calculo: 8,
      mes_inicio: 3,
      salario_mensual: 4200,
      gratificaciones_previstas: [{ mes: 7, monto: 2100 }],
      pagos_extraordinarios_mes: [{ concepto: 'utilidades', monto: 1500 }],
      retenciones_previas_acumuladas: 0,
      uit: 5350,
      tasas: [
        { hasta_uit: 5, tasa: 0.08 },
        { hasta_uit: null, tasa: 0.30 }
      ]
    };
  });

  describe('valid input', () => {
    it('should pass validation for correct input', () => {
      expect(() => InputValidator.validate(validInput)).not.toThrow();
    });
  });

  describe('month validation', () => {
    it('should reject invalid mes_calculo', () => {
      const invalidInputs = [
        { ...validInput, mes_calculo: 0 },
        { ...validInput, mes_calculo: 13 },
        { ...validInput, mes_calculo: 1.5 }
      ];

      invalidInputs.forEach(input => {
        expect(() => InputValidator.validate(input)).toThrow(ValidationError);
      });
    });

    it('should reject invalid mes_inicio', () => {
      const invalidInput = { ...validInput, mes_inicio: 0 };
      expect(() => InputValidator.validate(invalidInput)).toThrow(ValidationError);
    });

    it('should reject mes_inicio > mes_calculo', () => {
      const invalidInput = { ...validInput, mes_inicio: 10, mes_calculo: 5 };
      expect(() => InputValidator.validate(invalidInput)).toThrow('mes_inicio cannot be greater than mes_calculo');
    });
  });

  describe('numeric validation', () => {
    it('should reject negative salario_mensual', () => {
      const invalidInput = { ...validInput, salario_mensual: -100 };
      expect(() => InputValidator.validate(invalidInput)).toThrow('salario_mensual cannot be negative');
    });

    it('should reject negative retenciones_previas_acumuladas', () => {
      const invalidInput = { ...validInput, retenciones_previas_acumuladas: -50 };
      expect(() => InputValidator.validate(invalidInput)).toThrow('retenciones_previas_acumuladas cannot be negative');
    });

    it('should reject non-positive UIT', () => {
      const invalidInputs = [
        { ...validInput, uit: 0 },
        { ...validInput, uit: -5350 }
      ];

      invalidInputs.forEach(input => {
        expect(() => InputValidator.validate(input)).toThrow('UIT must be positive');
      });
    });
  });

  describe('tax brackets validation', () => {
    it('should reject empty tax brackets', () => {
      const invalidInput = { ...validInput, tasas: [] };
      expect(() => InputValidator.validate(invalidInput)).toThrow('Tax brackets cannot be empty');
    });

    it('should reject invalid tax rates', () => {
      const invalidInput = {
        ...validInput,
        tasas: [{ hasta_uit: 5, tasa: 1.5 }, { hasta_uit: null, tasa: 0.30 }]
      };
      expect(() => InputValidator.validate(invalidInput)).toThrow('Tax rate must be between 0 and 1');
    });

    it('should require last bracket to have null hasta_uit', () => {
      const invalidInput = {
        ...validInput,
        tasas: [{ hasta_uit: 5, tasa: 0.08 }, { hasta_uit: 20, tasa: 0.30 }]
      };
      expect(() => InputValidator.validate(invalidInput)).toThrow('Last tax bracket must have hasta_uit = null');
    });
  });

  describe('gratificaciones validation', () => {
    it('should reject invalid gratificacion month', () => {
      const invalidInput = {
        ...validInput,
        gratificaciones_previstas: [{ mes: 13, monto: 2100 }]
      };
      expect(() => InputValidator.validate(invalidInput)).toThrow('Gratificacion mes must be between 1 and 12');
    });

    it('should reject negative gratificacion amount', () => {
      const invalidInput = {
        ...validInput,
        gratificaciones_previstas: [{ mes: 7, monto: -100 }]
      };
      expect(() => InputValidator.validate(invalidInput)).toThrow('Gratificacion monto must be a non-negative number');
    });
  });

  describe('extraordinary payments validation', () => {
    it('should reject empty concepto', () => {
      const invalidInput = {
        ...validInput,
        pagos_extraordinarios_mes: [{ concepto: '', monto: 1500 }]
      };
      expect(() => InputValidator.validate(invalidInput)).toThrow('Pago extraordinario concepto must be a non-empty string');
    });

    it('should reject negative monto', () => {
      const invalidInput = {
        ...validInput,
        pagos_extraordinarios_mes: [{ concepto: 'utilidades', monto: -500 }]
      };
      expect(() => InputValidator.validate(invalidInput)).toThrow('Pago extraordinario monto must be a non-negative number');
    });
  });
});