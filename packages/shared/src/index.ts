export * from "./enums";
export * from "./dates";
export * from "./scoring";
export * from "./types";

/** Server-enforced limits, shared so the client can pre-validate / disable UI. */
export const NEUTRAL_DAYS_PER_MONTH = 2;
export const MAX_TITLE_LEN = 120;
export const MAX_NOTE_LEN = 280;
export const MAX_UNIT_LEN = 24;
