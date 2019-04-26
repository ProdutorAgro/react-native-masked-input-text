import * as React from 'react';
import { Component } from 'react';
import { TextInput } from 'react-native';
import { createInputProcessor, UserInputType } from './internals/inputProcessor';
export default class MaskedInput extends Component {
    constructor(props) {
        super(props);
        this.onTextChange = this.onTextChange.bind(this);
        this.state = { value: props.value };
        this.userInputProcessorFunction = createInputProcessor(props.mask);
    }
    onTextChange(text) {
        this.updateMaskedValue(text);
    }
    componentWillReceiveProps(nextProps, nextContext) {
        this.userInputProcessorFunction = createInputProcessor(nextProps.mask);
        this.updateMaskedValue(this.state.value);
    }
    updateMaskedValue(inputValue) {
        const newValue = this.userInputProcessorFunction(inputValue, UserInputType.INSERTION);
        this.setState({ value: newValue });
        this.props.onTextChange(newValue);
    }
    render() {
        return (React.createElement(TextInput, { value: this.state.value, placeholder: this.props.placeholder, placeholderTextColor: this.props.placeholderTextColor, onChangeText: (text) => this.onTextChange(text), style: this.props.style, onSubmitEditing: this.props.onSubmitEditing, keyboardType: this.props.keyboardType }));
    }
}
//# sourceMappingURL=index.js.map