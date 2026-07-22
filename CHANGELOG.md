# Change Log

All notable changes to the "textor" extension will be documented in this file.

## [0.0.3] - 2026-07-22

### Added

- Localization (i18n) support: English and Simplified Chinese for command titles, view names, notifications, detection descriptions and sidebar/tools panel UI (via VSCode `l10n` API, `package.nls.json` and `l10n/bundle.l10n.zh-cn.json`)
- Base64 ↔ Hex conversion (`Base64 to Hex`, `Hex to Base64`)

### Improved

- Lenient JSON formatter: gracefully formats truncated / incomplete JSON without auto-closing missing quotes or brackets, so users can clearly see where the input was cut off
- Unescape now performs a single-pass, single-layer unescape so nested JSON strings (with `\"`, `\\`) remain valid after unescaping and can be further formatted

### Fixed

- Detector descriptions and Quick Pick labels/messages now respect the IDE display language instead of being hard-coded in Chinese

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
