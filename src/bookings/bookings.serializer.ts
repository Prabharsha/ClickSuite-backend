import { Booking } from "@prisma/client";

/**
 * Client-facing booking shape. Prisma Decimal fields are converted to plain
 * numbers and dates to ISO strings so the frontend receives clean JSON.
 */
export interface BookingResponse {
  id: string;
  workspaceId: string;
  bookingTitle: string;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  eventType: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  packageName: string | null;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  bookingStatus: Booking["bookingStatus"];
  paymentStatus: Booking["paymentStatus"];
  workProgressStatus: Booking["workProgressStatus"];
  notes: string | null;
  cancellationReason: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export function serializeBooking(booking: Booking): BookingResponse {
  return {
    id: booking.id,
    workspaceId: booking.workspaceId,
    bookingTitle: booking.bookingTitle,
    clientName: booking.clientName,
    clientPhone: booking.clientPhone,
    clientEmail: booking.clientEmail,
    eventType: booking.eventType,
    eventDate: booking.eventDate.toISOString(),
    startTime: booking.startTime,
    endTime: booking.endTime,
    location: booking.location,
    packageName: booking.packageName,
    totalAmount: booking.totalAmount.toNumber(),
    advanceAmount: booking.advanceAmount.toNumber(),
    balanceAmount: booking.balanceAmount.toNumber(),
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    workProgressStatus: booking.workProgressStatus,
    notes: booking.notes,
    cancellationReason: booking.cancellationReason,
    createdByUserId: booking.createdByUserId,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}
