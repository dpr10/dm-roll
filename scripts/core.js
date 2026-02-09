const MODULE_ID = 'dm-roll';

/**
 * Allows the DM to roll an ability check for specified players.
 * @param {string} abilityId The ID of the ability to roll (e.g., "str", "dex").
 * @param {string[]} playerIds An array of user IDs for whom to roll.
 */
export async function dmRollAbilityForPlayers(abilityId, playerIds) {
  console.log(`${MODULE_ID} | Rolling ${abilityId} for players:`, playerIds);

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

  console.log(`${MODULE_ID} | Roll visibility: ${rollVisibility}, whisper targets:`, whisperTargets);

  for (const userId of playerIds) {
    const user = game.users.get(userId);
    if (!user || !user.character) {
      console.warn(`${MODULE_ID} | User ${userId} not found or has no assigned character.`);
      continue;
    }

    console.log(`${MODULE_ID} | Rolling ${abilityId} for ${user.name}`);

    const actor = user.character;
    // D&D 5e specific implementation - use the proper API to roll ability checks directly
    try {
      // Create the roll directly using the D&D 5e system's internal methods
      // First, get the ability data
      const ability = actor.system.abilities[abilityId];
      if (!ability) {
        throw new Error(`Ability ${abilityId} not found on actor`);
      }

      // Calculate the ability modifier
      const modifier = ability.mod || ability.value || 0;

      // Create the roll formula (1d20 + modifier)
      const rollFormula = `1d20${modifier >= 0 ? '+' : ''}${modifier}`;

      // Create and execute the roll
      const roll = new Roll(rollFormula, actor.getRollData());
      await roll.evaluate({ async: true });

      // Create the chat message
      const chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        flavor: `${CONFIG.DND5E.abilities[abilityId]?.label || abilityId.toUpperCase()} Check (${actor.name})`,
        rolls: [roll],
        rollMode: whisperTargets.length > 0 ? CONST.DICE_ROLL_MODES.PRIVATE : CONST.DICE_ROLL_MODES.PUBLIC,
      };

      if (whisperTargets.length > 0) {
        chatData.whisper = whisperTargets;
      }

      // Display the roll in chat
      await ChatMessage.create(chatData);

      console.log(`${MODULE_ID} | Successfully rolled ${abilityId} for ${user.name}`);
      ui.notifications.info(`Rolled ${abilityId} for ${user.name}.`);
    } catch (error) {
      console.error(`${MODULE_ID} | Error rolling ability for ${user.name}:`, error);
      ui.notifications.error(`Failed to roll ${abilityId} for ${user.name}. See console for details.`);
    }
  }
}
