import Token from './token';

export default abstract class TokenDecorator extends Token {
	protected readonly innerToken: Token;

	constructor(token: Token) {
		super();
		this.innerToken = token;
	}
}