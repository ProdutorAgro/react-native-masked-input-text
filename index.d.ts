import { KeyboardTypeOptions } from 'react-native';
import { Component } from 'react';

interface IMaskedInputProps {
	mask: string;
	placeholder: string;
	style?: object;
	value?: string;
	keyboardType?: KeyboardTypeOptions;
	onTextChange?: ((text: string) => void);
	placeholderTextColor?: string;
	onSubmitEditing?: (() => void);
}

interface IMaskedInputState {
	value: string;
}

export default class MaskedInput extends Component<IMaskedInputProps, IMaskedInputState> {}