import { getTokens } from './maskTokenizer';
import { createRegexFromToken } from './maskRegexCreator';
import { IMaskedTextResult, IMaskToken, ITokenRegex } from './types';
import MaskedTextResultFactory from './maskedTextResultFactory';

export enum UserInputType {
	INSERTION,
	DELETION
}

interface InputProcessorOptions {
	regexes: ITokenRegex[];
}

interface IMaskResult {
	text: string;
	numberConsumedTokens: number;
	valid: boolean;
}

interface IAutoCompleteResult {
	text: string;
	numberTokensConsumed: number;
	inputWasIgnored: boolean;
}

export type InputProcessorFunction = (value: string, inputType: UserInputType) => IMaskedTextResult;

export function createInputProcessor(mask: string): InputProcessorFunction {
	const tokens = getTokens(mask);
	const regexes = createTokenRegexes(tokens);
	const maskTextResultFactory = new MaskedTextResultFactory(regexes);
	const inputProcessorOptions = {
		regexes
	};

	return (value: string, inputType: UserInputType): IMaskedTextResult => {
		let appliedMask: IMaskResult;
		let numberTokensConsumed = 0;
		let lastIterationValue = '';
		for (let index = 0; index < value.length; index++) {
			const currentChar = value.charAt(index);
			const currentValue = lastIterationValue + currentChar;
			appliedMask = processUserInput(currentValue, inputType, inputProcessorOptions, numberTokensConsumed);
			numberTokensConsumed += appliedMask.numberConsumedTokens;
			lastIterationValue = appliedMask.text;
			if (!appliedMask.valid) {
				return maskTextResultFactory.create(appliedMask.text);
			}
		}

		const text = appliedMask ? appliedMask.text : '';
		return maskTextResultFactory.create(text);
	};
}

function createTokenRegexes(tokens: IMaskToken[]): ITokenRegex[] {
	const tokenRegexes = [];
	for (const token of tokens) {
		const regex = createRegexFromToken(token);
		const tokenRegex: ITokenRegex = {
			text: token.token,
			literal: token.literal,
			optional: token.optional,
			regex
		};
		tokenRegexes.push(tokenRegex);
	}
	return tokenRegexes;
}

function processUserInput(value: string, inputType: UserInputType, options: InputProcessorOptions, currentIndex: number = 0): IMaskResult {
	let numberTokensConsumed = 1;
	let previousValue = value.substr(0, value.length-1);
	const currentCharPosition = value.length-1;
	const currentRegexPosition = currentIndex || currentCharPosition;

	const currentChar = value[currentCharPosition];
	let currentRegex = options.regexes[currentRegexPosition];

	if (value.length > options.regexes.length || !currentRegex) {
		return createMaskResult(previousValue, previousValue.length-1, false);
	}

	const autoCompleteResults = autofillNextChars(currentChar, inputType, options.regexes, currentRegexPosition);
	const numberTokensAutoCompleted = autoCompleteResults.numberTokensConsumed;
	if (numberTokensAutoCompleted > 0) {
		previousValue += autoCompleteResults.text;
		currentRegex = options.regexes[currentRegexPosition + numberTokensAutoCompleted];
		numberTokensConsumed += numberTokensAutoCompleted;
	}

	if (autoCompleteResults.inputWasIgnored) {
		return createMaskResult(previousValue, 0);
	}

	if (currentCharMatchesRegex(currentChar, currentRegex)) {
		const newValue = previousValue + currentChar;
		return createMaskResult(newValue, numberTokensConsumed);
	}

	return createMaskResult(previousValue, numberTokensConsumed, false);
}

function createMaskResult(maskedValue: string, numberConsumedTokens: number, valid: boolean = true): IMaskResult {
	return { text: maskedValue, numberConsumedTokens: numberConsumedTokens, valid: valid };
}

function autofillNextChars(currentChar: string, inputType: UserInputType, tokens: ITokenRegex[], currentTokenIndex: number): IAutoCompleteResult {
	let autoFilledValue = '';
	let numberSuccessfulIterations = 0;
	let autoCompleted;
	let currentToken = tokens[currentTokenIndex];
	let currentIndex = currentTokenIndex;
	let inputWasIgnored = false;
	do {
		if (canNextCharBeAutoCompleted(currentChar, inputType, currentToken)) {
			autoFilledValue += currentToken.text;
			currentToken = tokens[currentIndex + 1];
			autoCompleted = true;
			numberSuccessfulIterations++;
			currentIndex++;
		} else if (canNextCharBeSkipped(currentChar, inputType, currentToken)) {
			currentToken = tokens[currentIndex + 1];
			autoCompleted = true;
			numberSuccessfulIterations++;
			currentIndex++;
		} else if (canCurrentCharBeRemovedFromInput(currentChar, inputType, currentToken)) {
			autoFilledValue = '';
			inputWasIgnored = true;
			autoCompleted = false;
		} else {
			autoCompleted = false;
		}
	} while (autoCompleted);

	return {
		numberTokensConsumed: numberSuccessfulIterations,
		text: autoFilledValue,
		inputWasIgnored: inputWasIgnored
	};
}

function canNextCharBeSkipped(currentChar: string, inputType: UserInputType, currentToken: ITokenRegex): boolean {
	return (
		inputType === UserInputType.INSERTION &&
		currentToken.literal &&
		currentToken.optional &&
		!currentCharMatchesRegex(currentChar, currentToken)
	);
}

function canNextCharBeAutoCompleted(currentChar: string, inputType: UserInputType, currentToken: ITokenRegex): boolean {
	return (
		inputType === UserInputType.INSERTION &&
		currentToken.literal &&
		!currentToken.optional &&
		!currentCharMatchesRegex(currentChar, currentToken)
	);
}

function canCurrentCharBeRemovedFromInput(currentChar: string, inputType: UserInputType, currentToken: ITokenRegex): boolean {
	return (
		inputType === UserInputType.INSERTION &&
		!currentToken.literal &&
		!currentCharMatchesRegex(currentChar, currentToken)
	);
}

function currentCharMatchesRegex(currentChar: string, token: ITokenRegex): boolean {
	const match = currentChar.match(token.regex);
	return (match && match[0] === currentChar);
}