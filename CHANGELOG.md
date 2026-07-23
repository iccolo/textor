# Change Log

All notable changes to the "textor" extension will be documented in this file.

## [0.0.3] - 2026-07-23

### Added

- Localization support (English & Simplified Chinese)
- Base64 ↔ Hex conversion

### Improved

- More tolerant JSON formatter for truncated / incomplete input
- Unescape preserves nested JSON so the result stays valid

### Fixed

- Webview toolbar icons (copy, clear, paste, ...) not showing after install

## [0.0.2] - 2025-01-10

### Improved

- Protobuf formatting alignment
- Timestamp tool with bidirectional conversion
- Password generator (ensures character type coverage, first char is letter)
- Settings persistence across sessions

### Fixed

- Sidebar settings reset issue when switching views

## [0.0.1] - 2025-01-06

### Added

- Smart Transform with intelligent text type detection
- Base64 Encode/Decode
- JSON Format/Minify
- URL Encode/Decode
- Escape/Unescape
- Unicode Encode/Decode
- Timestamp to Date / Date to Timestamp
- IP to Integer / Integer to IP
- SQL Format/Minify
- Case conversions (Upper/Lower/Title/Camel/Snake)
- Protobuf Hex decode/encode
- Proto file formatting with alignment
- Hex/ASCII conversion
- Sidebar tools:
  - Time tools
  - Random password generator
  - UUID generator
  - HMAC-SHA256 calculator
