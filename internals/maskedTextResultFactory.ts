import { ITokenRegex, IMaskedTextResult } from './types';

export default class MaskedTextResultFactory {

	private completenessRegex: string;

	constructor(tokensRegex: ITokenRegex[]) {
		this.completenessRegex = tokensRegex.reduce((maskRegex, tokenRegex) => maskRegex + tokenRegex.regex, '');
	}

	public create(text: string): IMaskedTextResult {
		const x = text.match(this.completenessRegex);
		const isComplete = !!x;
		return {
			text,
			complete: isComplete
		};
	}
}