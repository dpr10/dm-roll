import { initializeUI } from './ui.js';
import { dmRollAbilityForPlayers, dmRollSkillForPlayers } from './core.js';

const MODULE_ID = 'dm-roll';

Hooks.once('init', async function () {
  console.log(`${MODULE_ID} | Initializing`);

  game.settings.register(MODULE_ID, 'enableModule', {
    name: 'Enable DM Roll',
    hint: 'If checked, the DM Roll module will be active.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, 'rollVisibility', {
    name: 'Roll Visibility',
    hint: 'Controls who can see the ability check rolls.',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      self: 'DM Only',
      public: 'DM and Players',
    },
    default: 'self',
  });

  initializeUI();
});

Hooks.once('ready', async function () {
  console.log(`${MODULE_ID} | Ready`);

  // Expose on window for macro compatibility
  window.dmRollAbilityForPlayers = dmRollAbilityForPlayers;
  window.dmRollSkillForPlayers = dmRollSkillForPlayers;

  /*
   * Example Macro for DM Roll:
   * To use this module, create a new Macro in Foundry VTT with the following content:
   *
   * // Replace 'str' with the desired ability (e.g., 'dex', 'int', 'wis', 'cha', 'con')
   * // Replace the skill ID with the desired skill (e.g., 'athletics', 'persuasion', 'stealth')
   * // Replace the player IDs with the actual user IDs of the players you want to target.
   * // You can get player IDs by typing game.users.map(u => u.id) in the console.
   * // Example: rolling Strength for player with ID 'player1Id' and 'player2Id'
   * window.dmRollAbilityForPlayers('str', ['player1Id', 'player2Id']);
   *
   * // Example: rolling Athletics for player with ID 'player1Id' and 'player2Id'
   * window.dmRollSkillForPlayers('athletics', ['player1Id', 'player2Id']);
   *
   * // To roll for all active players:
   * // const activePlayerIds = game.users.filter(u => u.isPlayer && u.active).map(u => u.id);
   * // window.dmRollAbilityForPlayers('dex', activePlayerIds);
   * // window.dmRollSkillForPlayers('stealth', activePlayerIds);
   */
});
