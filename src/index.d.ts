import {Common} from './connectivity-manager-impl.common';

/**
 *
 */
export declare class ConnectivityManagerImpl extends Common {

    getSSID(): string;

    getWifiNetworkId(): number;

    isWifiConnected(): boolean;

    isCellularConnected(): boolean;

    isWifiEnabled(): boolean;

    isCellularEnabled(): boolean;

    isGpsEnabled(): boolean;

    isGpsConnected(): boolean;

    async scanWifiNetworks(): Promise<string[]>;

    async connectToWifiNetwork(ssid: string, password: string, milliseconds: number): Promise<boolean>

    async disconnectWifiNetwork(): Promise<boolean>
}
