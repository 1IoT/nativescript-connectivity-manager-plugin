import { Common } from "./connectivity-manager-impl.common";
import * as application from "@nativescript/core/application";
import { ConnectivityManagerInterface } from "./connectivity-manager-interface";
import Context = android.content.Context;
import ScanResult = android.net.wifi.ScanResult;
import WifiConfiguration = android.net.wifi.WifiConfiguration;
import ConnectivityManagerService = android.net.ConnectivityManager;
import TelephonyManagerService = android.telephony.TelephonyManager;
import WifiManagerService = android.net.wifi.WifiManager;
import LocationManagerService = android.location.LocationManager;
import List = java.util.List;
import NetworkRequest = android.net.NetworkRequest;
import NetworkCapabilities = android.net.NetworkCapabilities;
import WifiNetworkSpecifier = android.net.wifi.WifiNetworkSpecifier;
import Network = android.net.Network;

let IS_Q_VERSION = false;

try {
  IS_Q_VERSION =
    android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q;
} catch {
  IS_Q_VERSION = false;
}

/**
 * It manages the connectivity API of an Android mobile device.
 * This is especially thought for applications where an app needs to connect to a Wi-Fi AP for P2P communication.
 * It allows also to switch back to a network with internet connection to also to internet requests.
 */
export class ConnectivityManagerImpl
  extends Common
  implements ConnectivityManagerInterface {
  private readonly WIFI_SSID_BLACKLIST = ["", " "];

  // Gets Android services
  private readonly wifiManager: WifiManagerService = application.android.context.getSystemService(
    Context.WIFI_SERVICE
  );
  private readonly cellularManager: TelephonyManagerService = application.android.context.getSystemService(
    Context.TELEPHONY_SERVICE
  );
  private readonly locationManager: LocationManagerService = application.android.context.getSystemService(
    Context.LOCATION_SERVICE
  );
  private readonly connectivityManager: ConnectivityManagerService = application.android.context.getSystemService(
    Context.CONNECTIVITY_SERVICE
  );

  // a "handle" to disconnect the forced network connection
  private forcedNetworkCallback: ConnectivityManagerService.NetworkCallback;

  // information about the previously (originally) connected network
  private previousConnectionMetered = false;
  private previousConnectionWiFi = false;
  private previousSsid: string = undefined;

  /**
   * Each Wi-Fi has a SSID, used to identify the network.
   *
   * @requires location permission granted of the user.
   * @returns the SSID of the current network or <unknown ssid> if the location permission is not granted.
   */
  public getSSID(): string {
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
   * @returns true if the Wi-Fi connectivity setting of the mobile device is enabled.
   */
  public isWifiEnabled(): boolean {
    return this.wifiManager.isWifiEnabled();
  }

  /**
   * WiFi Connected?
   *
   * API LEVEL 21
   *
   * @returns true if the mobile device is connected to a Wi-Fi network.
   */
  public isWifiConnected(): boolean {
    if (!this.isWifiEnabled()) {
      throw new Error("Wifi is not enabled.");
    }

    if (IS_Q_VERSION) {
      return (
        this.connectivityManager.getNetworkCapabilities(
          this.connectivityManager.getActiveNetwork()
        ) &&
        this.connectivityManager
          .getNetworkCapabilities(this.connectivityManager.getActiveNetwork())
          .hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
      );
    } else {
      return this.connectivityManager
        .getNetworkInfo(ConnectivityManagerService.TYPE_WIFI)
        .isConnected();
    }
  }

  /**
   * @returns true if the cellular connectivity setting of the mobile device is enabled.
   */
  public isCellularEnabled(): boolean {
    return this.cellularManager.isDataEnabled();
  }

  /**
   * Mobile connected?
   *
   * API LEVEL 21
   *
   * @returns true if the mobile device is connected to a cellular network.
   */
  public isCellularConnected(): boolean {
    if (!this.isCellularEnabled()) {
      throw new Error("Cellular is not enabled.");
    }

    return this.connectivityManager
      .getNetworkCapabilities(this.connectivityManager.getActiveNetwork())
      .hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR);
  }

  /**
   * @returns true if the GPS connectivity setting of the mobile device is enabled.
   */
  public isGpsEnabled(): boolean {
    return this.locationManager.isProviderEnabled(
      LocationManagerService.GPS_PROVIDER
    );
  }

  /**
   * @returns true if the mobile device is connected to GPS
   */
  public isGpsConnected(): boolean {
    return this.locationManager.isProviderEnabled(
      LocationManagerService.NETWORK_PROVIDER
    );
  }

  /**
   * Scans the local area for Wi-Fi access points and returns a list of all SSIDs.
   * TODO ctinnes has to be later substituted by another approach. I think, one has to get the scan results from the android system scans.
   *
   * @requires location permission granted of the user.
   * @returns a string array of Wi-Fi SSIDs.
   */
  public async scanWifiNetworks(): Promise<string[]> {
    return new Promise((resolve) => {
      // Registers the broadcast to work with the scan results in the callback
      application.android.registerBroadcastReceiver(
        WifiManagerService.SCAN_RESULTS_AVAILABLE_ACTION,
        () => {
          // Unregisters the broadcast so that it is triggered only once
          application.android.unregisterBroadcastReceiver(
            WifiManagerService.SCAN_RESULTS_AVAILABLE_ACTION
          );

          // Creates a Wifi SSID list
          let wifiSsidList: string[] = [];
          let wifiScanResult: List<ScanResult> = this.wifiManager.getScanResults();
          for (let i = 0; i < wifiScanResult.size(); i++) {
            let wifi: ScanResult = wifiScanResult.get(i);

            // Adds the SSID only if it is not already in the list and not in the blacklist
            if (
              wifiSsidList.indexOf(wifi.SSID) == -1 &&
              this.WIFI_SSID_BLACKLIST.indexOf(wifi.SSID) == -1
            ) {
              wifiSsidList.push(wifi.SSID);
            }
          }
          resolve(wifiSsidList);
        }
      );

      this.wifiManager.startScan();
    });
  }

  /**
   * Connects to a Wi-Fi access point.
   * This will prompt for a user confirmation in the application.
   *
   * API LEVEL 26
   *
   * @param ssid of the Wi-Fi access point to be connected.
   * @param password of the Wi-Fi access point to be connected.
   * @param milliseconds that are available for the connection establishment.
   * @returns true if a connection could be established.
   */
  public async connectToWifiNetwork(
    ssid: string,
    password: string,
    milliseconds: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if the wifi is enabled since this is a request to a WiFi network
      if (!this.isWifiEnabled()) {
        throw new Error("Wi-Fi not enabled.");
      }

      try {
        // Local variable to make it available in anonymous class (below)
        const that = this;
        const connectivityManager = this.connectivityManager;

        // Determine if the current connection is metered (used for later "reconnect")
        this.previousConnectionMetered = this.connectivityManager.isActiveNetworkMetered();

        /*
         * Determine if the current connection is a WiFi connection.
         * This allows later for more reliable "reconnect".
         */
        if (this.isWifiConnected()) {
          this.previousConnectionWiFi = true;
          this.previousSsid = this.getSSID();
        } else {
          this.previousConnectionWiFi = false;
          this.previousSsid = undefined;
        }

        /*
         * Connect to wifi network
         */

        if (IS_Q_VERSION) {
          // the requested network specifier
          let wifiNetworkSpecifier = new WifiNetworkSpecifier.Builder()
            .setSsid(ssid)
            .setWpa2Passphrase(password)
            .build();

          // the network request
          let networkRequest = new NetworkRequest.Builder()
            .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
            .removeCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) // For wifi that has no internet
            .setNetworkSpecifier(wifiNetworkSpecifier)
            .build();

          // the callback
          // network call back stored in class variable for later disconnect via {@link ConnectivityManagerService#unregisterNetworkCallback}
          this.forcedNetworkCallback = new ((ConnectivityManagerService.NetworkCallback as any).extend({
            onAvailable: function (network: android.net.Network) {
              console.log('Connected to the network');
              connectivityManager.bindProcessToNetwork(network);
              resolve(true);
            }, 
            onUnavailable: function () {
              this.super.onUnavailable();
              resolve(false);
            }
          }))();

          // Request the network with the given timeout
          console.log("Connecting to the network...");
          this.connectivityManager.requestNetwork(
            networkRequest,
            this.forcedNetworkCallback,
            milliseconds
          );
        } else {
          // Format ssid for android
          const ssidFormatted = `"${ssid}"`;

          // Configure wifi configuration
          let conf = new WifiConfiguration();
          conf.SSID = ssidFormatted;
          if (password) {
            conf.preSharedKey = '"' + password + '"';
            conf.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.WPA_PSK);
          } else {
            conf.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.NONE);
          }

          // the timeout
          let timeoutInterval = setTimeout(() => {
            resolve(false);
          }, milliseconds);

          // the network request
          let networkRequest = new NetworkRequest.Builder()
            .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
            .build();

          // the callback
          // network call back stored in class variable for later disconnect via {@link ConnectivityManagerService#unregisterNetworkCallback}
          this.forcedNetworkCallback = new ((ConnectivityManagerService.NetworkCallback as any).extend({
            onAvailable: function (network: android.net.Network) {
              if (that.getSSID() == ssidFormatted) {
                console.log('Connected to the network');

                connectivityManager.bindProcessToNetwork(network);
                connectivityManager.unregisterNetworkCallback(this);

                resolve(true);
                clearTimeout(timeoutInterval);
              }
            }, 
            onUnavailable: function () {
              this.super.onUnavailable();
            }
          }))();

          // Register network callback
          this.connectivityManager.registerNetworkCallback(
            networkRequest,
            this.forcedNetworkCallback
          );
          
          const list = this.wifiManager.getConfiguredNetworks();
          let netId = -1;
          for (let i = 0; i < list.size(); i++) {
            const network = list.get(i);

            if (network.SSID === ssidFormatted) {
              netId = network.networkId;
              break;
            }
          }

          if (netId == -1) {
            netId = this.wifiManager.addNetwork(conf);
          }
          this.wifiManager.enableNetwork(netId, true);
        }
      } catch (error) {
        throw new Error(
          "Something went wrong wile connecting to the WiFi. + " + error
        );
      }
    });
  }

  /**
   *  Checks if internet is currently available.
   *
   *  @return true if {@link NetworkCapabilities.NET_CAPABILITY_INTERNET} is given.
   */
  public hasInternet(): boolean {
    return ConnectivityManagerImpl.hasInternet(
      this.connectivityManager,
      this.connectivityManager.getActiveNetwork()
    );
  }

  private static hasInternet(
    connectivityManager: ConnectivityManagerService,
    network: Network
  ): boolean {
    return connectivityManager
      .getNetworkCapabilities(network)
      .hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
  }

  /**
   * Disconnects the connection to the current network and listens to the network state until the given timeout or reconnected
   * to a network with internet.
   *
   * API LEVEL 26
   *
   * @returns true if the network successfully disconnected and reconnected to a network with {@link NetworkCapabilities.NET_CAPABILITY_INTERNET}.
   */
  public async disconnectWifiNetwork(timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      let promiseTimeout = setTimeout(() => {
        console.log(
          "Ran into timeout when disconnecting and fetching new connection."
        );
        resolve(false);
      }, timeoutMs);

      // class parameter redefinition because of scope problems in the anonymous network callback class
      let connectivityManager = this.connectivityManager;
      let wifiManager = this.wifiManager;
      let previousNetworkMetered = this.previousConnectionMetered;
      let previousNetworkWiFi = this.previousConnectionWiFi;
      let previousNetworkSsid = this.previousSsid;

      /** Setting up the network callback to listen for the network changes. When disconnecting, the android system connects to some other networks before reaching the "final state".
       * I don't know why this is the case, but we need some logic to determine the "stable" network and route further traffic to this stable network.
       * We need to determine a new network with internet traffic, since after calling bindProcessToNetwork, android will not route app traffic automatically through a new network.
       * We therefore need to find the previous network to route traffic through that network again.
       */
      let networkConnectivity = new ((ConnectivityManagerService.NetworkCallback as any).extend({
        onAvailable: function (network: android.net.Network): void {
          ConnectivityManagerImpl.logConnectivityInfo(
            wifiManager,
            connectivityManager,
            network
          );

          if (
            ConnectivityManagerImpl.isPreviousOrStableNetwork(
              wifiManager,
              connectivityManager,
              network,
              previousNetworkMetered,
              previousNetworkWiFi,
              previousNetworkSsid
            )
          ) {
            connectivityManager.bindProcessToNetwork(network);
            resolve(true);
            clearTimeout(promiseTimeout);
            // The network we are aiming for is "stable" so we can safely unregister the callback again.
            connectivityManager.unregisterNetworkCallback(this);
          }
        },
        onLost: function (network: android.net.Network): void {
          console.log("Disconnected.");
        }
      }))();

      //Register the callback above
      this.connectivityManager.registerNetworkCallback(
        new NetworkRequest.Builder().build(),
        networkConnectivity
      );

      if (IS_Q_VERSION) {
        //Disconnect from the intentionally connected network
        this.connectivityManager.unregisterNetworkCallback(
          this.forcedNetworkCallback
        );
      } else {
        this.wifiManager.disableNetwork(
          this.wifiManager.getConnectionInfo().getNetworkId()
        );
      }
    });
  }

  /**
   * This method implements some heuristics to determine if the given network is the"stable" network.
   * TODO when you know a method to do this deterministically, please make a pull-request or open an issue.
   *
   * @param wifiManager the Wi-Fi manager
   * @param connectivityManager the connectivity manager.
   * @param network the given network
   * @param previousNetworkMetered true if the previous network already had a metered connection.
   * @param previousNetworkWiFi true if the previous network was a Wi-Fi network
   * @param previousNetworkSsid the ssid of the previous network (if Wi-Fi).
   */
  private static isPreviousOrStableNetwork(
    wifiManager: WifiManagerService,
    connectivityManager: ConnectivityManagerService,
    network: Network,
    previousNetworkMetered: boolean,
    previousNetworkWiFi: boolean,
    previousNetworkSsid: string
  ): boolean {
    let isWifi = connectivityManager
      .getNetworkCapabilities(network)
      .hasTransport(NetworkCapabilities.TRANSPORT_WIFI);

    // both Wi-Fi
    if (previousNetworkWiFi && isWifi) {
      // TODO from android 11 on, it will be possible to get the ssid from the network
      let ssid = wifiManager.getConnectionInfo().getSSID();
      return ssid == previousNetworkSsid;
      // only previous Wi-Fi
    } else if (previousNetworkWiFi) {
      return false;
    }

    // No Wi-Fi previously
    let meteredNow = !connectivityManager
      .getNetworkCapabilities(network)
      .hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED);
    let hasInternet = ConnectivityManagerImpl.hasInternet(
      connectivityManager,
      network
    );

    // only connect if both networks were either both metered or both unmetered + internet is available
    // TODO need to make the "has Internet" optional for other use cases
    return meteredNow == previousNetworkMetered && hasInternet;
  }

  /**
   * Logs some information about the given {@link Network} and other connectivity information.
   *
   * API LEVEL 26
   *
   * @param wifiManager the Wi-Fi manager
   * @param connectivityManager the connectivity manager
   * @param network the {@link Network}.
   */
  private static logConnectivityInfo(
    wifiManager: WifiManagerService,
    connectivityManager: ConnectivityManagerService,
    network: Network
  ): void {
    let activeNetwork = connectivityManager.getActiveNetwork();
    let defaultActive = connectivityManager.isDefaultNetworkActive();
    let boundNetwork = connectivityManager.getBoundNetworkForProcess();
    let allNetworks = connectivityManager.getAllNetworks();
    // TODO from android 11 on, it will be possible to get the ssid from the network
    let ssid = wifiManager.getConnectionInfo().getSSID();
    console.log(
      "Connected via " +
        ConnectivityManagerImpl.getInterfaceName(connectivityManager, network)
    );
    console.log("New network: " + network);
    console.log("Active network: " + activeNetwork);

    console.log(
      "Active network adapter: " +
        ConnectivityManagerImpl.getInterfaceName(
          connectivityManager,
          activeNetwork
        )
    );
    console.log("Default is active?: " + defaultActive);
    console.log("Current bound network: " + boundNetwork);
    console.log(
      "Current bound network adapter: " +
        ConnectivityManagerImpl.getInterfaceName(
          connectivityManager,
          boundNetwork
        )
    );
    console.log("All networks: " + allNetworks);
    console.log("Current SSID:" + ssid);
  }

  private static getInterfaceName(
    connectivityManager: ConnectivityManagerService,
    activeNetwork: android.net.Network
  ) {
    let linkProperties = connectivityManager.getLinkProperties(activeNetwork);
    if (linkProperties == null) {
      return "";
    }

    return linkProperties.getInterfaceName();
  }

  /**
   * Wait some seconds until connected to the Wi-Fi.
   *
   * @Deprecated The method should not be used
   *
   * @param milliseconds in which the connection is to be established.
   * @returns true if the connection was made within the defined time.
   */
  private async waitUntilConnectedToWifi(
    milliseconds: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      // Checks every 1/2 second if a connection is established
      let intervalTimer = setInterval(() => {
        // Stops the interval if the phone is connected to the Wi-Fi
        if (this.isWifiConnected()) {
          clearInterval(intervalTimer);
          clearTimeout(timeout);
          resolve(true);
        }
      }, 500);

      // Cancels the connection establishment after given milliseconds
      let timeout = setTimeout(() => {
        clearInterval(intervalTimer);

        // Guarantees a consistent Wi-Fi state after the timeout
        this.disconnectWifiAndRemoveNetwork();

        throw new Error("Could not connect in the allowed time.");
      }, milliseconds);
    });
  }

  /**
   * Disconnects the connection to the current Wi-Fi and remove the network from the wifiManager list
   * to prevent reconnecting.
   *
   * @Deprecated The method should not be used
   */
  private disconnectWifiAndRemoveNetwork(): void {
    // Prevents reconnecting to the network by removing the Wi-Fi configuration
    this.wifiManager.removeNetwork(this.getWifiNetworkId());

    this.wifiManager.disconnect();
  }
}