import { getTokens } from './maskTokenizer';
import { createRegexFromToken } from './maskRegexCreator';
export var UserInputType;
(function (UserInputType) {
    UserInputType[UserInputType["INSERTION"] = 0] = "INSERTION";
    UserInputType[UserInputType["DELETION"] = 1] = "DELETION";
})(UserInputType || (UserInputType = {}));
export function createInputProcessor(mask) {
    const tokens = getTokens(mask);
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
function createTokenRegexes(tokens) {
    const tokenRegexes = [];
    for (const token of tokens) {
        const regex = createRegexFromToken(token);
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
//# sourceMappingURL=inputProcessor.js.map