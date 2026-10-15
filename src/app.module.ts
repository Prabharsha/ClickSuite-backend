import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import appConfig from "./config/app.config";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { WorkspacesModule } from "./workspaces/workspaces.module";
import { BookingsModule } from "./bookings/bookings.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig],
    }),
    // Rate limiting. ThrottlerGuard is applied per route (see AuthController),
    // not globally, so only the endpoints that need a limit carry one.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    BookingsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
