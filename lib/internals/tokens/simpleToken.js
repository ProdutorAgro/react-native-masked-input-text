import Token from './token';
export default class SimpleToken extends Token {
    constructor(tokenValue) {
        super();
        this.tokenValue = tokenValue;
    }
    getRegex() {
        switch (this.tokenValue) {
            case '0': return '[0-9]';
            case 'x': return '[a-z]';
            case 'X': return '[A-Z]';
            case 's': return '[a-zA-Z]';
            case 'a': return '[a-zA-Z0-9]';
            default: return `\\${this.tokenValue}`;
        }
    }
}
//# sourceMappingURL=simpleToken.js.map