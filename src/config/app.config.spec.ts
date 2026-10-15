import appConfig from "./app.config";

/**
 * The guard that matters: no secret, no boot. Previously JWT_SECRET fell back
 * to a public constant and the app signed forgeable tokens happily.
 */
describe("appConfig", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://user:pw@localhost/db";
    process.env.JWT_SECRET = "a-real-secret";
  });

  afterAll(() => {
    process.env = original;
  });

  it("reads the configured values", () => {
    const config = appConfig();
    expect(config.jwtSecret).toBe("a-real-secret");
    expect(config.databaseUrl).toBe("postgresql://user:pw@localhost/db");
  });

  it.each(["JWT_SECRET", "DATABASE_URL"])(
    "refuses to start without %s",
    (name) => {
      delete process.env[name];
      expect(() => appConfig()).toThrow(name);
    },
  );

  it("refuses an empty value just as firmly", () => {
    process.env.JWT_SECRET = "";
    expect(() => appConfig()).toThrow("JWT_SECRET");
  });
});
