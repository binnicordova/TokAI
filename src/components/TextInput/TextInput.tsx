import {TextInput as RNTextInput} from "react-native";
import type {TextInputProps} from "react-native";
import {styles} from "./TextInput.styles";

interface CustomTextInputProps extends TextInputProps {
}

export const TextInput = (props: CustomTextInputProps) => {
    return <RNTextInput style={styles.input} {...props} />;
};
