import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { BookingsService } from "./bookings.service";

/**
 * Cancel-booking behaviour, against an in-memory row so "the booking is still
 * active" is an actual assertion about state rather than about a mock call.
 */
describe("BookingsService.cancel", () => {
  let service: BookingsService;
  let row: Record<string, unknown>;
  let update: jest.Mock;

  const freshRow = () => ({
    id: "booking-1",
    workspaceId: "ws-1",
    bookingTitle: "Wedding Shoot",
    clientName: "Client",
    clientPhone: null,
    clientEmail: null,
    eventType: null,
    eventDate: new Date("2026-08-15"),
    startTime: null,
    endTime: null,
    location: null,
    packageName: null,
    totalAmount: new Prisma.Decimal(1000),
    advanceAmount: new Prisma.Decimal(0),
    balanceAmount: new Prisma.Decimal(1000),
    bookingStatus: "CONFIRMED",
    paymentStatus: "UNPAID",
    workProgressStatus: "NOT_STARTED",
    notes: null,
    cancellationReason: null,
    createdByUserId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    row = freshRow();
    update = jest.fn(({ data }: { data: Record<string, unknown> }) => {
      Object.assign(row, data);
      return row;
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: { booking: { update } } },
        {
          provide: WorkspacesService,
          useValue: { assertMembership: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(BookingsService);
  });

  it("sets CANCELLED and persists the reason", async () => {
    const result = await service.cancel("user-1", "booking-1", {
      reason: "Client cancelled the event",
    });

    expect(result.bookingStatus).toBe("CANCELLED");
    expect(row.bookingStatus).toBe("CANCELLED");
    expect(row.cancellationReason).toBe("Client cancelled the event");
  });

  it("scopes the write to a workspace the caller belongs to", async () => {
    await service.cancel("user-1", "booking-1", { reason: "Rained off" });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "booking-1",
          workspace: { members: { some: { userId: "user-1" } } },
        },
      }),
    );
  });

  it("reports a booking in another workspace as missing, not forbidden", async () => {
    update.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("No record was found", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    await expect(
      service.cancel("intruder", "booking-1", { reason: "Nope" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  /**
   * The bug this replaces: the UI reported "Booking cancelled" without issuing
   * any request. A cancel that fails must leave the booking exactly as it was,
   * so the UI has something true to render.
   */
  it("leaves the booking active when the request fails", async () => {
    update.mockRejectedValueOnce(new Error("connection reset"));

    await expect(
      service.cancel("user-1", "booking-1", { reason: "Client cancelled" }),
    ).rejects.toThrow("connection reset");

    expect(row.bookingStatus).toBe("CONFIRMED");
    expect(row.cancellationReason).toBeNull();
  });
});
