import {View, TextInput, FlatList, StyleSheet} from "react-native";
import {Text} from "@/components/Text/Text";
import {useAtom} from "jotai";
import {tiktokUsernameEffectAtom} from "../stores/tiktokUsernameStore";
import {tiktokCommentsAtom} from "../stores/tiktokLiveStore";
import {useState} from "react";
import {Icon} from "@/components/Icon/Icon";

const styles = StyleSheet.create({
    commonContainer: {
        padding: 16,
        backgroundColor: "#fff",
        borderRadius: 8,
    },
    commonTextInput: {
        padding: 8,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        backgroundColor: "#f9f9f9",
    },
    headerContainer: {
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    input: {
        flex: 1,
        marginTop: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        backgroundColor: "#f9f9f9",
    },
    listContent: {
        padding: 16,
    },
    commentContainer: {
        marginBottom: 12,
        padding: 16,
        backgroundColor: "#fff",
        borderRadius: 8,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
    },
});

export default function Index() {
    const [username, setUsername] = useAtom(tiktokUsernameEffectAtom);
    const [comments] = useAtom(tiktokCommentsAtom);

    const [inputValue, setInputValue] = useState(username);

    const headerComponent = (
        <View style={styles.headerContainer}>
            <Text type="title">TokAI</Text>
            <Text type="subtitle">Voice AI assistant to TikTok</Text>
            <View style={styles.row}>
                <TextInput
                    style={styles.input}
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder="Enter TikTok username"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <Icon name="send" onPress={() => {
                    setUsername(inputValue);
                }}/>
            </View>
        </View>
    );

    const renderItem = ({
        item,
    }: {
        item: {user?: {uniqueId?: string}; comment?: string};
    }) => (
        <View style={styles.commentContainer}>
            <Text type="subtitle">{item.user?.uniqueId || "Unknown"}</Text>
            <Text type="default">{item.comment}</Text>
        </View>
    );

    return (
        <FlatList
            data={comments}
            keyExtractor={(item, index) =>
                (item?.user?.uniqueId ?? "") +
                (item?.comment ?? "") +
                index.toString()
            }
            ListHeaderComponent={headerComponent}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            stickyHeaderHiddenOnScroll
            invertStickyHeaders
        />
    );
}
