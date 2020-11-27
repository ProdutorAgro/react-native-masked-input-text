import * as React from 'react';
import { Component, ReactNode } from 'react';
import { KeyboardTypeOptions, TextInput, TextInputProps } from 'react-native';
import { createInputProcessor, InputProcessorFunction, UserInputType } from './internals/inputProcessor';

type OnTextChangeListener = ((text: string, complete: boolean) => void);

interface IMaskedInputProps extends TextInputProps {
	mask: string;
	value?: string;
	onTextChange?: OnTextChangeListener;
}

interface IMaskedInputState {
	value: string;
}

export default class MaskedInput extends Component<IMaskedInputProps, IMaskedInputState> {

	private userInputProcessorFunction: InputProcessorFunction;

	public constructor(props: IMaskedInputProps) {
		super(props);
		this.onTextChange = this.onTextChange.bind(this);
		this.state = {value: props.value || ""};
		this.userInputProcessorFunction = createInputProcessor(props.mask);
	}

	private onTextChange(text: string): void {
		this.updateMaskedValue(text);
	}

	public componentDidUpdate(prevProps: Readonly<IMaskedInputProps>, prevState: Readonly<IMaskedInputState>, snapshot?: any) {
	  if (prevProps.mask !== this.props.mask) {
			this.userInputProcessorFunction = createInputProcessor(this.props.mask);
		}
		this.updateMaskedValue(this.props.value || "");
	}

	private updateMaskedValue(inputValue: string): void {
		const maskResult = this.userInputProcessorFunction(inputValue, UserInputType.INSERTION);
		const previousValue = this.state.value;
		const currentValue = maskResult.text;

		if (this.props.onTextChange && currentValue !== previousValue) {
			this.setState({ value: currentValue });
			this.props.onTextChange(maskResult.text, maskResult.complete);
		}
	}

	public render(): ReactNode {
		let { mask, value, onTextChange, ...attributes } = this.props;
		return (
			<TextInput
				value={this.state.value}
				onChangeText={(text) => this.onTextChange(text)}
                                {...attributes}/>
		);
	}
}
