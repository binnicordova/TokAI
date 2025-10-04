const TAG = "[Logger]";

export const logger = {
    info: (message: string, data?: unknown) => {
        console.info(TAG, "[INFO]", message, data);
    },
    debug: (TAGGER: string, message: string, data?: unknown) => {
        console.debug(TAG, TAGGER, "[DEBUG] 🔍🔍🔍", message, data);
    },
    error: (message: string, error?: any) => {
        // Avoid using `instanceof Error` because in some JS runtimes or when shims
        // are in use (React Native / Metro shims) the RHS of instanceof can be
        // non-callable and throw a TypeError: "right operand of 'instanceof' is not an object".
        try {
            if (error && typeof error === "object") {
                const errorMessage = (error as any).message || String(error);
                const stack = (error as any).stack || undefined;
                console.error(TAG, "[ERROR] 🐛", message, { errorMessage, stack, error });
                return;
            }

            if (error !== undefined) {
                // Non-object (string/number/etc.)
                console.error(TAG, "[ERROR] 🐛", message, error);
            } else {
                console.error(TAG, "[ERROR] 🐛", message);
            }
        } catch (e) {
            // Last-resort safe logging to avoid crashing the app from logging itself
            try {
                console.error(TAG, "[ERROR] 🐛", message, String(error));
            } catch {
                // swallow - nothing more we can do
            }
        }
    },
};
