/**
 * General interface for the connectivity manager.
 * It specifies the functions to be implemented for both platforms Android and iOs.
 */
export interface ConnectivityManagerInterface {
    getSSID(): string;

    getWifiNetworkId(): number;

    isWifiEnabled(): boolean;

    isWifiConnected(): boolean;

    isCellularEnabled(): boolean;

    isCellularConnected(): boolean;

    isGpsEnabled(): boolean;

    isGpsConnected(): boolean;

    hasInternet(): boolean;

    scanWifiNetworks(): Promise<string[]>;

    connectToWifiNetwork(ssid: string, password: string, milliseconds: number): Promise<boolean>

    disconnectWifiNetwork(timeoutMs: number):  Promise<boolean>;
}
