/**
 * @fileoverview Email subsystem entrypoint.
 * Re-exports providers, service, templates, and encryption utilities.
 * @server-only
 */
export * from "./provider";
export * from "./resend";
export * from "./gmail";
export * from "./nodemailer";
export * from "./encryption";
export * from "./service";
export * from "./templates";
