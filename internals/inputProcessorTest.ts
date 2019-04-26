import { createInputProcessor, InputProcessorFunction, UserInputType } from './inputProcessor';

test('Process a simple numeric mask', () => {
	const inputProcessor = createInputProcessor('00000 0000');
	const inputKeys = ['0', '1', '2', '3', '4', ' ', '5', '6', '7', '8'];
	const expectedOutputs = ['0', '01', '012', '0123', '01234', '01234 ', '01234 5', '01234 56', '01234 567', '01234 5678'];
	const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);

	expect(outputValues).toEqual(expectedOutputs);
});

test('Process a mask autocompleting a literal value if it is not optional', () => {
	const inputProcessor = createInputProcessor('\\90000 0000');
	const inputKeys = ['0', '1', '2', '3', '5', '6', '7', '8'];
	const expectedOutputs = ['90', '901', '9012', '90123', '90123 5', '90123 56', '90123 567', '90123 5678'];
	const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);

	expect(outputValues).toEqual(expectedOutputs);
});

test('Process a mask with optional values setting the optional value', () => {
	const inputProcessor = createInputProcessor('00000? 0000');
	const inputKeys = ['0', '1', '2', '3', '4', ' ', '5', '6', '7', '8'];
	const expectedOutputs = ['0', '01', '012', '0123', '01234', '01234 ', '01234 5', '01234 56', '01234 567', '01234 5678'];
	const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);

	expect(outputValues).toEqual(expectedOutputs);
});

test('Process a mask with optional values without setting the optional value', () => {
	const inputProcessor = createInputProcessor('\\9?0000 0000');
	const inputKeys = ['0', '1', '2', '5', '5', '6', '7', '8'];
	const expectedOutputs = ['0', '01', '012', '0125', '0125 5', '0125 56', '0125 567', '0125 5678'];
	const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);

	expect(outputValues).toEqual(expectedOutputs);
});

test('Process a mask that starts with a literal value and user doesnt fill it up', () => {
	const inputProcessor = createInputProcessor('+55 00');
	const inputKeys = ['1', '1'];
	const expectedOutputs = ['+55 1', '+55 11'];
	const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);

	expect(outputValues).toEqual(expectedOutputs);
});

test('Skip optional literal after autocompletable token if input doesnt match', () => {
	const inputProcessor = createInputProcessor('+55 00 9?0000-0000');
	const inputKeys = ['1', '2', '3'];
	const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);

	expect(outputValues).toEqual(['+55 1', '+55 12', '+55 12 3']);
});

test('Go back to previous value if input is bigger than number of tokens', () => {
	const inputProcessor = createInputProcessor('+55 00 9?0000-0000');
	const inputKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '1'];
	const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);

	expect(outputValues).toEqual([
		'+55 1', '+55 12', '+55 12 3', '+55 12 34', '+55 12 345', '+55 12 3456', '+55 12 3456-7', '+55 12 3456-78', '+55 12 3456-789', '+55 12 3456-7890', '+55 12 3456-7890'
	]);
});

test('Mask with dots', () => {
	const inputProcessor = createInputProcessor('00.0-0');
	const inputKeys = ['1', '2', '3', '4'];
	const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);
	const expectedOutputs = ['1', '12', '12.3', '12.3-4'];

	expect(outputValues).toEqual(expectedOutputs);
});

test('Mask with fast input of invalid symbols', () => {
	const inputProcessor = createInputProcessor('0000');
	const inputKeys = ['ha', '0', 'h'];
	const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);
	expect(outputValues).toEqual(['', '0', '0']);
});

test('Mask with full value pasted', () => {
	const inputProcessor = createInputProcessor('+55 9 0000 0000');
	const inputKeys= ['12345678'];
	const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);
	expect(outputValues).toEqual(['+55 9 1234 5678']);
});

test('Edit wrong value in middle of masked value', () => {
	const inputProcessor = createInputProcessor('+55 (00) 9 0000 0000');
	const inputValues = ['+55 (12) 9 12345 678'];
	const outputValues = enterValuesOneAtTime(inputValues, inputProcessor);
	expect(outputValues).toEqual(['+55 (12) 9 1234 5678']);
});

test('Change mask on the fly and value is bigger than mask', () => {
	const inputProcessor = createInputProcessor('+595 00 0000000');
	const inputValues = ['+55 (11) 9 8765-4321'];
	const outputValues = enterValuesOneAtTime(inputValues, inputProcessor);
	expect(outputValues).toEqual(['+595 11 9876543']);
});

function pressKeysOneAtTime(keys: string[], inputProcessor: InputProcessorFunction): string[] {
	let currentValue = '';
	const outputValues = [];
	for (const key of keys) {
		const currentInput = currentValue + key;
		currentValue = inputProcessor(currentInput, UserInputType.INSERTION);
		outputValues.push(currentValue);
	}

	return outputValues;
}

function enterValuesOneAtTime(values: string[], inputProcessor: InputProcessorFunction): string[] {
	return values.map((value) => inputProcessor(value, UserInputType.INSERTION));
}