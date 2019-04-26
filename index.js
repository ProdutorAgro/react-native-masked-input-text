define("internals/types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("internals/maskTokenizer", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const specialCharacters = ['0', 'x', 'X', 's', 'a'];
    function getNextTokenLength(mask, startIndex) {
        const char = mask.charAt(startIndex);
        if (char === '\\') {
            const lookAhead = mask.charAt(startIndex + 2);
            if (lookAhead === '?') {
                return 3;
            }
            return 2;
        }
        const nextChar = mask.charAt(startIndex + 1);
        if (nextChar === '?') {
            return 2;
        }
        return 1;
    }
    function tokenize(mask) {
        const tokens = [];
        let currentIndex = 0;
        while (currentIndex < mask.length) {
            const nextTokenLength = getNextTokenLength(mask, currentIndex);
            const nextToken = mask.substr(currentIndex, nextTokenLength);
            tokens.push(nextToken);
            currentIndex += nextTokenLength;
        }
        return tokens;
    }
    exports.tokenize = tokenize;
    function createMaskTokenFromString(tokenString) {
        let realTokenValue = tokenString;
        const maskToken = {
            token: '',
            literal: false,
            optional: false
        };
        if (isLiteral(tokenString)) {
            realTokenValue = realTokenValue.substr(1);
            maskToken.literal = true;
            if (tokenString.length > 2 && isOptional(tokenString)) {
                realTokenValue = realTokenValue.substr(0, realTokenValue.length - 1);
                maskToken.optional = true;
            }
        }
        else if (isOptional(tokenString)) {
            realTokenValue = realTokenValue.replace('?', '');
            maskToken.optional = true;
        }
        maskToken.token = realTokenValue;
        if (isImplicitLiteral(maskToken.token)) {
            maskToken.literal = true;
        }
        return maskToken;
    }
    function isOptional(token) {
        return token.endsWith('?');
    }
    function isLiteral(token) {
        return token.startsWith('\\');
    }
    function isImplicitLiteral(token) {
        return !specialCharacters.includes(token);
    }
    function getTokens(mask) {
        const tokens = tokenize(mask);
        return tokens.map(createMaskTokenFromString);
    }
    exports.getTokens = getTokens;
});
define("internals/tokens/token", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Token {
    }
    exports.default = Token;
});
define("internals/tokens/literalToken", ["require", "exports", "internals/tokens/token"], function (require, exports, token_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const charsNeedEscaping = ['(', ')', '+', '*', '.', '[', ']', '?'];
    class LiteralToken extends token_1.default {
        constructor(tokenValue) {
            super();
            this.tokenValue = tokenValue;
        }
        getRegex() {
            const escapingChar = this.needsEscaping() ? '\\' : '';
            return `${escapingChar}${this.tokenValue}`;
        }
        needsEscaping() {
            return charsNeedEscaping.includes(this.tokenValue);
        }
    }
    exports.default = LiteralToken;
});
define("internals/tokens/simpleToken", ["require", "exports", "internals/tokens/token"], function (require, exports, token_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SimpleToken extends token_2.default {
        constructor(tokenValue) {
            super();
            this.tokenValue = tokenValue;
        }
        getRegex() {
            switch (this.tokenValue) {
                case '0': return '[0-9]';
                case 'x': return '[a-z]';
                case 'X': return '[A-Z]';
                case 's': return '[a-zA-Z]';
                case 'a': return '[a-zA-Z0-9]';
                default: return `\\${this.tokenValue}`;
            }
        }
    }
    exports.default = SimpleToken;
});
define("internals/tokens/tokenDecorator", ["require", "exports", "internals/tokens/token"], function (require, exports, token_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TokenDecorator extends token_3.default {
        constructor(token) {
            super();
            this.innerToken = token;
        }
    }
    exports.default = TokenDecorator;
});
define("internals/tokens/optionalToken", ["require", "exports", "internals/tokens/tokenDecorator"], function (require, exports, tokenDecorator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class OptionalToken extends tokenDecorator_1.default {
        getRegex() {
            return `(${this.innerToken.getRegex()})?`;
        }
    }
    exports.default = OptionalToken;
});
define("internals/maskRegexCreator", ["require", "exports", "internals/tokens/literalToken", "internals/tokens/simpleToken", "internals/tokens/optionalToken"], function (require, exports, literalToken_1, simpleToken_1, optionalToken_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createRegexFromToken(token) {
        let tokenObject;
        if (token.literal) {
            tokenObject = new literalToken_1.default(token.token);
        }
        else {
            tokenObject = new simpleToken_1.default(token.token);
        }
        if (token.optional) {
            tokenObject = new optionalToken_1.default(tokenObject);
        }
        return tokenObject.getRegex();
    }
    exports.createRegexFromToken = createRegexFromToken;
    function createMaskRegex(tokens) {
        const regexes = tokens.map(createRegexFromToken);
        return regexes.reduce((maskRegex, tokenRegex) => maskRegex + tokenRegex, '');
    }
    exports.createMaskRegex = createMaskRegex;
});
define("internals/inputProcessor", ["require", "exports", "internals/maskTokenizer", "internals/maskRegexCreator"], function (require, exports, maskTokenizer_1, maskRegexCreator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var UserInputType;
    (function (UserInputType) {
        UserInputType[UserInputType["INSERTION"] = 0] = "INSERTION";
        UserInputType[UserInputType["DELETION"] = 1] = "DELETION";
    })(UserInputType = exports.UserInputType || (exports.UserInputType = {}));
    function createInputProcessor(mask) {
        const tokens = maskTokenizer_1.getTokens(mask);
        const regexes = createTokenRegexes(tokens);
        const inputProcessorOptions = {
            regexes
        };
        return (value, inputType) => {
            let appliedMask;
            let numberTokensConsumed = 0;
            let lastIterationValue = '';
            for (let index = 0; index < value.length; index++) {
                const currentChar = value.charAt(index);
                const currentValue = lastIterationValue + currentChar;
                appliedMask = processUserInput(currentValue, inputType, inputProcessorOptions, numberTokensConsumed);
                numberTokensConsumed += appliedMask.numberConsumedTokens;
                lastIterationValue = appliedMask.text;
                if (!appliedMask.valid) {
                    return appliedMask.text;
                }
            }
            return appliedMask ? appliedMask.text : '';
        };
    }
    exports.createInputProcessor = createInputProcessor;
    function createTokenRegexes(tokens) {
        const tokenRegexes = [];
        for (const token of tokens) {
            const regex = maskRegexCreator_1.createRegexFromToken(token);
            const tokenRegex = {
                text: token.token,
                literal: token.literal,
                optional: token.optional,
                regex
            };
            tokenRegexes.push(tokenRegex);
        }
        return tokenRegexes;
    }
    function processUserInput(value, inputType, options, currentIndex = 0) {
        let numberTokensConsumed = 1;
        let previousValue = value.substr(0, value.length - 1);
        const currentCharPosition = value.length - 1;
        const currentRegexPosition = currentIndex || currentCharPosition;
        const currentChar = value[currentCharPosition];
        let currentRegex = options.regexes[currentRegexPosition];
        if (value.length > options.regexes.length || !currentRegex) {
            return createMaskResult(previousValue, previousValue.length - 1, false);
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
    function createMaskResult(maskedValue, numberConsumedTokens, valid = true) {
        return { text: maskedValue, numberConsumedTokens: numberConsumedTokens, valid: valid };
    }
    function autofillNextChars(currentChar, inputType, tokens, currentTokenIndex) {
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
            }
            else if (canNextCharBeSkipped(currentChar, inputType, currentToken)) {
                currentToken = tokens[currentIndex + 1];
                autoCompleted = true;
                numberSuccessfulIterations++;
                currentIndex++;
            }
            else if (canCurrentCharBeRemovedFromInput(currentChar, inputType, currentToken)) {
                autoFilledValue = '';
                inputWasIgnored = true;
                autoCompleted = false;
            }
            else {
                autoCompleted = false;
            }
        } while (autoCompleted);
        return {
            numberTokensConsumed: numberSuccessfulIterations,
            text: autoFilledValue,
            inputWasIgnored: inputWasIgnored
        };
    }
    function canNextCharBeSkipped(currentChar, inputType, currentToken) {
        return (inputType === UserInputType.INSERTION &&
            currentToken.literal &&
            currentToken.optional &&
            !currentCharMatchesRegex(currentChar, currentToken));
    }
    function canNextCharBeAutoCompleted(currentChar, inputType, currentToken) {
        return (inputType === UserInputType.INSERTION &&
            currentToken.literal &&
            !currentToken.optional &&
            !currentCharMatchesRegex(currentChar, currentToken));
    }
    function canCurrentCharBeRemovedFromInput(currentChar, inputType, currentToken) {
        return (inputType === UserInputType.INSERTION &&
            !currentToken.literal &&
            !currentCharMatchesRegex(currentChar, currentToken));
    }
    function currentCharMatchesRegex(currentChar, token) {
        const match = currentChar.match(token.regex);
        return (match && match[0] === currentChar);
    }
});
define("index", ["require", "exports", "react", "react", "react-native", "internals/inputProcessor"], function (require, exports, React, react_1, react_native_1, inputProcessor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MaskedInput extends react_1.Component {
        constructor(props) {
            super(props);
            this.onTextChange = this.onTextChange.bind(this);
            this.state = { value: props.value };
            this.userInputProcessorFunction = inputProcessor_1.createInputProcessor(props.mask);
        }
        onTextChange(text) {
            this.updateMaskedValue(text);
        }
        componentWillReceiveProps(nextProps, nextContext) {
            this.userInputProcessorFunction = inputProcessor_1.createInputProcessor(nextProps.mask);
            this.updateMaskedValue(this.state.value);
        }
        updateMaskedValue(inputValue) {
            const newValue = this.userInputProcessorFunction(inputValue, inputProcessor_1.UserInputType.INSERTION);
            this.setState({ value: newValue });
            if (this.props.onTextChange) {
                this.props.onTextChange(newValue);
            }
        }
        render() {
            return (React.createElement(react_native_1.TextInput, { value: this.state.value, placeholder: this.props.placeholder, placeholderTextColor: this.props.placeholderTextColor, onChangeText: (text) => this.onTextChange(text), style: this.props.style, onSubmitEditing: this.props.onSubmitEditing, keyboardType: this.props.keyboardType }));
        }
    }
    exports.default = MaskedInput;
});
define("internals/inputProcessorTest", ["require", "exports", "internals/inputProcessor"], function (require, exports, inputProcessor_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    test('Process a simple numeric mask', () => {
        const inputProcessor = inputProcessor_2.createInputProcessor('00000 0000');
        const inputKeys = ['0', '1', '2', '3', '4', ' ', '5', '6', '7', '8'];
        const expectedOutputs = ['0', '01', '012', '0123', '01234', '01234 ', '01234 5', '01234 56', '01234 567', '01234 5678'];
        const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);
        expect(outputValues).toEqual(expectedOutputs);
    });
    test('Process a mask autocompleting a literal value if it is not optional', () => {
        const inputProcessor = inputProcessor_2.createInputProcessor('\\90000 0000');
        const inputKeys = ['0', '1', '2', '3', '5', '6', '7', '8'];
        const expectedOutputs = ['90', '901', '9012', '90123', '90123 5', '90123 56', '90123 567', '90123 5678'];
        const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);
        expect(outputValues).toEqual(expectedOutputs);
    });
    test('Process a mask with optional values setting the optional value', () => {
        const inputProcessor = inputProcessor_2.createInputProcessor('00000? 0000');
        const inputKeys = ['0', '1', '2', '3', '4', ' ', '5', '6', '7', '8'];
        const expectedOutputs = ['0', '01', '012', '0123', '01234', '01234 ', '01234 5', '01234 56', '01234 567', '01234 5678'];
        const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);
        expect(outputValues).toEqual(expectedOutputs);
    });
    test('Process a mask with optional values without setting the optional value', () => {
        const inputProcessor = inputProcessor_2.createInputProcessor('\\9?0000 0000');
        const inputKeys = ['0', '1', '2', '5', '5', '6', '7', '8'];
        const expectedOutputs = ['0', '01', '012', '0125', '0125 5', '0125 56', '0125 567', '0125 5678'];
        const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);
        expect(outputValues).toEqual(expectedOutputs);
    });
    test('Process a mask that starts with a literal value and user doesnt fill it up', () => {
        const inputProcessor = inputProcessor_2.createInputProcessor('+55 00');
        const inputKeys = ['1', '1'];
        const expectedOutputs = ['+55 1', '+55 11'];
        const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);
        expect(outputValues).toEqual(expectedOutputs);
    });
    test('Skip optional literal after autocompletable token if input doesnt match', () => {
        const inputProcessor = inputProcessor_2.createInputProcessor('+55 00 9?0000-0000');
        const inputKeys = ['1', '2', '3'];
        const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);
        expect(outputValues).toEqual(['+55 1', '+55 12', '+55 12 3']);
    });
    test('Go back to previous value if input is bigger than number of tokens', () => {
        const inputProcessor = inputProcessor_2.createInputProcessor('+55 00 9?0000-0000');
        const inputKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '1'];
        const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);
        expect(outputValues).toEqual([
            '+55 1', '+55 12', '+55 12 3', '+55 12 34', '+55 12 345', '+55 12 3456', '+55 12 3456-7', '+55 12 3456-78', '+55 12 3456-789', '+55 12 3456-7890', '+55 12 3456-7890'
        ]);
    });
    test('Mask with dots', () => {
        const inputProcessor = inputProcessor_2.createInputProcessor('00.0-0');
        const inputKeys = ['1', '2', '3', '4'];
        const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);
        const expectedOutputs = ['1', '12', '12.3', '12.3-4'];
        expect(outputValues).toEqual(expectedOutputs);
    });
    test('Mask with fast input of invalid symbols', () => {
        const inputProcessor = inputProcessor_2.createInputProcessor('0000');
        const inputKeys = ['ha', '0', 'h'];
        const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);
        expect(outputValues).toEqual(['', '0', '0']);
    });
    test('Mask with full value pasted', () => {
        const inputProcessor = inputProcessor_2.createInputProcessor('+55 9 0000 0000');
        const inputKeys = ['12345678'];
        const outputValues = pressKeysOneAtTime(inputKeys, inputProcessor);
        expect(outputValues).toEqual(['+55 9 1234 5678']);
    });
    test('Edit wrong value in middle of masked value', () => {
        const inputProcessor = inputProcessor_2.createInputProcessor('+55 (00) 9 0000 0000');
        const inputValues = ['+55 (12) 9 12345 678'];
        const outputValues = enterValuesOneAtTime(inputValues, inputProcessor);
        expect(outputValues).toEqual(['+55 (12) 9 1234 5678']);
    });
    test('Change mask on the fly and value is bigger than mask', () => {
        const inputProcessor = inputProcessor_2.createInputProcessor('+595 00 0000000');
        const inputValues = ['+55 (11) 9 8765-4321'];
        const outputValues = enterValuesOneAtTime(inputValues, inputProcessor);
        expect(outputValues).toEqual(['+595 11 9876543']);
    });
    function pressKeysOneAtTime(keys, inputProcessor) {
        let currentValue = '';
        const outputValues = [];
        for (const key of keys) {
            const currentInput = currentValue + key;
            currentValue = inputProcessor(currentInput, inputProcessor_2.UserInputType.INSERTION);
            outputValues.push(currentValue);
        }
        return outputValues;
    }
    function enterValuesOneAtTime(values, inputProcessor) {
        return values.map((value) => inputProcessor(value, inputProcessor_2.UserInputType.INSERTION));
    }
});
define("internals/maskRegexCreatorTest", ["require", "exports", "internals/maskRegexCreator", "internals/maskTokenizer"], function (require, exports, maskRegexCreator_2, maskTokenizer_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    test('Create regex for simple mask', () => {
        const tokens = maskTokenizer_2.getTokens('0000 0000');
        const regex = maskRegexCreator_2.createMaskRegex(tokens);
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
        const tokens = maskTokenizer_2.getTokens('+\\0\\0 0000 0000');
        const regex = maskRegexCreator_2.createMaskRegex(tokens);
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
        const tokens = maskTokenizer_2.getTokens('+00 00000? 0000');
        const regex = maskRegexCreator_2.createMaskRegex(tokens);
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
        const tokens = maskTokenizer_2.getTokens('+00 ?\\9? 0000 0000');
        const regex = maskRegexCreator_2.createMaskRegex(tokens);
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
        const tokens = maskTokenizer_2.getTokens('+55\\?0');
        const regex = maskRegexCreator_2.createMaskRegex(tokens);
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
        const tokens = maskTokenizer_2.getTokens('XX-xas000/1000');
        const regex = maskRegexCreator_2.createMaskRegex(tokens);
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
});
define("internals/maskTokenizerTest", ["require", "exports", "internals/maskTokenizer"], function (require, exports, maskTokenizer_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createToken(token, optional = false, literal = false) {
        return {
            token,
            optional,
            literal
        };
    }
    test('Tokenize simple mask', () => {
        const tokens = maskTokenizer_3.getTokens('0000-0000');
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
        const tokens = maskTokenizer_3.getTokens('+\\5\\5 0000-0000');
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
        const tokens = maskTokenizer_3.getTokens('0?0000 0000');
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
        const tokens = maskTokenizer_3.getTokens('\\9? 0000-0000');
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
        const tokens = maskTokenizer_3.getTokens('0000 0000');
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
        const tokens = maskTokenizer_3.getTokens('+55 9?0.0');
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
        const tokens = maskTokenizer_3.getTokens('+55\\?');
        expect(tokens).toEqual([
            createToken('+', false, true),
            createToken('5', false, true),
            createToken('5', false, true),
            createToken('?', false, true),
        ]);
    });
});
//# sourceMappingURL=index.js.map