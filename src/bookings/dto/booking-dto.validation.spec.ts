import { ClassConstructor, plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { BookingQueryDto } from "./booking-query.dto";
import { CancelBookingDto } from "./cancel-booking.dto";
import { CreateBookingDto } from "./create-booking.dto";
import { UpdateBookingDto } from "./update-booking.dto";

/** Property names that failed validation, so a test asserts on fields not messages. */
function failingFields<T extends object>(
  cls: ClassConstructor<T>,
  payload: Record<string, unknown>,
): string[] {
  return validateSync(plainToInstance(cls, payload)).map((e) => e.property);
}

const validBooking = {
  workspaceId: "ws-1",
  bookingTitle: "Wedding Shoot",
  clientName: "Kasun Perera",
  eventDate: "2026-08-15",
  totalAmount: 1000,
};

describe("CreateBookingDto", () => {
  it("accepts a valid payload", () => {
    expect(failingFields(CreateBookingDto, validBooking)).toEqual([]);
  });

  it.each([
    ["bookingTitle", 201],
    ["clientName", 151],
    ["location", 256],
    ["packageName", 151],
    ["notes", 2001],
  ])("caps the length of %s", (field, overLimit) => {
    expect(
      failingFields(CreateBookingDto, {
        ...validBooking,
        [field]: "x".repeat(overLimit),
      }),
    ).toContain(field);
  });

  it.each(["9:00", "99:99", "18:00:00", "noon", "24:00"])(
    "rejects %s as a start time",
    (startTime) => {
      expect(
        failingFields(CreateBookingDto, { ...validBooking, startTime }),
      ).toContain("startTime");
    },
  );

  it.each(["00:00", "09:00", "23:59"])(
    "accepts %s as a start time",
    (startTime) => {
      expect(
        failingFields(CreateBookingDto, { ...validBooking, startTime }),
      ).toEqual([]);
    },
  );

  it("rejects an endTime that is not after startTime", () => {
    expect(
      failingFields(CreateBookingDto, {
        ...validBooking,
        startTime: "18:00",
        endTime: "09:00",
      }),
    ).toContain("endTime");

    expect(
      failingFields(CreateBookingDto, {
        ...validBooking,
        startTime: "09:00",
        endTime: "09:00",
      }),
    ).toContain("endTime");
  });

  it("accepts an endTime after startTime", () => {
    expect(
      failingFields(CreateBookingDto, {
        ...validBooking,
        startTime: "09:00",
        endTime: "18:00",
      }),
    ).toEqual([]);
  });
});

describe("UpdateBookingDto", () => {
  it("accepts an empty patch", () => {
    expect(failingFields(UpdateBookingDto, {})).toEqual([]);
  });

  // The rules are inherited from CreateBookingDto rather than copied, so they
  // cannot drift between the two routes that write the same columns.
  it("applies the same length caps", () => {
    expect(
      failingFields(UpdateBookingDto, { bookingTitle: "x".repeat(201) }),
    ).toContain("bookingTitle");
  });

  it("applies the same time rules", () => {
    expect(failingFields(UpdateBookingDto, { startTime: "99:99" })).toContain(
      "startTime",
    );
    expect(
      failingFields(UpdateBookingDto, { startTime: "18:00", endTime: "09:00" }),
    ).toContain("endTime");
  });

  it("cannot move a booking to another workspace", () => {
    // Mirrors the global ValidationPipe, which runs with whitelist: true.
    const instance = plainToInstance(UpdateBookingDto, { workspaceId: "ws-2" });
    validateSync(instance, { whitelist: true });
    expect((instance as Record<string, unknown>).workspaceId).toBeUndefined();
  });
});

describe("CancelBookingDto", () => {
  it("requires a reason", () => {
    expect(failingFields(CancelBookingDto, {})).toContain("reason");
    expect(failingFields(CancelBookingDto, { reason: "  " })).toContain(
      "reason",
    );
  });

  it("caps the reason at 500 characters", () => {
    expect(
      failingFields(CancelBookingDto, { reason: "x".repeat(501) }),
    ).toContain("reason");
  });

  it("accepts a stated reason", () => {
    expect(
      failingFields(CancelBookingDto, { reason: "Client cancelled the event" }),
    ).toEqual([]);
  });
});

describe("BookingQueryDto", () => {
  it("requires workspaceId, as the published contract now says", () => {
    expect(failingFields(BookingQueryDto, {})).toContain("workspaceId");
    expect(failingFields(BookingQueryDto, { workspaceId: "ws-1" })).toEqual([]);
  });
});
