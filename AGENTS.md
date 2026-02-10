# AGENTS Instructions for DM Roll

This is a Foundry Virtual Tabletop (FVTT) module that provides GM-controlled ability check rolling for players.

## Project Context

- **Purpose**: Allows DMs to roll ability checks for players in a Foundry VTT game session
- **Type**: Client-side JavaScript module for Foundry VTT v10+ (verified with v13)
- **System Target**: Currently assumes dnd5e system
- **Tech Stack**: JavaScript (ES6 modules), Handlebars templates, Foundry VTT API

## Development Setup

**No build process required.** This is a plain JavaScript module.

### Module Installation

Place the module folder in your Foundry VTT `Modules` directory and enable it in world settings.

### Code Style

- Uses Prettier with 120 character print width, 2-space indentation
- Run `prettier --check .` to verify formatting
- Run `prettier --write .` to auto-format
- Configuration: `.prettierrc`

### Manual Testing

- Load Foundry VTT with the module enabled
- Check browser console for debug output (look for `dm-roll |` prefix logs)
- Test with both GM and Player accounts
- Module adds a control button in the scene controls when user is GM

## Architecture

### Module Initialization Flow

1. **`init` hook** (`scripts/module.js`):
   - Registers two settings: `enableModule` (Boolean) and `rollVisibility` (String: "self" or "public")
   - Settings are world-scoped (globally accessible)
   - Initializes UI components

2. **`ready` hook** (`scripts/module.js`):
   - Exposes `window.dmRollAbilityForPlayers(abilityId, playerIds)` for macro use

3. **UI Setup** (`scripts/ui.js`):
   - Hooks into `getSceneControlButtons` to add the DM Roll button
   - Button only visible to GM users
   - Clicking button opens a dialog with ability/player selection

4. **Core Logic** (`scripts/core.js`):
   - Implements the ability check rolling functionality
   - Handles D&D 5e specific API calls
   - Manages roll visibility and chat messages

### Key Functions

**`window.dmRollAbilityForPlayers(abilityId, playerIds)`** (`scripts/core.js`)

- Entry point for rolling ability checks
- Parameters:
  - `abilityId` (string): Ability code like "str", "dex", "con", "int", "wis", "cha"
  - `playerIds` (array): User IDs to roll for
- Validates GM status and module enablement
- Respects `rollVisibility` setting (whispers to GM only if "self", public if "public")
- Creates and evaluates rolls directly using Foundry's Roll class
- Posts notifications for success/failure

**`initializeUI()`** (`scripts/ui.js`)

- Sets up the dialog opener function
- Filters players with assigned characters for selection list
- Renders dialog using Handlebars template: `modules/dm-roll/templates/dm-roll-dialog.hbs`
- Attaches click handler to launch the dialog
- Uses FoundryVTT v13 `DialogV2` API

## Key Conventions

### Module ID

- Module ID is `dm-roll` (used in settings paths, console logs, template paths)
- All console logs prefixed with `${MODULE_ID} |` for easy filtering

### Dialog System

- Uses Foundry's native `DialogV2` class for UI (not a custom component)
- Handlebars template for form markup
- Multiple select dropdown for players
- Single select dropdown for abilities with localized labels

### Localization

- Strings are in `lang/en.json`
- Template uses `{{localize "KEY"}}` syntax
- Currently minimal localization; extensible to other languages
- Added "SELECT_ABILITY" key for user-friendly dropdown prompt

### Game Settings

- Use `game.settings.register()` in `init` hook
- Access with `game.settings.get(MODULE_ID, 'settingName')`
- Both settings use `scope: 'world'` for global persistence

### Error Handling & User Feedback

- Use `ui.notifications.warn/error/info()` for user-facing messages
- Use `console.warn/error()` for debug logging
- Validate GM status before performing actions
- Handle missing characters gracefully (skip user, log warning)

### System Assumptions

- Currently hardcoded to dnd5e system (creates rolls directly using Foundry's Roll class)
- Rolling happens through Foundry's native chat system
- Only players with assigned characters are shown in the UI

## File Structure

```
dm-roll/
├── .github/
│   └── workflows/
│       └── release.yml              # GitHub Actions workflow for releases
├── .prettierrc                      # Formatter config
├── module.json                      # FVTT manifest
├── scripts/
│   ├── module.js                    # Main initialization & API
│   ├── ui.js                        # Dialog & button UI
│   └── core.js                      # Core rolling logic
├── templates/
│   └── dm-roll-dialog.hbs           # Dialog form template
├── lang/
│   └── en.json                      # Localization strings
├── LICENSE                          # License file
├── README.md                        # Documentation
├── CHANGELOG.md                     # Change history
└── AGENTS.md                        # AI assistant instructions
```

## Module Manifest

Key entries in `module.json`:

- `esmodules`: Entry points are `scripts/module.js`, `scripts/ui.js`, and `scripts/core.js`
- `languages`: Only English (en) is configured
- `compatibility.minimum`: v10, `verified`: v13, `maximum`: v13
- Distribution fields: `url`, `manifest`, `download`, `license`, `readme`, `bugs`, `changelog`

## Common Tasks

### Adding a New Setting

1. Register in `init` hook in `scripts/module.js` using `game.settings.register()`
2. Access with `game.settings.get(MODULE_ID, 'settingName')`
3. Add UI label to `lang/en.json` for localization

### Extending Ability Checks

- Ability options are in the `abilityChoices` object in `scripts/ui.js`
- Ability codes (str, dex, etc.) must match the system's ability naming

### Adding Template Strings

- Add to `lang/en.json`
- Reference in templates/JS with `{{localize "KEY"}}` or `game.i18n.localize()`

### Using Macros

The module exposes a global function for macro automation:

```javascript
window.dmRollAbilityForPlayers('str', ['userId1', 'userId2']);
```

Get player IDs with: `game.users.filter(u => u.isPlayer).map(u => u.id)`

### Module Distribution

- The module.json includes all necessary fields for distribution
- GitHub Actions workflow automates release packaging
- All required documentation files (LICENSE, README, CHANGELOG) are included
