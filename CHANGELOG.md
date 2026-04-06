# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-04-06

### Added
- **Override-Entity** (`entities.override_entity`): Optionaler `switch`, `input_boolean` oder `binary_sensor`, der bestimmte Handles deaktiviert und ausblendet. Ein Blitz-Icon im Karten-Header schaltet die Entität um.
- Neue Konfig-Schlüssel: `override_ignore` (`'ideal'` | `'min'` | `'min_ideal'`, Standard: `'ideal'`) und `colors.override` für die Icon-Farbe.
- Visuelles Editor-UI für alle neuen Override-Felder (Entitätsauswahl, Dropdown für ignorierte Handles, Farbwahl).

## [1.0.1] - 2026-03-29

### Added
- Ladezeit-Entität (`entities.charging_time`) und Textfarbe (`charging_time_color`).

## [1.0.0] - 2026-03-28

### Added
- Initiales Release mit Min/Ideal/Max-Handles, SoC-Anzeige, Inline- und Bottom-Layout.

[Unreleased]: https://github.com/bjoernhardegen/charging-slider-card/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/bjoernhardegen/charging-slider-card/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/bjoernhardegen/charging-slider-card/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/bjoernhardegen/charging-slider-card/releases/tag/v1.0.0
