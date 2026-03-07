import type {
	IncomingTokenValidator,
	IncomingTokenValidatorRegistry,
} from "@domain/tokenExchange/ports.ts";

export class InMemoryIncomingTokenValidatorRegistry
	implements IncomingTokenValidatorRegistry
{
	constructor(private readonly validators: IncomingTokenValidator[]) {}

	resolve(tokenType: string): IncomingTokenValidator | undefined {
		return this.validators.find((validator) => validator.supports(tokenType));
	}
}
