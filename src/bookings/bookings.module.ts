import { Module } from "@nestjs/common";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";

@Module({
  imports: [WorkspacesModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
