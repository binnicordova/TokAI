import React, {useEffect, useState, useMemo, useCallback} from "react";
import {
    View,
    StyleSheet,
    Dimensions,
    FlatList,
    TouchableOpacity,
    Alert,
    Share,
    Image,
} from "react-native";
import {Svg, Path, G, Text as SvgText, Circle, TSpan} from "react-native-svg";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    runOnJS,
} from "react-native-reanimated";
import * as d3 from "d3-shape";
import {useAtom} from "jotai";
import {atomWithStorage} from "jotai/utils";
import {Text} from "@/components/Text/Text";
import {userGiftsAtom} from "@/stores/LiveStore";
import {Gift} from "@/models/gift";

// --- ATOMS ---
export const lastWinnersAtom = atomWithStorage<Gift[]>("lastWinners", []);

const {width} = Dimensions.get("window");
const WHEEL_SIZE = width * 0.9;
const RADIUS = WHEEL_SIZE / 2;
const INNER_RADIUS_RATIO = 0.4;

const SPIN_DURATION = 30000;
const WINNER_ANIMATION = 15000;
const SPIN_THRESHOLD = 500;

const colors = [
    "#FF6B6B",
    "#FFD166",
    "#06D6A0",
    "#118AB2",
    "#073B4C",
    "#E76F51",
    "#F4A261",
    "#E9C46A",
    "#2A9D8F",
    "#264653",
    "#A259F7",
    "#F72585",
    "#B5179E",
    "#7209B7",
    "#3A0CA3",
    "#4361EE",
    "#4CC9F0",
    "#FFB4A2",
    "#FF9F1C",
    "#2EC4B6",
    "#CBF3F0",
];

// --- HOOKS ---
const useRoulette = () => {
    const [userGifts, setUserGifts] =
        useAtom<Record<string, Gift>>(userGiftsAtom);

    const [, setLastWinners] = useAtom(lastWinnersAtom);
    const rotation = useSharedValue(0);
    const [winner, setWinner] = useState<Gift | null>(null);
    const [winnerGiftAmount, setWinnerGiftAmount] = useState<number | null>(
        null
    );
    const [isSpinning, setIsSpinning] = useState(false);

    const {participants, totalValue} = useMemo(() => {
        const participantArray = Object.entries(userGifts).map(
            ([id, gift]) => ({
                id,
                label: gift.user ?? "Desconocido",
                value: gift.repeatCount ?? 0,
            })
        );
        const total = participantArray.reduce(
            (sum, p) => sum + (p.value ?? 0),
            0
        );
        return {participants: participantArray, totalValue: total};
    }, [userGifts]);

    const resetGame = useCallback(() => {
        setUserGifts({});
        setWinner(null);
        setWinnerGiftAmount(null);
        rotation.value = 0;
        setIsSpinning(false);
    }, [setUserGifts, rotation]);

    const spin = useCallback(() => {
        if (isSpinning || participants.length === 0) return;

        setIsSpinning(true);
        setWinner(null);
        const randomSpins = 15 + Math.random() * 10;
        const randomExtraAngle = Math.random() * 360;
        const finalAngle =
            rotation.value + 360 * randomSpins + randomExtraAngle;

        const onSpinComplete = () => {
            const normalizedAngle = (360 - (finalAngle % 360)) % 360;
            let accumulatedAngle = 0;

            for (const participant of participants) {
                const angle = ((participant.value ?? 0) / totalValue) * 360;
                if (
                    normalizedAngle >= accumulatedAngle &&
                    normalizedAngle < accumulatedAngle + angle
                ) {
                    const winnerParticipant = userGifts[participant.id];
                    if (winnerParticipant) {
                        setWinner(winnerParticipant);
                    }
                    break;
                }
                accumulatedAngle += angle;
            }
            setIsSpinning(false);
        };

        rotation.value = withTiming(
            finalAngle,
            {
                duration: SPIN_DURATION,
                easing: Easing.out(Easing.cubic),
            },
            (finished) => {
                if (finished) {
                    runOnJS(onSpinComplete)();
                }
            }
        );
    }, [isSpinning, participants, totalValue, rotation, userGifts]);

    useEffect(() => {
        if (totalValue >= SPIN_THRESHOLD && !isSpinning && !winner) {
            spin();
        }
    }, [totalValue, isSpinning, spin, winner]);

    useEffect(() => {
        if (winner?.user) {
            const giftAmount = winner.repeatCount;
            if (giftAmount) {
                setWinnerGiftAmount(giftAmount);
                const winnerName = winner.user;
                if (winnerName) {
                    setLastWinners((prev) => [...prev, winner]);
                }
            }

            const timeout = setTimeout(() => {
                resetGame();
            }, WINNER_ANIMATION);

            return () => clearTimeout(timeout);
        }
    }, [winner, resetGame, setLastWinners]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{rotate: `${rotation.value}deg`}],
        };
    });

    return {
        participants,
        winner,
        isSpinning,
        spin,
        animatedStyle,
        totalValue,
        winnerGiftAmount,
    };
};

// --- COMPONENTS ---
const WinnerAnnouncement = ({
    winner,
    giftAmount,
}: {
    winner: Gift | null;
    giftAmount: number | null;
}) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (winner) {
            scale.value = withTiming(1, {
                duration: 500,
                easing: Easing.out(Easing.exp),
            });
            opacity.value = withTiming(1, {duration: 300});
        } else {
            // Hide animation when winner is cleared
            scale.value = withTiming(0, {duration: 300});
            opacity.value = withTiming(0, {duration: 300});
        }
    }, [winner, scale, opacity]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{scale: scale.value}],
            opacity: opacity.value,
        };
    });

    if (!winner) {
        return null;
    }

    return (
        <Animated.View style={[styles.winnerBanner, animatedStyle]}>
            <Text type="title" style={styles.contrastLabel}>
                ¡El ganador es {winner.user}!
            </Text>
            <Text type="subtitle" style={styles.contrastLabel}>
                ¡Ganó con {giftAmount} TAPS!
            </Text>
        </Animated.View>
    );
};

const ProgressBar = ({progress}: {progress: number}) => {
    return (
        <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, {width: `${progress * 100}%`}]} />
        </View>
    );
};

const RouletteWheel = ({
    participants,
}: {
    participants: {id: string; label: string; value: number}[];
}) => {
    const pieGenerator = useMemo(() => {
        return d3
            .pie<{id: string; label: string; value: number}>()
            .value((d: {id: string; label: string; value: number}) => d.value)
            .sort(null);
    }, []);

    const arcs = useMemo(
        () => pieGenerator(participants),
        [participants, pieGenerator]
    );

    const arcGenerator = d3
        .arc<d3.PieArcDatum<{id: string; value: number}>>()
        .innerRadius(RADIUS * INNER_RADIUS_RATIO)
        .outerRadius(RADIUS);

    return (
        <Svg
            width={WHEEL_SIZE}
            height={WHEEL_SIZE}
            viewBox={`-${RADIUS} -${RADIUS} ${WHEEL_SIZE} ${WHEEL_SIZE}`}
        >
            <G>
                {arcs.map(
                    (
                        arc: d3.PieArcDatum<{id: string; value: number}>,
                        index: number
                    ) => {
                        const path = arcGenerator(arc);
                        const [x, y] = arcGenerator.centroid(arc);
                        return (
                            <G key={`arc-${participants[index].id}`}>
                                <Path
                                    d={path || ""}
                                    fill={colors[index % colors.length]}
                                />
                                <SvgText
                                    x={x}
                                    y={y}
                                    fill="white"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                    fontSize="12"
                                    fontWeight="bold"
                                >
                                    <TSpan x={x}>
                                        {participants[index].label}
                                    </TSpan>
                                    <TSpan x={x} dy="1.2em">
                                        {participants[index].value}
                                    </TSpan>
                                </SvgText>
                            </G>
                        );
                    }
                )}
            </G>
            <G>
                <Circle
                    cx="0"
                    cy="0"
                    r={RADIUS * INNER_RADIUS_RATIO}
                    fill="black"
                />
                <SvgText
                    x="0"
                    y="0"
                    fill="white"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fontSize="24"
                    fontWeight="bold"
                >
                    <TSpan x="0" dy="-1.2em">
                        Gana
                    </TSpan>
                    <TSpan x="0" dy="1.2em">
                        El PREMIO
                    </TSpan>
                    <TSpan x="0" dy="1.2em">
                        del LIVE
                    </TSpan>
                </SvgText>
            </G>
        </Svg>
    );
};

const Pointer = () => (
    <View style={styles.pointerContainer}>
        <View style={styles.pointer} />
    </View>
);

const LastWinnersList = () => {
    const [lastWinners] = useAtom(lastWinnersAtom);

    const shareWinners = async () => {
        if (lastWinners.length === 0) {
            Alert.alert("No winners to share.");
            return;
        }

        const winnersText = lastWinners
            .map(
                (winner) =>
                    `${winner.user}\n -> ${winner.userId}\n -> ${winner.repeatCount}`
            )
            .join("\n\n");

        try {
            await Share.share({
                message: `Last Winners:\n${winnersText}`,
            });
        } catch {
            Alert.alert("Failed to share the winners list.");
        }
    };

    return (
        <TouchableOpacity
            onPress={shareWinners}
            style={styles.winnersListContainer}
        >
            <Text type="default" style={styles.contrastLabel}>
                Ultimos Ganadores
            </Text>
            {lastWinners.length > 0 ? (
                <FlatList
                    data={lastWinners.slice(-3).reverse()}
                    renderItem={({item}) => (
                        <Text
                            type="caption"
                            style={styles.contrastLabel}
                        >{`${item.user}: ${item.repeatCount}`}</Text>
                    )}
                    keyExtractor={(item, index) =>
                        `${item.user}-${item.repeatCount}-${index}`
                    }
                />
            ) : (
                <Text type="caption" style={styles.contrastLabel}>
                    Gana para aparecer aquí!
                </Text>
            )}
        </TouchableOpacity>
    );
};

const RouletteGame = () => {
    const {participants, winner, animatedStyle, totalValue, winnerGiftAmount} =
        useRoulette();

    const progress = Math.min(totalValue / SPIN_THRESHOLD, 1);

    return (
        <View style={styles.container}>
            <LastWinnersList />
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                }}
            >
                <Image
                    source={require("../../../assets/images/gifts/rose.png")}
                    style={styles.gift}
                    resizeMode="cover"
                />
                <Image
                    source={require("../../../assets/images/gifts/gift_box.png")}
                    style={styles.gift}
                    resizeMode="cover"
                />
                <Image
                    source={require("../../../assets/images/gifts/heart.png")}
                    style={styles.gift}
                    resizeMode="cover"
                />
                <Image
                    source={require("../../../assets/images/gifts/diamond.png")}
                    style={styles.gift}
                    resizeMode="cover"
                />
                <Image
                    source={require("../../../assets/images/gifts/star.png")}
                    style={styles.gift}
                    resizeMode="cover"
                />
            </View>
            <Text type="title" style={styles.goldLabel}>
                ¡Envía 1GIFT para entrar y ganar el premio del LIVE! 🌹🎡✨
            </Text>
            <Text type="default" style={styles.contrastLabel}>
                {"¡Más GIFTs, Más posibilidades de ganar! \n"}
            </Text>
            <Pointer />
            <Animated.View style={[styles.wheelContainer, animatedStyle]}>
                <RouletteWheel participants={participants} />
            </Animated.View>
            <View style={{paddingVertical: 20, width: "80%"}}>
                <ProgressBar progress={progress} />
                <Text
                    type="default"
                    style={{
                        color: "white",
                        fontSize: 16,
                        marginBottom: 10,
                        textAlign: "center",
                    }}
                >
                    {
                        "Al terminar el LIVE te contactaremos para DARTE tu premio. \nMantente en el LIVE \n Para mantener tu participación"
                    }
                </Text>
            </View>
            <WinnerAnnouncement winner={winner} giftAmount={winnerGiftAmount} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#2c3e50",
    },
    gift: {
        width: 50,
        height: 50,
        borderRadius: 25,
        margin: 5,
    },
    wheelContainer: {
        width: WHEEL_SIZE,
        height: WHEEL_SIZE,
        justifyContent: "center",
        alignItems: "center",
    },
    pointerContainer: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: 30,
        height: 40,
        marginLeft: -15,
        marginTop: -WHEEL_SIZE / 2,
        zIndex: 10,
        alignItems: "center",
    },
    pointer: {
        width: 0,
        height: 0,
        backgroundColor: "transparent",
        borderStyle: "solid",
        borderLeftWidth: 15,
        borderRightWidth: 15,
        borderBottomWidth: 30,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: "white",
        transform: [{rotate: "180deg"}],
    },
    winnerBanner: {
        position: "absolute",
        top: "50%",
        left: 0,
        right: 0,
        transform: [{translateX: -width * 0.4}, {translateY: -50}],
        backgroundColor: "rgba(0,0,0,0.8)",
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
        zIndex: 30,
    },
    winnersListContainer: {
        position: "absolute",
        bottom: 30,
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: 10,
        borderRadius: 10,
        zIndex: 20,
    },
    contrastLabel: {
        color: "white",
    },
    goldLabel: {
        color: "#FFD166",
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 12,
    },
    progressBarContainer: {
        height: 20,
        width: "100%",
        backgroundColor: "#555",
        borderRadius: 10,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        backgroundColor: "#FFD166",
    },
});

export default RouletteGame;
