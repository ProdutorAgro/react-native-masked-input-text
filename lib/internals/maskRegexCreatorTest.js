import { createMaskRegex } from './maskRegexCreator';
import { getTokens } from './maskTokenizer';
test('Create regex for simple mask', () => {
    const tokens = getTokens('0000 0000');
    const regex = createMaskRegex(tokens);
    const validInputs = [
        '1234 5678',
        '9876 5432'
    ];
    const invalidInputs = [
        '123a 4567',
        '12345678'
    ];
    testRegex(regex, validInputs, invalidInputs);
});
test('Create regex for mask with literal values', () => {
    const tokens = getTokens('+\\0\\0 0000 0000');
    const regex = createMaskRegex(tokens);
    const validInputs = [
        '+00 1234 5678',
        '+00 9876 5432'
    ];
    const invalidInputs = [
        '+99 1234 4567',
        '+aa 12345678',
        '1234 5678'
    ];
    testRegex(regex, validInputs, invalidInputs);
});
test('Create regex for mask with optional values', () => {
    const tokens = getTokens('+00 00000? 0000');
    const regex = createMaskRegex(tokens);
    const validInputs = [
        '+55 1234 5678',
        '+88 98760 5432'
    ];
    const invalidInputs = [
        '+99 1234a 4567',
        '+00 12345678',
        '+13 123a 5678'
    ];
    testRegex(regex, validInputs, invalidInputs);
});
test('Create regex for mask with optional literal values', () => {
    const tokens = getTokens('+00 ?\\9? 0000 0000');
    const regex = createMaskRegex(tokens);
    const validInputs = [
        '+55 9 1234 5678',
        '+88 8760 5432'
    ];
    const invalidInputs = [
        '+99 8 1234a 4567',
        '+00 a 12345678',
        '+13  9 123a 5678'
    ];
    testRegex(regex, validInputs, invalidInputs);
});
test('Create regex for mask containing literal question mark', () => {
    const tokens = getTokens('+55\\?0');
    const regex = createMaskRegex(tokens);
    const validInputs = [
        '+55?3',
        '+55?0'
    ];
    const invalidInputs = [
        '+553',
        '+53'
    ];
    testRegex(regex, validInputs, invalidInputs);
});
test('Create regex with multiple wildcards', () => {
    const tokens = getTokens('XX-xas000/1000');
    const regex = createMaskRegex(tokens);
    const validInputs = [
        'MG-abb123/1987',
        'SP-dBv321/1234',
        'RJ-k8s654/1875',
        'GO-l7P127/1458'
    ];
    const invalidInputs = [
        '01-abc123/1987',
        'SP-XBv321/1234',
        'RJ-k7s654/2875',
        'GO-l70127/1458'
    ];
    testRegex(regex, validInputs, invalidInputs);
});
function testRegex(regex, validInputs, invalidInputs) {
    for (const validInput of validInputs) {
        expect(validInput.match(regex)).toBeTruthy();
    }
    for (const invalidInput of invalidInputs) {
        expect(invalidInput.match(regex)).toBeFalsy();
    }
}
//# sourceMappingURL=maskRegexCreatorTest.js.map