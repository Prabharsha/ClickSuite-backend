import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from "class-validator";

/**
 * Validates that `advanceAmount` does not exceed `totalAmount`.
 * Apply to the `totalAmount` property; it reads `advanceAmount` from the same object.
 */
export function IsAdvanceWithinTotal(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isAdvanceWithinTotal",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const obj = args.object as { advanceAmount?: number };
          const total = typeof value === "number" ? value : Number(value);
          const advance =
            obj.advanceAmount === undefined ? 0 : Number(obj.advanceAmount);
          if (Number.isNaN(total) || Number.isNaN(advance)) return true; // other validators handle type errors
          return advance <= total;
        },
        defaultMessage() {
          return "totalAmount must be greater than or equal to advanceAmount";
        },
      },
    });
  };
}
