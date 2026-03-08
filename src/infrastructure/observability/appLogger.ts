export type LogLevel = "debug" | "info" | "warn" | "error";

const rank: Record<LogLevel, number> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40,
};

function parseLogLevel(input: string | undefined): LogLevel {
	if (
		input === "debug" ||
		input === "info" ||
		input === "warn" ||
		input === "error"
	) {
		return input;
	}
	return "info";
}

export type LogContext = Record<string, unknown>;

export class AppLogger {
	private readonly minLevel: LogLevel;

	constructor(minLevel: LogLevel) {
		this.minLevel = minLevel;
	}

	static fromEnv(): AppLogger {
		return new AppLogger(parseLogLevel(process.env.LOG_LEVEL));
	}

	debug(message: string, context: LogContext = {}): void {
		this.log("debug", message, context);
	}

	info(message: string, context: LogContext = {}): void {
		this.log("info", message, context);
	}

	warn(message: string, context: LogContext = {}): void {
		this.log("warn", message, context);
	}

	error(message: string, context: LogContext = {}): void {
		this.log("error", message, context);
	}

	private log(level: LogLevel, message: string, context: LogContext): void {
		if (rank[level] < rank[this.minLevel]) {
			return;
		}

		const event = {
			ts: new Date().toISOString(),
			level,
			message,
			...context,
		};

		const line = JSON.stringify(event);
		if (level === "error") {
			console.error(line);
			return;
		}
		if (level === "warn") {
			console.warn(line);
			return;
		}
		console.log(line);
	}
}

export const logger = AppLogger.fromEnv();
