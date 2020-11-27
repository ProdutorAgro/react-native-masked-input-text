var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
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
define("internals/maskedTextResultFactory", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MaskedTextResultFactory {
        constructor(tokensRegex) {
            this.completenessRegex = tokensRegex.reduce((maskRegex, tokenRegex) => maskRegex + tokenRegex.regex, '');
        }
        create(text) {
            const x = text.match(this.completenessRegex);
            const isComplete = !!x;
            return {
                text,
                complete: isComplete
            };
        }
    }
    exports.default = MaskedTextResultFactory;
});
define("internals/inputProcessor", ["require", "exports", "internals/maskTokenizer", "internals/maskRegexCreator", "internals/maskedTextResultFactory"], function (require, exports, maskTokenizer_1, maskRegexCreator_1, maskedTextResultFactory_1) {
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
        const maskTextResultFactory = new maskedTextResultFactory_1.default(regexes);
        const inputProcessorOptions = {
            regexes
        };
        return (value, inputType) => {
            let appliedMask = null;
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
        return (match != null && match[0] === currentChar);
    }
});
define("index", ["require", "exports", "react", "react", "react-native", "internals/inputProcessor"], function (require, exports, React, react_1, react_native_1, inputProcessor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MaskedInput extends react_1.Component {
        constructor(props) {
            super(props);
            this.onTextChange = this.onTextChange.bind(this);
            this.state = { value: props.value || "" };
            this.userInputProcessorFunction = inputProcessor_1.createInputProcessor(props.mask);
        }
        onTextChange(text) {
            this.updateMaskedValue(text);
        }
        componentDidUpdate(prevProps, prevState, snapshot) {
            if (prevProps.mask !== this.props.mask) {
                this.userInputProcessorFunction = inputProcessor_1.createInputProcessor(this.props.mask);
            }
            this.updateMaskedValue(this.props.value || "");
        }
        updateMaskedValue(inputValue) {
            const maskResult = this.userInputProcessorFunction(inputValue, inputProcessor_1.UserInputType.INSERTION);
            const previousValue = this.state.value;
            const currentValue = maskResult.text;
            if (this.props.onTextChange && currentValue !== previousValue) {
                this.setState({ value: currentValue });
                this.props.onTextChange(maskResult.text, maskResult.complete);
            }
        }
        render() {
            let _a = this.props, { mask, value, onTextChange } = _a, attributes = __rest(_a, ["mask", "value", "onTextChange"]);
            return (React.createElement(react_native_1.TextInput, Object.assign({ value: this.state.value, onChangeText: (text) => this.onTextChange(text) }, attributes)));
        }
    }
    exports.default = MaskedInput;
});
//# sourceMappingURL=index.js.map