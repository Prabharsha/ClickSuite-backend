/**
 * Centralised, typed access to environment configuration.
 * Registered with @nestjs/config so it can be injected anywhere via ConfigService.
 */
export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  frontendUrl: string;
  bcryptSaltRounds: number;
}

/**
 * Secrets have no safe default: a fallback JWT secret means the app happily
 * signs tokens anyone can forge. Throwing here fails AppModule construction,
 * so the process exits at boot instead of serving traffic it cannot secure.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Refusing to start: set it in the environment.`,
    );
  }
  return value;
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "10", 10),
});
