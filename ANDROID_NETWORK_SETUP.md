
# Android Network Setup Guide for LM Studio Chat

## Problem: "No permissions allowed" and Network Request Failed

If you're seeing "No permissions allowed" in your Android app settings and getting network errors when trying to connect to LM Studio, this guide will help you resolve the issue.

## Solution Overview

The app has been configured with the following Android network permissions and settings:

### 1. **Permissions Added to app.json**
```json
"permissions": [
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE",
  "android.permission.ACCESS_WIFI_STATE"
]
```

### 2. **Cleartext Traffic Enabled**
```json
"usesCleartextTraffic": true
```

### 3. **Network Security Configuration**
A `network_security_config.xml` file has been created to explicitly allow HTTP (cleartext) traffic for local network addresses.

### 4. **Build Properties Plugin**
The `expo-build-properties` plugin has been added to ensure cleartext traffic is properly configured during the build process.

## Important: You MUST Rebuild the APK

**CRITICAL:** These configuration changes only take effect when you build a new APK. Simply restarting the app or using Expo Go will NOT apply these changes.

### How to Rebuild:

1. **For Production APK:**
   ```bash
   npm run build:android:apk
   ```
   or
   ```bash
   eas build -p android --profile production
   ```

2. **For Preview/Testing APK:**
   ```bash
   npm run build:android:preview
   ```
   or
   ```bash
   eas build -p android --profile preview
   ```

3. **Wait for the build to complete** (this can take 10-20 minutes)

4. **Download and install the new APK** on your Android device

5. **Uninstall the old version first** if you're having issues

## Android-Specific Network Requirements

### Why localhost doesn't work on Android:

On Android devices, `localhost` and `127.0.0.1` refer to the **Android device itself**, NOT your computer. This is different from web browsers where localhost refers to your computer.

### What you need to do:

1. **Find your computer's IP address:**
   
   **Windows:**
   - Open Command Prompt (CMD)
   - Type: `ipconfig`
   - Look for "IPv4 Address" under your active network adapter
   - Example: `192.168.1.100`
   
   **Mac:**
   - Open Terminal
   - Type: `ifconfig`
   - Look for "inet" under your active network (usually en0 or en1)
   - Example: `192.168.1.100`
   
   **Linux:**
   - Open Terminal
   - Type: `ip addr` or `ifconfig`
   - Look for "inet" under your active network interface
   - Example: `192.168.1.100`

2. **Update the API URL in the app:**
   - Open the app
   - Go to the Profile/Settings tab
   - Change the API URL from `http://localhost:1234` to `http://YOUR_COMPUTER_IP:1234`
   - Example: `http://192.168.1.100:1234`
   - Save the changes

3. **Ensure both devices are on the same network:**
   - Your computer and Android device must be connected to the same WiFi network
   - Disable VPN on both devices if you're using one
   - Some public WiFi networks block device-to-device communication (use a home network)

4. **Configure your computer's firewall:**
   
   **Windows Firewall:**
   - Open Windows Defender Firewall
   - Click "Allow an app or feature through Windows Defender Firewall"
   - Find LM Studio or allow port 1234
   - Make sure both "Private" and "Public" are checked
   
   **Mac Firewall:**
   - Go to System Preferences > Security & Privacy > Firewall
   - Click "Firewall Options"
   - Add LM Studio to the allowed apps list
   
   **Linux (ufw):**
   ```bash
   sudo ufw allow 1234/tcp
   ```

5. **Configure LM Studio:**
   - Open LM Studio
   - Load a model
   - Start the local server
   - Make sure CORS is enabled in the server settings
   - The server should show it's listening on `0.0.0.0:1234` (not just `localhost:1234`)

## Verifying the Setup

After rebuilding and installing the new APK:

1. **Check App Permissions:**
   - Go to Android Settings > Apps > LM Studio Chat > Permissions
   - You should now see "Internet" or network-related permissions listed
   - If you still see "No permissions allowed", the APK wasn't rebuilt properly

2. **Test the Connection:**
   - Open the app
   - Go to the Model Selection screen
   - Try to fetch models
   - If you see models listed, the connection is working!

3. **Check LM Studio Logs:**
   - When you try to fetch models, you should see a request in LM Studio's server logs
   - If you don't see any requests, the Android device isn't reaching your computer

## Troubleshooting

### Still getting "Network request failed"?

1. **Verify the IP address is correct:**
   - Ping your computer from another device on the same network
   - Make sure the IP hasn't changed (some routers assign dynamic IPs)

2. **Test with a browser:**
   - Open Chrome on your Android device
   - Navigate to `http://YOUR_COMPUTER_IP:1234/v1/models`
   - If this works, the app should work too after rebuilding

3. **Check for VPN or proxy:**
   - Disable any VPN on your Android device
   - Disable any proxy settings
   - Some corporate or school networks block local network access

4. **Try a different port:**
   - If port 1234 is blocked, try changing LM Studio to use a different port
   - Update the API URL in the app accordingly

5. **Restart everything:**
   - Restart LM Studio
   - Restart your computer's network adapter
   - Restart your Android device
   - Restart your WiFi router

### Still seeing "No permissions allowed"?

This means the new APK with permissions wasn't installed. Make sure to:

1. Completely uninstall the old app
2. Rebuild the APK with the new configuration
3. Install the newly built APK
4. Check app permissions in Android settings

## Network Security Configuration Details

The app now includes a `network_security_config.xml` file that explicitly allows cleartext (HTTP) traffic:

```xml
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">192.168.0.0</domain>
        <domain includeSubdomains="true">192.168.1.0</domain>
        <domain includeSubdomains="true">192.168.2.0</domain>
    </domain-config>
</network-security-config>
```

This configuration:
- Allows HTTP traffic (not just HTTPS)
- Trusts system and user certificates
- Explicitly allows common local network IP ranges

## Summary

The key steps to resolve the network permission issue:

1. ✅ Permissions have been added to `app.json`
2. ✅ Cleartext traffic has been enabled
3. ✅ Network security configuration has been created
4. ✅ Build properties plugin has been added
5. ⚠️ **YOU MUST REBUILD THE APK** for these changes to take effect
6. ⚠️ **USE YOUR COMPUTER'S IP ADDRESS** instead of localhost on Android
7. ⚠️ **ENSURE BOTH DEVICES ARE ON THE SAME NETWORK**

After rebuilding and installing the new APK with your computer's IP address, the app should successfully connect to LM Studio!
