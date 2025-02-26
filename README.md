# Batch Format Plugin for Figma

A Figma plugin for batch formatting images and videos in your designs.

## Features

- Set image scale modes (FILL, FIT, CROP, TILE)
- Resize images with custom dimensions
- Remove default fill layers
- Set blend modes for images
- Support for videos
- Preset dimensions for quick formatting

## Development

### Prerequisites

- [Bun](https://bun.sh/) (recommended for package management)
- Node.js (v16 or higher)

### Setup

1. Clone this repository
2. Install Bun if you haven't already (optional but recommended):

```bash
# Install Bun globally
curl -fsSL https://bun.sh/install | bash
```

3. Install dependencies:

```bash
# Using Bun (recommended for faster installation)
bun install

# Or using npm
npm install
```

### Development Workflow

There are two ways to develop the plugin:

#### Option 1: Using webpack-dev-server (Recommended)

This option provides the best development experience with hot reloading:

```bash
# Start the development server
bun run dev
```

This will:

- Start a development server at http://localhost:9000
- Enable hot module replacement for faster development
- Write files to disk so Figma can access them
- Automatically rebuild when files change

#### Option 2: Using watch mode

If you prefer a simpler approach without the dev server:

```bash
# Start webpack in watch mode
bun run watch
```

This will:

- Watch for file changes and rebuild automatically
- Write files to disk in the dist folder

### Loading the Plugin in Figma

1. Open Figma Desktop
2. Go to Plugins > Development > Import plugin from manifest
3. Select the `manifest.json` file from your project directory
4. The plugin will now be available in the Plugins menu under Development

When you make changes to your code:

- If using the dev server, changes will be automatically applied
- If using watch mode, you'll need to right-click the plugin in Figma and select "Reload Plugin"

### Building

To build the plugin for production:

```bash
# Using Bun
bun run build

# Or using npm
npm run build
```

## Usage

1. Select one or more nodes containing images or videos
2. Open the plugin
3. Choose the desired formatting options
4. Click the corresponding action button

## Development Stack

This plugin uses:

- **TypeScript** for type-safe code
- **React** for the UI components
- **Tailwind CSS** for styling with Figma variables
- **Webpack** for bundling
- **Bun** as a fast package manager

## License

MIT
