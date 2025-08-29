export class UIT {
  constructor(private value: number) {
    if (value <= 0) {
      throw new Error('UIT value must be positive');
    }
  }

  getValue(): number {
    return this.value;
  }

  multiply(factor: number): number {
    return this.value * factor;
  }

  static readonly UIT_2025 = 5350;

  static create2025(): UIT {
    return new UIT(UIT.UIT_2025);
  }

  static createCustom(value: number): UIT {
    return new UIT(value);
  }
}