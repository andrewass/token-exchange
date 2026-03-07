import type { Clock } from "@domain/tokenExchange/ports.ts";

export class SystemClock implements Clock {
	now(): Date {
		return new Date();
	}
}
