import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "./common/decorators/response-message.decorator";

@ApiTags("Health")
@Controller()
export class AppController {
  @Get("health")
  @ResponseMessage("Service healthy")
  @ApiOperation({ summary: "Liveness/health check" })
  health() {
    return {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
