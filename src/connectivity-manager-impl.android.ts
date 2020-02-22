import {Common} from './connectivity-manager-impl.common';
import * as application from 'tns-core-modules/application';
import {ConnectivityManagerInterface} from "./connectivity-manager-interface";
import Context = android.content.Context;
import ScanResult = android.net.wifi.ScanResult;
import WifiConfiguration = android.net.wifi.WifiConfiguration;
import ConnectivityManagerService = android.net.ConnectivityManager;
import TelephonyManagerService = android.telephony.TelephonyManager;
import WifiManagerService = android.net.wifi.WifiManager;
import LocationManagerService = android.location.LocationManager;
import List = java.util.List;
import WifiManager = android.net.wifi.WifiManager;

/**
 * It manages the connectivity API of an Android mobile device.
 */
export class ConnectivityManagerImpl extends Common implements ConnectivityManagerInterface {
    private readonly WIFI_SSID_BLACKLIST = ['', ' '];

    // Gets Android services
    private readonly wifiManager: WifiManagerService = application.android.context.getSystemService(Context.WIFI_SERVICE);
    private readonly cellularManager: TelephonyManagerService = application.android.context.getSystemService(Context.TELEPHONY_SERVICE);
    private readonly locationManager: LocationManagerService = application.android.context.getSystemService(Context.LOCATION_SERVICE);
    private readonly connectivityManager: ConnectivityManagerService = application.android.context.getSystemService(Context.CONNECTIVITY_SERVICE);

    /**
     * Each wifi has a SSID, used to identify the network.
     *
     * @requires location permission granted of the user.
     * @returns the SSID of the current network or <unknown ssid> if the location permission is not granted.
     */
    public getSSID(): string {
        if (!this.isWifiConnected()) {
            throw new Error("Not connected to a Wifi.");
        }

        return this.wifiManager.getConnectionInfo().getSSID();
    }

    /**
     * Each configured network has a unique small integer ID, used to identify the network.
     *
     * @returns the ID for the currently connected network.
     */
    public getWifiNetworkId(): number {
        return this.wifiManager.getConnectionInfo().getNetworkId();
    }

    /**
     * @returns true if the wifi connectivity setting of the mobile device is enabled.
     */
    public isWifiEnabled(): boolean {
        return this.wifiManager.isWifiEnabled()
    }

    /**
     * @returns true if the mobile device is connected to a wifi network.
     */
    public isWifiConnected(): boolean {
        if (!this.isWifiEnabled()) {
            throw new Error("Wifi is not enabled.");
        }

        let wifi = this.connectivityManager.getNetworkInfo(ConnectivityManagerService.TYPE_WIFI);

        return wifi.isConnected();
    }

    /**
     * @returns true if the cellular connectivity setting of the mobile device is enabled.
     */
    public isCellularEnabled(): boolean {
        return this.cellularManager.isDataEnabled();
    }

    /**
     * @returns true if the mobile device is connected to a cellular network.
     */
    public isCellularConnected(): boolean {
        if (!this.isCellularEnabled()) {
            throw new Error("Cellular is not enabled.");
        }

        let cellular = this.connectivityManager.getNetworkInfo(ConnectivityManagerService.TYPE_MOBILE);

        return cellular.isConnected();
    }

    /**
     * @returns true if the GPS connectivity setting of the mobile device is enabled.
     */
    public isGpsEnabled(): boolean {
        return this.locationManager.isProviderEnabled(LocationManagerService.GPS_PROVIDER);
    }

    /**
     * @returns true if the mobile device is connected to GPS
     */
    public isGpsConnected(): boolean {
        return this.locationManager.isProviderEnabled(LocationManagerService.NETWORK_PROVIDER);
    }

    /**
     * Scans the local area for Wifi access points and returns a list of all SSIDs.
     *
     * @requires location permission granted of the user.
     * @returns a string array of Wifi SSIDs.
     */
    public async scanWifiNetworks(): Promise<string[]> {
        return new Promise((resolve) => {

            // Registers the broadcast to work with the scan results in the callback
            application.android.registerBroadcastReceiver(WifiManagerService.SCAN_RESULTS_AVAILABLE_ACTION, () => {

                // Unregisters the broadcast so that it is triggered only once
                application.android.unregisterBroadcastReceiver(WifiManagerService.SCAN_RESULTS_AVAILABLE_ACTION);

                // Creates a Wifi SSID list
                let wifiSsidList: string[] = [];
                let wifiScanResult: List<ScanResult> = this.wifiManager.getScanResults();
                for (let i = 0; i < wifiScanResult.size(); i++) {
                    let wifi: ScanResult = wifiScanResult.get(i);

                    // Adds the SSID only if it is not already in the list and not in the blacklist
                    if(wifiSsidList.indexOf(wifi.SSID) == -1 && this.WIFI_SSID_BLACKLIST.indexOf(wifi.SSID) == -1) {
                        wifiSsidList.push(wifi.SSID);
                    }
                }

                resolve(wifiSsidList);
            });

            this.wifiManager.startScan();
        });
    }

    /**
     * Connects to a Wifi access point.
     *
     * @param ssid of the Wifi access point to be connected.
     * @param password of the Wifi access point to be connected.
     * @param milliseconds that are available for the connection establishment.
     * @returns true if a connection could be established.
     */
    public async connectToWifiNetwork(ssid: string, password: string, milliseconds: number): Promise<boolean> {
        if (!this.isWifiEnabled()) {
            throw new Error("Wifi is not enabled.");
        }

        try {
            let networkId: number = this.addNetwork(ssid, password);

            this.disconnectWifiNetwork().then(()=>{
                this.wifiManager.enableNetwork(networkId, true);
                this.wifiManager.reconnect();
            });

            return await this.waitUntilConnectedToWifi(milliseconds);
        } catch (error) {
            throw new Error("Something went wrong wile connecting to the Wifi. + " + error);
        }
    }

    /**
     * Disconnects the connection to the current Wifi and listen to the network state until the status
     * has changed to disconnected.
     *
     * @returns true if the network was successfully disconnected
     */
    public async disconnectWifiNetwork(): Promise<boolean> {
        return new Promise((resolve) => {

            // Register receiver to listen if the network state changes
            application.android.registerBroadcastReceiver(WifiManager.NETWORK_STATE_CHANGED_ACTION, () => {

                // Only when the network has disconnected, start the process to unregister the receiver and return
                // "true" for a successfully disconnected network
                if (!this.isWifiConnected()) {

                    application.android.unregisterBroadcastReceiver(WifiManager.NETWORK_STATE_CHANGED_ACTION);
                    resolve(this.isWifiConnected());
                }

            });

            this.disconnectWifiAndRemoveNetwork();
        });
    }

    /**
     * Adds a Wifi configuration needed to connect to a network.
     *
     * @param ssid of a Wifi access point to be configured.
     * @param password of the Wifi access point to be configured.
     * @returns the networkId that is needed to connect to a network.
     */
    private addNetwork(ssid: string, password: string): number {
        let config: WifiConfiguration = new WifiConfiguration();
        config.SSID = "\"" + ssid + "\"";
        config.preSharedKey = "\"" + password + "\"";

        return this.wifiManager.addNetwork(config);
    }

    /**
     * Wait some seconds until connected to the Wifi.
     *
     * @param milliseconds in which the connection is to be established.
     * @returns true if the connection was made within the defined time.
     */
    private async waitUntilConnectedToWifi(milliseconds: number): Promise<boolean> {
        return new Promise((resolve) => {

            // Checks every 1/2 second if a connection is established
            let intervalTimer = setInterval(() => {

                // Stops the interval if the phone is connected to the Wifi
                if(this.isWifiConnected()) {
                    clearInterval(intervalTimer);
                    clearTimeout(timeout);
                    resolve(true);
                }
            }, 500);

            // Cancels the connection establishment after given milliseconds
            let timeout = setTimeout(() => {
                clearInterval(intervalTimer);

                // Guarantees a consistent Wifi state after the timeout
                this.disconnectWifiAndRemoveNetwork();

                throw new Error("Could not connect in the allowed time.");
            }, milliseconds);
        });
    }

    /**
     * Disconnects the connection to the current Wifi and remove the network from the wifiManager list
     * to prevent reconnecting.
     */
    private disconnectWifiAndRemoveNetwork(): void {

        // Prevents reconnecting to the network by removing the Wifi configuration
        this.wifiManager.removeNetwork(this.getWifiNetworkId());

        this.wifiManager.disconnect();
    }
}
