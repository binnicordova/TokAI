import { BORDER, RADIUS } from '@/theme/border';
import { FONT_SIZE, LINE_HEIGHT } from '@/theme/fonts';
import { SPACING } from '@/theme/spacing';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    input: {
        width: '100%',
        borderWidth: BORDER[1],
        padding: SPACING[2],
        borderRadius: RADIUS[2],
        fontSize: FONT_SIZE[2],
    },
});