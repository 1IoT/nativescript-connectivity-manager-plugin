import {Component, OnInit} from "@angular/core";
import {ConnectivityManagerImpl} from "../../../../src";

@Component({
    selector: "Home",
    templateUrl: "./home.component.html"
})
export class HomeComponent implements OnInit {

    constructor(private connectivityManager: ConnectivityManagerImpl) {
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

    public connect(): void {
        console.log("Start connection...");
        console.log("Disconnect with the source network...");
        this.connectivityManager.connectToWifiNetwork("", "", 10000).then((connected: boolean) => {
            console.log("Connected with a new network: " + connected);
        });
    }

    public disconnect(): void {
        this.connectivityManager.disconnectWifiNetwork().then((disconnected) => {
            console.log("Disconnected: " + disconnected);
            console.log("Android automatically connects to the source network...");
        });
    }
}
