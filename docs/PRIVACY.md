# Privacy Policy for C1 Offers Sorter

**Last Updated**: November 1, 2025

## Overview

C1 Offers Sorter is a Chrome browser extension that enhances the Capital One rewards offers page by adding sorting and favorites functionality. This privacy policy explains how the extension handles your data.

## Data Collection and Storage

### What Data We Collect

The extension stores the following data **locally on your device only**:

1. **Favorites Data**: When you mark offers as favorites, the extension stores:
   - Merchant domain name (e.g., "example.com")
   - Merchant display name (e.g., "Example Store")
   - Mileage value text (e.g., "2X miles")
   - Timestamp when favorited

2. **Extension Settings**:
   - Favorites feature enabled/disabled state

### How Data is Stored

- All data is stored **locally in your browser** using Chrome's built-in storage API (`chrome.storage.local`)
- **No data is transmitted** to any external servers
- **No data is shared** with the extension developer or any third parties
- Data persists only in your Chrome browser on your device

### Data Limits

- Maximum 1,000 favorite offers
- Maximum 1MB total storage

## Data Usage

The extension uses your locally stored data solely to:

1. Display your favorited offers in the extension popup
2. Filter Capital One offers to show only your favorites
3. Remember your favorites across browsing sessions

## Data Access

- **Only you** have access to your data
- The extension **cannot and does not** transmit data outside your browser
- The extension developer **cannot access** your data
- The extension only operates when you visit Capital One offers pages

## Permissions Explanation

The extension requests the following Chrome permissions:

### activeTab
- **Purpose**: Allows the extension to interact with the Capital One offers page only when you click the extension icon
- **Scope**: Only affects the currently active tab, only when you invoke the extension

### scripting
- **Purpose**: Required to inject sorting and favorites functionality into the Capital One offers page
- **Scope**: Only used on Capital One offers pages (`https://capitaloneoffers.com/c1-offers` and `https://capitaloneoffers.com/feed`)

### storage
- **Purpose**: Store your favorites and preferences locally in your browser
- **Scope**: Data stored only in `chrome.storage.local` on your device

## Third-Party Access

- **No third parties** have access to your data
- **No analytics** or tracking services are used
- **No remote connections** are made by this extension
- The extension operates entirely offline (except for loading the Capital One website itself)

## Data Deletion

You can delete your data at any time by:

1. **Remove individual favorites**: Click the X button next to any favorite in the extension popup
2. **Clear all favorites**: Disable the favorites feature, which removes all stored data
3. **Complete removal**: Uninstall the extension from Chrome, which automatically deletes all stored data

## Security

- All data is stored securely using Chrome's built-in storage API
- The extension only activates on official Capital One domains
- No data is transmitted over the network
- The extension does not modify the Capital One website's data, only how it is displayed to you

## Changes to Privacy Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date at the top of this document. Continued use of the extension after changes constitutes acceptance of the updated policy.

## Open Source

This extension is open source. You can review the complete source code at:
https://github.com/noritheshibadev/c1offersort

## Contact

If you have questions about this privacy policy or the extension's data handling practices, please open an issue on GitHub:
https://github.com/noritheshibadev/c1offersort/issues

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- Chrome Extension Privacy Requirements
- General Data Protection principles

---

**Summary**: C1 Offers Sorter stores your favorites locally on your device. No data is collected, transmitted, or shared. You maintain complete control over your data.
