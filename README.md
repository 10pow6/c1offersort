# C1 Offers Sorter

> Enhance your Capital One rewards experience with intelligent sorting and favorites management

## Features

**Smart Sorting**
- Sort offers by highest or lowest mileage rewards
- Sort alphabetically by merchant name (A-Z or Z-A)
- Handles all mileage formats (2X miles, 60,000 miles, etc.)
- Automatically loads all available offers before sorting
- Real-time progress updates during pagination

**Favorites Management**
- Toggle favorites mode on/off with a visual switch
- Mark your favorite offers with star buttons
- View all favorites in an expandable list
- Filter to show only favorited offers on the page
- Favorites persist across browsing sessions
- Detects missing favorites when filtering

**Performance & Reliability**
- Fast pagination with adaptive speed (400ms-4000ms delays)
- Smart retry logic for temporary button unavailability
- Memory leak protection with proper resource cleanup
- No visual page scrolling during pagination
- Background service worker for reliable message routing

**Security & Privacy**
- All data stored locally—nothing sent to external servers
- Open source and transparent
- Minimal permissions required

## Quick Start

1. **Install the Extension**
   - Install from the [Chrome Web Store](https://chrome.google.com/webstore) (coming soon)
   - Or build from source (see Development section below)

2. **Navigate to Capital One Offers**
   - Visit [capitaloneoffers.com/feed](https://capitaloneoffers.com/feed)
   - Click the extension icon in your Chrome toolbar

3. **Sort Your Offers**
   - Choose your sorting preference (mileage or alphabetical)
   - Select order (highest/lowest or A-Z/Z-A)
   - Click "Sort Offers"
   - Watch real-time progress as all offers load and sort

4. **Manage Favorites**
   - Toggle "Favorites" switch to enable star buttons
   - Click stars on offers to mark as favorites
   - Expand "Your Favorites" to see your list
   - Use "Show Favorites Only" to filter the page

## Usage

### Sorting Offers

1. Navigate to [capitaloneoffers.com/feed](https://capitaloneoffers.com/feed)
2. Click the extension icon
3. Select sort criteria (Mileage or Alphabetical)
4. Choose order (Highest/Lowest or A-Z/Z-A)
5. Click "Sort Offers"

The extension will automatically:
- Load all pages of offers with progress updates
- Parse and sort all offers based on your selection
- Reorder offers visually on the page

### Managing Favorites

1. **Enable Favorites**: Toggle the favorites switch in the popup
2. **Mark Favorites**: Click star buttons on any offer
3. **View List**: Expand "Your Favorites" to see all favorited offers
4. **Filter**: Click "Show Favorites Only" to show only starred offers
5. **Remove**: Click X next to any favorite in the list

## Privacy & Security

Your privacy matters. This extension:

- ✅ Stores all data **locally** in your browser only
- ✅ **Never transmits** data to external servers
- ✅ Only activates on Capital One domains
- ✅ Uses minimal permissions (activeTab, scripting, storage)
- ✅ Open source—review the code anytime

### Required Permissions

| Permission  | Why We Need It                                           |
| ----------- | -------------------------------------------------------- |
| `activeTab` | Access Capital One offers page when you click extension  |
| `scripting` | Inject sorting and favorites functionality into the page |
| `storage`   | Save your favorite offers locally in your browser        |

Read the full [Privacy Policy](docs/PRIVACY.md).

## Technical Details

- **Framework**: React 18 + TypeScript 5
- **Build Tool**: Vite 5 with dual entry points (popup + background)
- **Extension API**: Chrome Manifest V3
- **Browser Support**: Chrome 109+
- **Testing**: Vitest with comprehensive test coverage

### Architecture Highlights

- Background service worker for message routing and coordination
- Message bus pattern for type-safe cross-context communication
- Configuration layer for environment-specific settings
- Feature error boundaries for isolated error handling
- Memory leak protection with proper resource cleanup
- Optimized pagination (~35-40% faster than previous versions)

## Development

### Prerequisites

- Node.js 18+ and Yarn
- Chrome 109 or later

### Setup

```bash
# Clone the repository
git clone https://github.com/noritheshibadev/c1offersort.git
cd c1offersort

# Install dependencies
yarn install

# Build the extension
yarn build

# Or build for production (strips console.log/warn)
yarn build:prod
```

### Loading in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist` folder from the project

### Development Commands

```bash
yarn build          # Development build
yarn build:prod     # Production build (optimized)
yarn test           # Run tests in watch mode
yarn test:run       # Run tests once
yarn test:ui        # Run tests with UI
yarn test:coverage  # Run tests with coverage
```

### Project Structure

```
src/
├── background/          # Background service worker
├── config/             # Centralized configuration
├── content/            # Content script (runs on page)
├── injected-scripts/   # Scripts injected into page context
├── messaging/          # Message bus for cross-context communication
├── popup/              # React popup UI
│   ├── components/     # UI components
│   ├── hooks/          # Custom React hooks
│   └── services/       # Business logic
├── shared/             # Shared utilities across contexts
├── types/              # TypeScript type definitions
└── utils/              # Helper utilities
```

## Contributing

Contributions are welcome! Whether you're fixing bugs, adding features, or improving documentation:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run build to verify: `yarn build`
5. Run tests (optional): `yarn test:run`
6. Commit your changes
7. Push to your fork
8. Open a Pull Request

## Support

Having issues or suggestions?

- **Bug Reports**: [Open an issue](https://github.com/noritheshibadev/c1offersort/issues)
- **Feature Requests**: [Start a discussion](https://github.com/noritheshibadev/c1offersort/discussions)

## Support the Developer

If you find this extension helpful, consider [buying Nori a treat](https://buymeacoffee.com/shibadev)!

## License

This project is open source and available under the MIT License.

---

**Note**: This extension is not affiliated with or endorsed by Capital One. It's an independent tool created to enhance the user experience of Capital One rewards offers.
