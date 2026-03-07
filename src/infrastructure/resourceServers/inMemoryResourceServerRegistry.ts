import type { ResourceServerRegistry } from "@domain/tokenExchange/ports.ts";
import type { ResourceServerProfile } from "@domain/tokenExchange/types.ts";

export class InMemoryResourceServerRegistry implements ResourceServerRegistry {
	constructor(private readonly profiles: ResourceServerProfile[]) {}

	findByAudience(audience: string): ResourceServerProfile | undefined {
		return this.profiles.find((profile) => profile.audience === audience);
	}
}
