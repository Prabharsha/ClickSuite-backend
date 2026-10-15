import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory, Reflector } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { httpLogger } from "./common/middleware/http-logger.middleware";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });
  const config = app.get(ConfigService);
  const logger = new Logger("Bootstrap");

  // All routes under /api
  app.setGlobalPrefix("api");

  // Security headers
  app.use(helmet());

  // Behind Railway's edge proxy, so the client IP arrives in X-Forwarded-For.
  // Without this every request looks like it comes from the proxy and the
  // auth rate limiter degrades into one global bucket.
  // ponytail: single trusted hop; raise the count if more proxies are added.
  app.set("trust proxy", 1);

  // Request/response logging (method, url, status, duration, userId)
  app.use(httpLogger);

  // CORS restricted to the configured frontend origin(s)
  const frontendUrl =
    config.get<string>("frontendUrl") ?? "http://localhost:3000";
  const allowedOrigins = [frontendUrl, "https://clicksuite.app"];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    // Let the browser cache the preflight for 24h. Without this every single
    // API call is preceded by its own OPTIONS round-trip.
    maxAge: 86400,
  });

  // Global validation: strip unknown props, reject extras, transform payloads
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Standard response envelope + centralised error handling
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger / OpenAPI at /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle("ClickSuite API")
    .setDescription("Booking & studio-management SaaS API")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get<number>("port") ?? 4000;
  const nodeEnv = config.get<string>("nodeEnv") ?? "development";
  await app.listen(port, "0.0.0.0");
  logger.log(`ClickSuite backend started [env=${nodeEnv}]`);
  logger.log(`API listening on http://localhost:${port}/api`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
  logger.log(`CORS allowed origins: ${allowedOrigins.join(", ")}`);
}

void bootstrap();
