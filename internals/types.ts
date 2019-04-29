export interface IMaskToken {
	token: string;
	literal: boolean;
	optional: boolean;
}

export interface ITokenRegex {
	text: string;
	regex: string;
	literal: boolean;
	optional: boolean;
}

export interface IMaskedTextResult {
	text: string;
	complete: boolean;
}