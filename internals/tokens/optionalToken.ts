import TokenDecorator from './tokenDecorator';

export default class OptionalToken extends TokenDecorator {
	public getRegex(): string {
		return `(${this.innerToken.getRegex()})?`;
	}
}