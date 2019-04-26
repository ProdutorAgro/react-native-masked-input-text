import TokenDecorator from './tokenDecorator';
export default class OptionalToken extends TokenDecorator {
    getRegex() {
        return `(${this.innerToken.getRegex()})?`;
    }
}
//# sourceMappingURL=optionalToken.js.map