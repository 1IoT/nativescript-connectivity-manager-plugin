import { Common } from "./connectivity-manager-impl.common";
import { ConnectivityManagerInterface } from "./connectivity-manager-interface";

/**
 * It manages the connectivity API of an iOS mobile device.
 * This is especially thought for applications where an app needs to connect to a Wi-Fi AP for P2P communication.
 * It allows also to switch back to a network with internet connection to also to internet requests.
 */
export class ConnectivityManagerImpl
  extends Common
  implements ConnectivityManagerInterface {
  public getSSID(): string {
    let interfaceNames = <NSArray<string>>CNCopySupportedInterfaces();

    for (let i = 0; i < interfaceNames.count; i++) {
      let info = CNCopyCurrentNetworkInfo(interfaceNames[i]);
      if (!info) {
        continue;
      }
      let ssid = info[kCNNetworkInfoKeySSID];
      if (!ssid) {
        continue;
      }
      return ssid;
    }

    return null;
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

  public hasInternet(): boolean {
    //Not implemented yet
    return undefined;
  }

  public scanWifiNetworks(): Promise<string[]> {
    // Not implemented yet
    return undefined;
  }

  public connectToWifiNetwork(
    ssid: string,
    password: string,
    milliseconds: number
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let that = this;
      let configuration = NEHotspotConfiguration.new().initWithSSIDPassphraseIsWEP(
        ssid,
        password,
        false
      );
      configuration.joinOnce = true;

      let timeout = setTimeout(() => {
        resolve(false);
      }, milliseconds);

      NEHotspotConfigurationManager.sharedManager.applyConfigurationCompletionHandler(
        configuration,
        (err) => {
          if (err && err instanceof NSError) {
            resolve(false);
          } else if (this.getSSID() == ssid) {
            resolve(true);
          } else {
            resolve(false);
          }

          clearTimeout(timeout);
        }
      );
    });
  }

  public disconnectWifiNetwork(timeoutMs: number): Promise<boolean> {
    // Not implemented yet
    return undefined;
  }
}
