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

### Examples

| Description           | Mask                    | Valid input           |
|:----------------------|:------------------------|:----------------------|
| US Phone number       | +1-000-000-0000         |+1-541-754-3010        |
| Date                  | 00/00/0000              | 25/12/2019            |
| Hour                  | 00:00                   | 23:15                 |
| Brazil Cellphones     | +55 (00) 9 0000-0000    | +55 (65) 9 8765-4321  |
| IP Address            | 00?0?.00?0?.00?0?.00?0? | 127.0.0.1             |
| CPF                   | 000.000.000-00          | 123.456.789-01        |
| Mask with letters     | XX-0000/1000            | AB-1234/1987          |