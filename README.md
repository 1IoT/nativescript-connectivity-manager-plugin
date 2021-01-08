# NativeScript ConnectivityManager Plugin

A plugin to manage the device connectivity on Android and iOS.

- [x] Android
  - [x] WiFi
  - [x] Cellular
  - [x] GPS
  - [ ] Bluetooth
  - [ ] Grant permissions
- [x] iOS
  - [x] WiFi
    - [x] Connect to wifi
    - [x] Get SSID
    - [] Others not implemented yet
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
```

## Usage

```
import {ConnectivityManagerImpl} from 'nativescript-connectivity-manager-plugin';

@Component({
    selector: "Home",
    templateUrl: "./home.component.html"
})
export class HomeComponent implements OnInit {

    private static NETWORK_SSID: string = "MY_SSID";
    private static NETWORK_PASSPHARSE: string = "MY_KEY";
    private static CONNECTION_TIMEOUT_MS: number = 30000;
    private static DISCONNECT_TIMEOUT_MS: number = 15000;

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
}

```

## API

Requires **Android SDK**: 29

**WARNING: Note that even for scanning WiFi and retrieving the SSID, location permission must be given and GPS must be enabled!**

| Method                                                                           | Return              | Description                                          |
| -------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------- |
| getSSID()                                                                        | string              | requires granted location permission and enabled gps |
| getWifiNetworkId()                                                               | number              |
| isWifiEnabled()                                                                  | boolean             |
| isWifiConnected()                                                                | boolean             |
| isCellularEnabled()                                                              | boolean             |
| isCellularConnected()                                                            | boolean             |
| isGpsEnabled()                                                                   | boolean             |
| isGpsConnected()                                                                 | boolean             |
| hasInternet()                                                                    | boolean             |
| async scanWifiNetworks()                                                         | Promise\<string[]\> | requires granted location permission and enabled gps |
| async connectToWifiNetwork(ssid: string, password: string, milliseconds: number) | Promise\<boolean\>  |
| async disconnectWifiNetwork(timeoutMs: number)                                   | Promise\<boolean\>  |

Do grant permissions (location permissions) please use the [nativescript-advanced-permissions plugin](https://market.nativescript.org/plugins/nativescript-advanced-permissions/) or implement another mechanism. IMHO, dealing with permissions should not be done on plugin level but on application level instead.

## Tips

- Docs about the [tns-platform-declarations](https://github.com/NativeScript/NativeScript/tree/master/tns-platform-declarations)
- If the project cannot be build, maybe `npm run demo:reset` and `npm run build` can fix it

## License

Apache License Version 2.0, January 2004
