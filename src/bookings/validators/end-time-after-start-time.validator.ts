import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from "class-validator";

/**
 * Validates that `endTime` is later than `startTime`. Apply to `endTime`; it
 * reads `startTime` from the same object. Both are "HH:MM" strings, which
 * compare correctly lexicographically, so no parsing is needed.
 *
 * A partial update that sends only one of the two cannot be checked here (the
 * other value lives in the database), so it passes.
 */
export function IsEndTimeAfterStartTime(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isEndTimeAfterStartTime",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const { startTime } = args.object as { startTime?: string };
          if (typeof value !== "string" || typeof startTime !== "string") {
            return true; // nothing to compare; other validators cover types
          }
          return value > startTime;
        },
        defaultMessage() {
          return "endTime must be later than startTime";
        },
      },
    });
  };
}
