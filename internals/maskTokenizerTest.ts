import { tokenize, getTokens } from './maskTokenizer';
import { IMaskToken } from './types';

function createToken(token: string, optional: boolean = false, literal: boolean = false): IMaskToken {
	return {
		token,
		optional,
		literal
	};
}

test('Tokenize simple mask', () => {
	const tokens = getTokens('0000-0000');
	expect(tokens).toEqual([
		createToken('0'),
		createToken('0'),
		createToken('0'),
		createToken('0'),
		createToken('-', false, true),
		createToken('0'),
		createToken('0'),
		createToken('0'),
		createToken('0')
	]);
});

test('Tokenize mask with escaped chars', () => {
	const tokens = getTokens('+\\5\\5 0000-0000');
	expect(tokens).toEqual([
		createToken('+', false, true),
		createToken('5', false, true),
		createToken('5', false, true),
		createToken(' ', false, true),
		createToken('0'),
		createToken('0'),
		createToken('0'),
		createToken('0'),
		createToken('-', false, true),
		createToken('0'),
		createToken('0'),
		createToken('0'),
		createToken('0')
	]);
});

test('Tokenize mask with optional chars', () => {
	const tokens = getTokens('0?0000 0000');
	expect(tokens).toEqual([
		createToken('0', true),
		createToken('0'),
		createToken('0'),
		createToken('0'),
		createToken('0'),
		createToken(' ', false, true),
		createToken('0'),
		createToken('0'),
		createToken('0'),
		createToken('0')
	]);
});

test('Tokenize mask with a literal character that is also optional', () => {
	const tokens = getTokens('\\9? 0000-0000');
	expect(tokens).toEqual([
		createToken('9', true, true),
		createToken(' ', false, true),
		createToken('0'),
		createToken('0'),
		createToken('0'),
		createToken('0'),
		createToken('-', false, true),
		createToken('0'),
		createToken('0'),
		createToken('0'),
		createToken('0'),
	]);
});

test('Tokenize mask with implicit literal character', () => {
	const tokens = getTokens('0000 0000');
	expect(tokens).toEqual([
		createToken('0'),
		createToken('0'),
		createToken('0'),
		createToken('0'),
		createToken(' ', false, true),
		createToken('0'),
		createToken('0'),
		createToken('0'),
		createToken('0'),
	]);
});

test('Tokenize optional implicit literal', () => {
	const tokens = getTokens('+55 9?0.0');
	expect(tokens).toEqual([
		createToken('+', false, true),
		createToken('5', false, true),
		createToken('5', false, true),
		createToken(' ', false, true),
		createToken('9', true, true),
		createToken('0', false, false),
		createToken('.', false, true),
		createToken('0', false, false)
	]);
});

test('Tokenize literal question mark token', () => {
	const tokens = getTokens('+55\\?');
	expect(tokens).toEqual([
		createToken('+', false, true),
		createToken('5', false, true),
		createToken('5', false, true),
		createToken('?', false, true),
	]);
});