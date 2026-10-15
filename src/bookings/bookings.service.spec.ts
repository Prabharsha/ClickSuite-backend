import { Test } from "@nestjs/testing";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { BookingsService } from "./bookings.service";
import { CreateBookingDto } from "./dto/create-booking.dto";

/**
 * Unit tests for the money/status derivation logic. Prisma and the workspace
 * access check are mocked, so these run without a database.
 */
describe("BookingsService.create", () => {
  let service: BookingsService;
  let prismaCreate: jest.Mock;

  // Echoes back the data Prisma would persist, wrapping Decimals like the DB does.
  const fakePersist = (data: Record<string, unknown>) => ({
    id: "booking-1",
    clientPhone: null,
    clientEmail: null,
    eventType: null,
    startTime: null,
    endTime: null,
    location: null,
    packageName: null,
    bookingStatus: "PENDING",
    workProgressStatus: "NOT_STARTED",
    notes: null,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
    eventDate: data.eventDate as Date,
    totalAmount: new Prisma.Decimal(data.totalAmount as number),
    advanceAmount: new Prisma.Decimal(data.advanceAmount as number),
    balanceAmount: new Prisma.Decimal(data.balanceAmount as number),
  });

  beforeEach(async () => {
    prismaCreate = jest.fn(({ data }) => fakePersist(data));

    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: { booking: { create: prismaCreate } },
        },
        {
          provide: WorkspacesService,
          useValue: { assertMembership: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(BookingsService);
  });

  const baseDto: CreateBookingDto = {
    workspaceId: "ws-1",
    bookingTitle: "Test Shoot",
    clientName: "Client",
    eventDate: "2026-08-15",
    totalAmount: 1000,
  };

  it("sets UNPAID and full balance when there is no advance", async () => {
    const result = await service.create("user-1", { ...baseDto });
    expect(result.balanceAmount).toBe(1000);
    expect(result.paymentStatus).toBe("UNPAID");
  });

  it("sets PARTIALLY_PAID when advance is between 0 and total", async () => {
    const result = await service.create("user-1", {
      ...baseDto,
      advanceAmount: 400,
    });
    expect(result.balanceAmount).toBe(600);
    expect(result.paymentStatus).toBe("PARTIALLY_PAID");
  });

  it("sets FULLY_PAID when advance equals total", async () => {
    const result = await service.create("user-1", {
      ...baseDto,
      advanceAmount: 1000,
    });
    expect(result.balanceAmount).toBe(0);
    expect(result.paymentStatus).toBe("FULLY_PAID");
  });
});
