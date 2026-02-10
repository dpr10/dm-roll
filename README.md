# DM Roll

DM Roll is a Foundry VTT module that allows the Dungeon Master to roll ability checks for different players in the game session, streamlining gameplay and enhancing session management.

## Features

- **GM-Controlled Ability Checks**: Allows the Game Master to initiate ability checks (STR, DEX, CON, INT, WIS, CHA) for selected players
- **Configurable Visibility**: Choose whether rolls are visible only to the DM or shared with players
- **User-Friendly Interface**: Provides a dialog interface accessible via a convenient header button
- **Macro Support**: Includes programmatic API for advanced automation

## Installation

1. Open Foundry VTT
2. Go to the "Install Module" tab in the Setup screen
3. Search for "DM Roll" or paste the manifest URL
4. Install the module
5. Activate the module in your world's module settings

## Usage

### Through UI
1. Click the "DM Roll" button in the scene controls
2. Select an ability from the dropdown
3. Choose one or more players from the list
4. Click "Roll" to execute the checks

### Through Macros
```javascript
// Roll strength check for specific players
window.dmRollAbilityForPlayers('str', ['player1Id', 'player2Id']);

// Roll dexterity for all active players
const activePlayerIds = game.users.filter(u => u.isPlayer && u.active).map(u => u.id);
window.dmRollAbilityForPlayers('dex', activePlayerIds);
```

## Configuration

The module provides two key settings:
1. **Enable DM Roll**: Toggle to activate/deactivate the module functionality
2. **Roll Visibility**: Control who sees the rolled checks (DM only or DM + Players)

## Compatibility

- Foundry VTT version 10-13
- Designed primarily for D&D 5e system but may work with other systems

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.