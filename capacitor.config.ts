import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.pagflow.app',
    appName: 'PagFlow',
    webDir: 'out',
    server: {
        url: 'https://pay.elabela.store',
        cleartext: true,
        androidScheme: 'https'
    },
    plugins: {
        PushNotifications: {
            presentationOptions: ["badge", "sound", "alert"],
        },
    },
};

export default config;
