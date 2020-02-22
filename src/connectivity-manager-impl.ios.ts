import {Common} from './connectivity-manager-impl.common';
import {ConnectivityManagerInterface} from "./connectivity-manager-interface";

/**
 * It manages the connectivity API of an iOS mobile device.
 */
export class ConnectivityManagerImpl extends Common implements ConnectivityManagerInterface {

    public getSSID(): string {
        // Not implemented yet
        return undefined;
    }

    public getWifiNetworkId(): number {
        // Not implemented yet
        return undefined;
    }

    public isWifiEnabled(): boolean {
        // Not implemented yet
        return undefined;
    }

    public isWifiConnected(): boolean {
        // Not implemented yet
        return undefined;
    }

    public isCellularEnabled(): boolean {
        // Not implemented yet
        return undefined;
    }

    public isCellularConnected(): boolean {
        // Not implemented yet
        return undefined;
    }

    public isGpsEnabled(): boolean {
        // Not implemented yet
        return undefined;
    }

    public isGpsConnected(): boolean {
        // Not implemented yet
        return undefined;
    }

    public scanWifiNetworks(): Promise<string[]> {
        // Not implemented yet
        return undefined;
    }

    public async connectToWifiNetwork(ssid: string, password: string, milliseconds: number): Promise<boolean> {
        // Not implemented yet
        return undefined;
    }

    public disconnectWifiNetwork(): void {
        // Not implemented yet
    }
}
