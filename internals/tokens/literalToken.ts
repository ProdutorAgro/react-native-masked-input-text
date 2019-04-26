import Token from './token';

const charsNeedEscaping: string[] = ['(', ')', '+', '*', '.', '[', ']', '?'];

export default class LiteralToken extends Token {
	private readonly tokenValue: string;

	constructor(tokenValue: string) {
		super();
		this.tokenValue = tokenValue;
	}

	public getRegex(): string {
		const escapingChar = this.needsEscaping() ? '\\' : '';
		return `${escapingChar}${this.tokenValue}`;
	}

	private needsEscaping(): boolean {
		return charsNeedEscaping.includes(this.tokenValue);
	}
}