import Token from './token';
const charsNeedEscaping = ['(', ')', '+', '*', '.', '[', ']', '?'];
export default class LiteralToken extends Token {
    constructor(tokenValue) {
        super();
        this.tokenValue = tokenValue;
    }
    getRegex() {
        const escapingChar = this.needsEscaping() ? '\\' : '';
        return `${escapingChar}${this.tokenValue}`;
    }
    needsEscaping() {
        return charsNeedEscaping.includes(this.tokenValue);
    }
}
//# sourceMappingURL=literalToken.js.map