import { SetMetadata } from "@nestjs/common";

export const RESPONSE_MESSAGE_KEY = "response_message";

/**
 * Attaches a human-readable success message to a route handler.
 * Picked up by ResponseInterceptor and placed in the `message` field.
 */
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);
