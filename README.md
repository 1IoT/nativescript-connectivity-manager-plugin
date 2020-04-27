# NativeScript ConnectivityManager Plugin

A plugin to manage the device connectivity on Android and iOS.

- [x] Android
    - [x] WiFi
    - [x] Cellular
    - [x] GPS
    - [ ] Bluetooth
    - [ ] Grant permissions
- [ ] iOS
    - [ ] WiFi
    - [ ] Cellular
    - [ ] GPS
    - [ ] Bluetooth

## Installation

`tns plugin add nativescript-connectivity-manager-plugin`

## Demo
Check out the [Angular demo app](https://github.com/1IoT/nativescript-connectivity-manager-plugin/blob/master/demo-angular/src/app/home/home.component.ts) 
and run it locally:
```
git clone https://github.com/1IoT/nativescript-connectivity-manager-plugin
cd nativescript-connectivity-manager-plugin/src
npm run demo:android
````

## Usage 

```
import {ConnectivityManagerImpl} from 'nativescript-connectivity-manager-plugin';

@Component({
    selector: "ns-app",
    templateUrl: "app.component.html"
})
export class AppComponent {

    constructor(private connectivityManager: ConnectivityManagerImpl) {
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
        this.connectivityManager.connectToWifiNetwork("{SSID}", "{PW}", 10000).then((connected: boolean) => {
            console.log("Connected with a new network: " + connected);
        });
    }

    public disconnect(): void {
        this.connectivityManager.disconnectWifiNetwork(5000).then((disconnected) => {
            console.log("Disconnected: " + disconnected);
            console.log("Android automatically connects to the source network...");
        });
    }
}

```

## Wifi Workflow
1. `connectToWifiNetwork()` Disconnects the source Wifi and connects to a new Wifi network
2. `disconnectWifiNetwork()` Disconnects the current network. If the network was connected via this plugin, it will 
remove the network from the wifiManager list, so Android cannot automatically reconnect to the network. If the network 
to be disconnected was already connected before, Android will automatically reconnect to the network.

## API
Requires **Android SDK**: 26

**WARNING: Note that even for scanning WiFi and retrieving the SSID, location permission must be given and GPS must be enabled!**

| Method | Return | Description
| --- | --- | --- |
| getSSID() | string | requires granted location permission and enabled gps
| getWifiNetworkId() | number |  
| isWifiEnabled() | boolean |  
| isWifiConnected() | boolean |  
| isCellularEnabled() | boolean |
| isCellularConnected() | boolean |  
| isGpsEnabled() | boolean |
| isGpsConnected() | boolean |  
| hasInternet() | boolean | 
| async scanWifiNetworks() | Promise\<string[]\> | requires granted location permission and enabled gps  
| async connectToWifiNetwork(ssid: string, password: string, milliseconds: number) | Promise\<boolean\> |  
| async disconnectWifiNetworkByBroadcast(timeoutMs: number) | Promise\<boolean\>

## Tips

- Docs about the [tns-platform-declarations](https://github.com/NativeScript/NativeScript/tree/master/tns-platform-declarations)
- If the project cannot be build, maybe `npm run demo:reset` and `npm run build` can fix it

## License

Apache License Version 2.0, January 2004
