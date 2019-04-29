import * as React from 'react';
import { Component, ReactNode } from 'react';
import { KeyboardTypeOptions, TextInput } from 'react-native';
import { createInputProcessor, InputProcessorFunction, UserInputType } from './internals/inputProcessor';

interface IMaskedInputProps {
	mask: string;
	placeholder: string;
	style?: object;
	value?: string;
	keyboardType?: KeyboardTypeOptions;
	onTextChange?: ((text: string, complete: boolean) => void);
	placeholderTextColor?: string;
	onSubmitEditing?: (() => void);
}

interface IMaskedInputState {
	value: string;
}

export default class MaskedInput extends Component<IMaskedInputProps, IMaskedInputState> {

	private userInputProcessorFunction: InputProcessorFunction;

	public constructor(props: IMaskedInputProps) {
		super(props);
		this.onTextChange = this.onTextChange.bind(this);
		this.state = {value: props.value};
		this.userInputProcessorFunction = createInputProcessor(props.mask);
	}

	private onTextChange(text: string): void {
		this.updateMaskedValue(text);
	}

	public componentWillReceiveProps(nextProps: Readonly<IMaskedInputProps>, nextContext: any): void {
		this.userInputProcessorFunction = createInputProcessor(nextProps.mask);
		this.updateMaskedValue(this.state.value);
	}

	private updateMaskedValue(inputValue: string): void {
		const maskResult = this.userInputProcessorFunction(inputValue, UserInputType.INSERTION);
		this.setState({value: maskResult.text});
		if (this.props.onTextChange) {
			this.props.onTextChange(maskResult.text, maskResult.complete);
		}
	}

	public render(): ReactNode {
		return (
			<TextInput
				value={this.state.value}
				placeholder={this.props.placeholder}
				placeholderTextColor={this.props.placeholderTextColor}
				onChangeText={(text) => this.onTextChange(text)}
				style={this.props.style}
				onSubmitEditing={this.props.onSubmitEditing}
				keyboardType={this.props.keyboardType}/>
		);
	}
}