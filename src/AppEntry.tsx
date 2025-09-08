import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Ensure Buffer exists on global for libraries that expect Node Buffer (Hermes doesn't provide it)
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

import {initBackgroundFetch} from "./hooks/useBackgroundFetch";
import {initNotification} from "./hooks/useNotification";

initBackgroundFetch();
initNotification();

import "expo-router/entry";
