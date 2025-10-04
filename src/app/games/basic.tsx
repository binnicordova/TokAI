import {View, TextInput, FlatList, StyleSheet} from "react-native";
import {Text} from "@/components/Text/Text";
import {useAtom} from "jotai";
import {useState} from "react";
import {Icon} from "@/components/Icon/Icon";
import { Chat } from "@/models/chat";
import { chatAtom } from "@/stores/LiveStore";
import { UsernameAtom } from "@/stores/UsernameStore";

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
    const [username, setUsername] = useAtom(UsernameAtom);
    const [comments] = useAtom<Chat[]>(chatAtom);

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
                    console.log("Username set to:", inputValue);
                    setUsername(inputValue);
                }}/>
            </View>
        </View>
    );

    const renderItem = ({ item }: { item: Chat }) => (
        <View style={styles.commentContainer}>
            {item.user && (
                <Text type="default" style={{ fontWeight: 'bold', marginBottom: 2 }}>
                    {item.user}
                </Text>
            )}
            <Text type="default" style={{ marginBottom: 2 }}>{item.comment}</Text>
            {item.createTime && (
                <Text type="default" style={{ fontSize: 12, color: '#888' }}>
                    {typeof item.createTime === 'string' || typeof item.createTime === 'number'
                        ? new Date(item.createTime).toLocaleString()
                        : String(item.createTime)}
                </Text>
            )}
        </View>
    );

    return (
        <FlatList
            data={comments}
            keyExtractor={(item, index) => Date.now().toString() + index.toString()}
            ListHeaderComponent={headerComponent}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            stickyHeaderHiddenOnScroll
            invertStickyHeaders
        />
    );
}
