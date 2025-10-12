import * as BackgroundTask from "expo-background-task";

export const localNotificationTask = async () => {
    return BackgroundTask.BackgroundTaskResult.Success;
};
