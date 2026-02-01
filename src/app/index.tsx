import {KeyboardAvoidingView, Image} from "react-native";
import {Text} from "@/components/Text/Text";
import {useAtom} from "jotai";
import {tiktokUsernameEffectAtom} from "../stores/UsernameStore";
import {useState} from "react";
import {Button} from "@/components/Button/Button";
import {TextInput} from "@/components/TextInput/TextInput";
import {styles} from "@/styles";
import {router} from "expo-router";

export default function Index() {
    const [username, setUsername] = useAtom(tiktokUsernameEffectAtom);

    const [inputValue, setInputValue] = useState(username);

    const onSubmit = () => {
        setUsername(inputValue);
        router.navigate("/games/roulette");
    };

    return (
        <KeyboardAvoidingView style={styles.centerLayer} behavior="height">
            <Image
                source={require("../../assets/icon.png")}
                style={{width: 100, height: 100, marginBottom: 20}}
            />
            <Text type="title">TokAI</Text>
            <Text type="subtitle">Interact with TikTok Live using AI</Text>
            <TextInput
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Enter TikTok username"
                autoCapitalize="none"
                autoCorrect={false}
            />
            <Button title="Send" onPress={onSubmit} />
        </KeyboardAvoidingView>
    );
}
