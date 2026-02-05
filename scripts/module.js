import { initializeUI } from './ui/ui.js';

// This is your module's main script file.
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

  // Register the hook early so it fires during scene control setup
  initializeUI();
});

Hooks.once('ready', async function () {
  console.log(`${MODULE_ID} | Ready`);

  /**
   * Allows the DM to roll an ability check for specified players.
   * @param {string} abilityId The ID of the ability to roll (e.g., "str", "dex").
   * @param {string[]} playerIds An array of user IDs for whom to roll.
   */
  window.dmRollAbilityForPlayers = async (abilityId, playerIds) => {
    if (!game.settings.get(MODULE_ID, 'enableModule')) {
      ui.notifications.warn(`${MODULE_ID} is disabled.`);
      return;
    }

    if (!game.user.isGM) {
      ui.notifications.error(`You are not the GM.`);
      return;
    }

    if (!abilityId) {
      ui.notifications.error(`An ability ID must be provided.`);
      return;
    }

    const rollVisibility = game.settings.get(MODULE_ID, 'rollVisibility');
    const whisperTargets = rollVisibility === 'self' ? [game.user.id] : [];

    for (const userId of playerIds) {
      const user = game.users.get(userId);
      if (!user || !user.character) {
        console.warn(`${MODULE_ID} | User ${userId} not found or has no assigned character.`);
        continue;
      }

      const actor = user.character;
      // Assuming dnd5e system for ability check rolling. This might need to be abstracted for other systems.
      try {
        await actor.rollAbilityTest(abilityId, {
          chatMessage: true,
          whisper: whisperTargets,
        });
        ui.notifications.info(`Rolled ${abilityId} for ${user.name}.`);
      } catch (error) {
        console.error(`${MODULE_ID} | Error rolling ability for ${user.name}:`, error);
        ui.notifications.error(`Failed to roll ${abilityId} for ${user.name}. See console for details.`);
      }
    }
  };

  /*
   * Example Macro for DM Roll:
   * To use this module, create a new Macro in Foundry VTT with the following content:
   *
   * // Replace 'str' with the desired ability (e.g., 'dex', 'int', 'wis', 'cha', 'con')
   * // Replace the player IDs with the actual user IDs of the players you want to target.
   * // You can get player IDs by typing game.users.map(u => u.id) in the console.
   * // Example: rolling Strength for player with ID 'player1Id' and 'player2Id'
   * window.dmRollAbilityForPlayers('str', ['player1Id', 'player2Id']);
   *
   * // To roll for all active players:
   * // const activePlayerIds = game.users.filter(u => u.isPlayer && u.active).map(u => u.id);
   * // window.dmRollAbilityForPlayers('dex', activePlayerIds);
   */
});
