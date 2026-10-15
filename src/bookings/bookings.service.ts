import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Booking, PaymentStatus, Prisma } from "@prisma/client";
import { buildPaginationMeta } from "../common/dto/pagination.dto";
import { PaginatedResult } from "../common/interfaces/api-response.interface";
import { PrismaService } from "../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { BookingResponse, serializeBooking } from "./bookings.serializer";
import { BookingQueryDto } from "./dto/booking-query.dto";
import { CancelBookingDto } from "./dto/cancel-booking.dto";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";
import { UpdateBookingDto } from "./dto/update-booking.dto";
import { UpdateWorkProgressDto } from "./dto/update-work-progress.dto";

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspacesService,
  ) {}

  async create(
    userId: string,
    dto: CreateBookingDto,
  ): Promise<BookingResponse> {
    await this.workspaces.assertMembership(userId, dto.workspaceId);

    const totalAmount = dto.totalAmount;
    const advanceAmount = dto.advanceAmount ?? 0;
    const balanceAmount = totalAmount - advanceAmount;

    const booking = await this.prisma.booking.create({
      data: {
        workspaceId: dto.workspaceId,
        bookingTitle: dto.bookingTitle,
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        clientEmail: dto.clientEmail,
        eventType: dto.eventType,
        eventDate: new Date(dto.eventDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        location: dto.location,
        packageName: dto.packageName,
        totalAmount,
        advanceAmount,
        balanceAmount,
        paymentStatus: this.derivePaymentStatus(totalAmount, advanceAmount),
        createdByUserId: userId,
      },
    });

    return serializeBooking(booking);
  }

  async findAll(
    userId: string,
    query: BookingQueryDto,
  ): Promise<PaginatedResult<BookingResponse>> {
    await this.workspaces.assertMembership(userId, query.workspaceId);

    const where: Prisma.BookingWhereInput = { workspaceId: query.workspaceId };

    if (query.status) where.bookingStatus = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.workProgressStatus)
      where.workProgressStatus = query.workProgressStatus;

    if (query.eventDate) {
      const start = new Date(query.eventDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.eventDate = { gte: start, lt: end };
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { bookingTitle: { contains: term, mode: "insensitive" } },
        { clientName: { contains: term, mode: "insensitive" } },
        { clientPhone: { contains: term, mode: "insensitive" } },
        { clientEmail: { contains: term, mode: "insensitive" } },
        { location: { contains: term, mode: "insensitive" } },
        { eventType: { contains: term, mode: "insensitive" } },
      ];
    }

    const [total, bookings] = await this.prisma.$transaction([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        orderBy: { eventDate: "desc" },
        skip: query.skip,
        take: query.limit,
      }),
    ]);

    return {
      data: bookings.map(serializeBooking),
      pagination: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findOne(userId: string, id: string): Promise<BookingResponse> {
    const booking = await this.getAccessibleBooking(userId, id);
    return serializeBooking(booking);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateBookingDto,
  ): Promise<BookingResponse> {
    const existing = await this.getAccessibleBooking(userId, id);

    const data: Prisma.BookingUpdateInput = {
      bookingTitle: dto.bookingTitle,
      clientName: dto.clientName,
      clientPhone: dto.clientPhone,
      clientEmail: dto.clientEmail,
      eventType: dto.eventType,
      startTime: dto.startTime,
      endTime: dto.endTime,
      location: dto.location,
      packageName: dto.packageName,
      notes: dto.notes,
    };

    if (dto.eventDate !== undefined) data.eventDate = new Date(dto.eventDate);

    // Recalculate money fields when either amount changes.
    if (dto.totalAmount !== undefined || dto.advanceAmount !== undefined) {
      const totalAmount = dto.totalAmount ?? existing.totalAmount.toNumber();
      const advanceAmount =
        dto.advanceAmount ?? existing.advanceAmount.toNumber();

      if (advanceAmount > totalAmount) {
        throw new BadRequestException(
          "totalAmount must be greater than or equal to advanceAmount",
        );
      }

      data.totalAmount = totalAmount;
      data.advanceAmount = advanceAmount;
      data.balanceAmount = totalAmount - advanceAmount;
      data.paymentStatus = this.derivePaymentStatus(totalAmount, advanceAmount);
    }

    return serializeBooking(
      await this.updateAccessibleBooking(userId, id, data),
    );
  }

  async updateStatus(
    userId: string,
    id: string,
    dto: UpdateBookingStatusDto,
  ): Promise<BookingResponse> {
    return serializeBooking(
      await this.updateAccessibleBooking(userId, id, {
        bookingStatus: dto.bookingStatus,
      }),
    );
  }

  async updateWorkProgress(
    userId: string,
    id: string,
    dto: UpdateWorkProgressDto,
  ): Promise<BookingResponse> {
    return serializeBooking(
      await this.updateAccessibleBooking(userId, id, {
        workProgressStatus: dto.workProgressStatus,
      }),
    );
  }

  async cancel(
    userId: string,
    id: string,
    dto: CancelBookingDto,
  ): Promise<BookingResponse> {
    return serializeBooking(
      await this.updateAccessibleBooking(userId, id, {
        bookingStatus: "CANCELLED",
        cancellationReason: dto.reason,
      }),
    );
  }

  /**
   * Multi-tenant scope for single-resource routes: the booking id *and* proof
   * that the caller is a member of its workspace, expressed as one filter so
   * the database enforces both in a single round-trip. A booking in another
   * workspace simply does not match, so it is reported as missing exactly like
   * a genuinely absent one — no existence leak.
   */
  private accessibleBookingWhere(
    userId: string,
    id: string,
  ): Prisma.BookingWhereUniqueInput {
    return { id, workspace: { members: { some: { userId } } } };
  }

  /**
   * Loads a booking the user is allowed to see, or throws 404.
   */
  private async getAccessibleBooking(
    userId: string,
    id: string,
  ): Promise<Booking> {
    const booking = await this.prisma.booking.findFirst({
      where: this.accessibleBookingWhere(userId, id),
    });
    if (!booking) {
      throw new NotFoundException("Booking not found");
    }
    return booking;
  }

  /**
   * Writes to a booking the user is allowed to modify. The access check rides
   * along in the UPDATE's WHERE clause: no match means either the booking does
   * not exist or it belongs to someone else's workspace, and Prisma's P2025
   * covers both — the same 404 the read path returns.
   */
  private async updateAccessibleBooking(
    userId: string,
    id: string,
    data: Prisma.BookingUpdateInput,
  ): Promise<Booking> {
    try {
      return await this.prisma.booking.update({
        where: this.accessibleBookingWhere(userId, id),
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException("Booking not found");
      }
      throw error;
    }
  }

  private derivePaymentStatus(
    totalAmount: number,
    advanceAmount: number,
  ): PaymentStatus {
    if (advanceAmount <= 0) return PaymentStatus.UNPAID;
    if (advanceAmount >= totalAmount) return PaymentStatus.FULLY_PAID;
    return PaymentStatus.PARTIALLY_PAID;
  }
}
