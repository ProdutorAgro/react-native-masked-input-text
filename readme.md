# Masked InputText for React Native

## Install
NPM
```
npm install react-native-masked-input-text 
```

Yarn
```
yarn add react-native-masked-input-text
```

## Usage

```tsx
import MaskedInput from 'react-native-masked-input-text'

render() {
    return (
        <View>
            <MaskedInput mask={'xXas\\00?'} placeholder={'xXas00'} />
        </View>
    )
}
```

### Mask options
This library supports the following options as its mask definition:

* x: a lower case letter
* X: a upper case letter
* s: either a lower or upper case letter
* a: an alpha numeric char (either lower or upper case)
* 0: any digit
* ?: makes the previous symbol optional
* \\: Escapes the next symbol and makes it as a static part of the mask

Note: Any char not declared above are considered static.