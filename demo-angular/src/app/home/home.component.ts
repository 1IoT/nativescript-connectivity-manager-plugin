import {Component, OnInit} from "@angular/core";
import {ConnectivityManagerImpl} from "../../../../src";
import {HttpClient} from "@angular/common/http";

@Component({
    selector: "Home",
    templateUrl: "./home.component.html"
})
export class HomeComponent implements OnInit {

    private static NETWORK_SSID: string = "MY_SSID";
    private static NETWORK_PASSPHARSE: string = "MY_KEY";
    private static CONNECTION_TIMEOUT_MS: number = 30000;
    private static DISCONNECT_TIMEOUT_MS: number = 15000;
    private static P2P_TEST_URL: string = 'http://test.p2p';
    private static INTERNET_TEST_URL: string = 'https://www.google.de';

    constructor(private connectivityManager: ConnectivityManagerImpl, private httpClient: HttpClient) {
    }

    ngOnInit(): void {
    }

    public getInfos() {
        console.log("Wifi SSID: " + this.connectivityManager.getSSID());
        console.log("NetworkId: " + this.connectivityManager.getWifiNetworkId());
        console.log("Wifi enabled: " + this.connectivityManager.isWifiEnabled());
        console.log("Wifi connected: " + this.connectivityManager.isWifiConnected());
        console.log("Cellular enabled: " + this.connectivityManager.isCellularEnabled());
        console.log("Cellular connected: " + this.connectivityManager.isCellularConnected());
        console.log("GPS enabled: " + this.connectivityManager.isGpsEnabled());
        console.log("GPS connected: " + this.connectivityManager.isGpsConnected());
    }

    public scan(): void {
        console.log("Start scan...");
        this.connectivityManager.scanWifiNetworks().then((wifiSSIDs: string[]) => {
            console.log(wifiSSIDs);
        });
    }

    public async connect(): Promise<boolean> {
        console.log("Start connection...");
        console.log("Disconnect with the source network...");
        return this.connectivityManager.connectToWifiNetwork(HomeComponent.NETWORK_SSID, HomeComponent.NETWORK_PASSPHARSE, HomeComponent.CONNECTION_TIMEOUT_MS);
    }

    public async disconnect(): Promise<boolean> {
        return this.connectivityManager.disconnectWifiNetwork(HomeComponent.DISCONNECT_TIMEOUT_MS);
    }

    /**
     * Test flow
     * Connect P2P -> Perform P2P HTTP Call -> Disconnect -> Perform Internet HTTP Call
     */
    public async testFlow(): Promise<void>{
        let success = await this.connect();
        console.log("Success: " + success);
        let result = await this.performP2PCall();
        console.log("Response: " + JSON.stringify(result));
        console.log("Disconnecting");
        let reconnected = await this.disconnect();
        console.log("Reconnected: " + reconnected);
        result = await this.performInternetCall();
        console.log("Response: " + JSON.stringify(result));
    }

    private async performP2PCall(): Promise<Object> {
        console.log("Running P2P call.");
        return this.httpClient.get(HomeComponent.P2P_TEST_URL).toPromise();
    }

    public async performInternetCall(): Promise<Object> {
        console.log("Running internet call.");
        return this.httpClient.get(HomeComponent.INTERNET_TEST_URL).toPromise();
    }
}
