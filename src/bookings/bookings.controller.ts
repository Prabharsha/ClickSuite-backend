import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ResponseMessage } from "../common/decorators/response-message.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { BookingsService } from "./bookings.service";
import { BookingQueryDto } from "./dto/booking-query.dto";
import { CancelBookingDto } from "./dto/cancel-booking.dto";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";
import { UpdateBookingDto } from "./dto/update-booking.dto";
import { UpdateWorkProgressDto } from "./dto/update-work-progress.dto";

@ApiTags("Bookings")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ResponseMessage("Booking created successfully")
  @ApiOperation({ summary: "Create a booking in a workspace you belong to" })
  create(@CurrentUser("id") userId: string, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(userId, dto);
  }

  @Get()
  @ResponseMessage("Bookings fetched successfully")
  @ApiOperation({
    summary:
      "List bookings for a workspace (paginated, filterable, searchable)",
  })
  findAll(@CurrentUser("id") userId: string, @Query() query: BookingQueryDto) {
    return this.bookingsService.findAll(userId, query);
  }

  @Get(":id")
  @ResponseMessage("Booking fetched successfully")
  @ApiOperation({
    summary:
      "Get a single booking. Access is validated against the booking workspace.",
  })
  findOne(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.bookingsService.findOne(userId, id);
  }

  @Patch(":id")
  @ResponseMessage("Booking updated successfully")
  @ApiOperation({ summary: "Update editable fields of a booking" })
  update(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookingsService.update(userId, id, dto);
  }

  @Patch(":id/status")
  @ResponseMessage("Booking status updated successfully")
  @ApiOperation({ summary: "Update the booking status" })
  updateStatus(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(userId, id, dto);
  }

  @Patch(":id/work-progress")
  @ResponseMessage("Work progress updated successfully")
  @ApiOperation({ summary: "Update the work progress status" })
  updateWorkProgress(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateWorkProgressDto,
  ) {
    return this.bookingsService.updateWorkProgress(userId, id, dto);
  }

  @Patch(":id/cancel")
  @ResponseMessage("Booking cancelled successfully")
  @ApiOperation({ summary: "Soft-cancel a booking (sets status to CANCELLED)" })
  cancel(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancel(userId, id, dto);
  }
}
