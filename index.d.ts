import { KeyboardTypeOptions } from 'react-native';
import { Component } from 'react';

type OnTextChangeListener = ((text: string, complete: boolean) => void);

interface IMaskedInputProps {
	mask: string;
	placeholder: string;
	style?: object;
	value?: string;
	keyboardType?: KeyboardTypeOptions;
	onTextChange?: OnTextChangeListener;
	placeholderTextColor?: string;
	onSubmitEditing?: (() => void);
}

interface IMaskedInputState {
	value: string;
}

export default class MaskedInput extends Component<IMaskedInputProps, IMaskedInputState> {}