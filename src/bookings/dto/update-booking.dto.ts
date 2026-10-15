import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateBookingDto } from "./create-booking.dto";

/**
 * Editable booking fields: every create field except `workspaceId` (a booking
 * never moves workspace) and the status fields, which were never part of
 * create: those move through the dedicated status / work-progress / cancel
 * endpoints.
 *
 * Derived from CreateBookingDto so the field rules (length caps, HH:MM times,
 * endTime > startTime) are written once and cannot drift between the two
 * routes that write the same columns. Cross-field money validation still runs
 * in the service after merging with the persisted values, since a partial
 * update may send only one of the two amounts.
 */
export class UpdateBookingDto extends PartialType(
  OmitType(CreateBookingDto, ["workspaceId"] as const),
) {}
