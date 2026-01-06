# Textor

A powerful VS Code extension for text formatting and conversion.

## Features

- **Smart Transform** - Automatically detect text type and recommend transformations
- **Base64** - Encode/Decode
- **JSON** - Format/Minify
- **URL** - Encode/Decode
- **Escape/Unescape** - Handle escape characters
- **Unicode** - Encode/Decode (`\uXXXX`)
- **Timestamp** - Convert between timestamp and date
- **IP Address** - Convert between IP and integer
- **SQL** - Format/Minify
- **Case Conversion** - Upper/Lower/Title/Camel/Snake case
- **Protobuf** - Hex to Protobuf / Protobuf to Hex
- **Proto Format** - Format `.proto` files
- **Hex/ASCII** - Convert between hex string and ASCII

### Sidebar Tools

- Time tools (current timestamp, date conversion)
- Random password generator
- UUID generator
- HMAC-SHA256 calculator

## Usage

1. Select text in editor
2. Press `Shift+Alt+F` or right-click and select `Textor: Smart Transform`
3. Choose a transformation from the quick pick menu

The extension will automatically detect the text type and recommend the most suitable transformations.

## Keyboard Shortcuts

| Command | Shortcut |
|---------|----------|
| Smart Transform | `Shift+Alt+F` |

## Requirements

VS Code 1.100.0 or higher

## Build

```bash
# Install dependencies
npm install

# Build VSIX
npx vsce package --allow-missing-repository
```

The generated `textor-x.x.x.vsix` file can be installed via:
- VS Code: `Cmd+Shift+P` → `Extensions: Install from VSIX...`
- CLI: `code --install-extension textor-x.x.x.vsix`

## License

MIT
