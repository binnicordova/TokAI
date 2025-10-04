import "dotenv/config";
import type {ExpoConfig} from "@expo/config-types";

const EAS_OWNER = process.env.EAS_OWNER; // by https://www.binnicordova.com
const EAS_SLUG = "tokai";
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID;

const VERSION = "0.0.1";
const VERSION_CODE = 1;

const APP_VARIANTS = {
    development: {
        identifier: "com.tokai.dev",
        name: "TokAI (Dev)",
        scheme: "dev.tokai.com",
    },
    preview: {
        identifier: "com.tokai.preview",
        name: "TokAI (Preview)",
        scheme: "preview.tokai.com",
    },
    production: {
        identifier: "com.tokai",
        name: "TokAI",
        scheme: "tokai.com",
    },
};

const getAppVariant = () => {
    if (process.env.APP_VARIANT === "development")
        return APP_VARIANTS.development;
    if (process.env.APP_VARIANT === "preview") return APP_VARIANTS.preview;
    return APP_VARIANTS.production;
};

const getUniqueIdentifier = () => getAppVariant().identifier;
const getAppName = () => getAppVariant().name;
const getScheme = () => getAppVariant().scheme;

export default ({config}: {config: ExpoConfig}): ExpoConfig => ({
    ...config,
    name: getAppName(),
    scheme: getScheme(),
    slug: EAS_SLUG,
    version: VERSION,
    orientation: "portrait",
    icon: "./assets/icon.png",
    newArchEnabled: true,
    splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
    },
    updates: {
        fallbackToCacheTimeout: 0,
        url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
        enabled: true,
    },
    assetBundlePatterns: ["**/*"],
    ios: {
        supportsTablet: true,
        bundleIdentifier: getUniqueIdentifier(),
        version: VERSION,
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#FFFFFF",
        },
        package: getUniqueIdentifier(),
        versionCode: VERSION_CODE,
        version: VERSION,
    },
    web: {
        favicon: "./assets/favicon.png",
        bundler: "metro",
    },
    extra: {
        router: {
            root: "src/app",
        },
        eas: {
            projectId: EAS_PROJECT_ID,
        },
    },
    owner: EAS_OWNER,
    runtimeVersion: {
        policy: "appVersion",
    },
    userInterfaceStyle: "automatic",
    plugins: [
        [
            "expo-router",
            {
                root: "src/app",
            },
        ],
        "expo-background-task",
    ],
});
