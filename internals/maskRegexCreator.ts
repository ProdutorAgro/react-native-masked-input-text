import { IMaskToken } from './types';
import Token from './tokens/token';
import LiteralToken from './tokens/literalToken';
import SimpleToken from './tokens/simpleToken';
import OptionalToken from './tokens/optionalToken';

export function createRegexFromToken(token: IMaskToken): string {
	let tokenObject: Token;
	if (token.literal) {
		tokenObject = new LiteralToken(token.token);
	} else {
		tokenObject = new SimpleToken(token.token);
	}

	if (token.optional) {
		tokenObject = new OptionalToken(tokenObject);
	}

	return tokenObject.getRegex();
}

export function createMaskRegex(tokens: IMaskToken[]): string {
	const regexes = tokens.map(createRegexFromToken);

	return regexes.reduce((maskRegex, tokenRegex) => maskRegex + tokenRegex, '');
}