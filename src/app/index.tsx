import {router} from "expo-router";
import {View} from "react-native";
import {Button} from "@/components/Button/Button";
import {Text} from "@/components/Text/Text";
import {PATHS} from "@/constants/routes";
import {styles} from "@/styles";

export default function Index() {
    return (
        <View style={styles.centerLayer}>
            <Text type="title">Welcome to Boilerplate Expo</Text>
            <Text type="subtitle">by Binni Cordova</Text>
            <Text type="default">
                I poured my 7+ years of mobile development expertise into
                crafting this boilerplate: a production-ready Expo starter
                complete with background tasks, push notifications, Storybook
                integration, automated testing, formatting, and CI/CD workflows.
                It’s designed to help you ship robust apps faster—so you can
                focus on features, not setup. It’s also fully compatible as a
                foundation for AI-assisted development, making it an excellent
                baseline for AI-driven workflows.
            </Text>

            <Button
                title="Connect on LinkedIn"
                onPress={() =>
                    router.push(
                        PATHS.WEB(
                            "https://www.linkedin.com/in/binni-cordova-a77000175/",
                            "Binni Cordova + Expert Mobile Developer"
                        )
                    )
                }
            />
        </View>
    );
}
