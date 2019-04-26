import LiteralToken from './tokens/literalToken';
import SimpleToken from './tokens/simpleToken';
import OptionalToken from './tokens/optionalToken';
export function createRegexFromToken(token) {
    let tokenObject;
    if (token.literal) {
        tokenObject = new LiteralToken(token.token);
    }
    else {
        tokenObject = new SimpleToken(token.token);
    }
    if (token.optional) {
        tokenObject = new OptionalToken(tokenObject);
    }
    return tokenObject.getRegex();
}
export function createMaskRegex(tokens) {
    const regexes = tokens.map(createRegexFromToken);
    return regexes.reduce((maskRegex, tokenRegex) => maskRegex + tokenRegex, '');
}
//# sourceMappingURL=maskRegexCreator.js.map