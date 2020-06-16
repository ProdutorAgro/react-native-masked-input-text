import * as React from 'react';
import { Component, ReactNode } from 'react';
import { KeyboardTypeOptions, TextInput, TextInputProps } from 'react-native';
import { createInputProcessor, InputProcessorFunction, UserInputType } from './internals/inputProcessor';

type OnTextChangeListener = ((text: string, complete: boolean) => void);

interface IMaskedInputProps extends TextInputProps {
	mask: string;
	value?: string;
	onTextChange?: OnTextChangeListener;
	innerRef?: React.Ref<TextInput>
}

interface IMaskedInputState {
	value: string;
}

class MaskedInput extends Component<IMaskedInputProps, IMaskedInputState> {

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

	public componentWillReceiveProps(nextProps: Readonly<IMaskedInputProps>, nextContext: any): void {
		this.userInputProcessorFunction = createInputProcessor(nextProps.mask);
		this.updateMaskedValue(nextProps.value || "");
	}

	private updateMaskedValue(inputValue: string): void {
		const maskResult = this.userInputProcessorFunction(inputValue, UserInputType.INSERTION);
		const previousValue = this.state.value;
		const currentValue = maskResult.text;

		this.setState({ value: currentValue });
		if (this.props.onTextChange && currentValue !== previousValue) {
			this.props.onTextChange(maskResult.text, maskResult.complete);
		}
	}

	public render(): ReactNode {
                let { mask, value, onTextChange, innerRef, ...attributes } = this.props;
		return (
			<TextInput
				value={this.state.value}
				ref={innerRef}
				onChangeText={(text) => this.onTextChange(text)}
                                {...attributes}/>
		);
	}
}

export default React.forwardRef<TextInput, IMaskedInputProps>(
	(props, ref) => <MaskedInput innerRef={ref} {...props} />
);
