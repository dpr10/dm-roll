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

/**
 * Allows the DM to roll a skill check for specified players.
 * @param {string} skillId The ID of the skill to roll (e.g., "athletics", "persuasion").
 * @param {string[]} playerIds An array of user IDs for whom to roll.
 */
export async function dmRollSkillForPlayers(skillId, playerIds) {
  console.log(`${MODULE_ID} | Rolling ${skillId} for players:`, playerIds);

  if (!game.settings.get(MODULE_ID, 'enableModule')) {
    ui.notifications.warn(`${MODULE_ID} is disabled.`);
    return;
  }

  if (!game.user.isGM) {
    ui.notifications.error(`You are not the GM.`);
    return;
  }

  if (!skillId) {
    ui.notifications.error(`A skill ID must be provided.`);
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

    console.log(`${MODULE_ID} | Rolling ${skillId} for ${user.name}`);

    const actor = user.character;
    // D&D 5e specific implementation - use the proper API to roll skill checks directly
    try {
      // Get the skill data - in D&D 5e, skill IDs are 3-letter abbreviations
      const skill = actor.system.skills[skillId];
      if (!skill) {
        // Log available skills for debugging
        console.log(`${MODULE_ID} | Available skills on actor:`, Object.keys(actor.system.skills));
        throw new Error(
          `Skill ${skillId} not found on actor. Available skills: ${Object.keys(actor.system.skills).join(', ')}`
        );
      }

      // Calculate the skill modifier (proficiency bonus + ability modifier + misc bonuses)
      const modifier = skill.total || 0;

      // Create the roll formula (1d20 + modifier)
      const rollFormula = `1d20${modifier >= 0 ? '+' : ''}${modifier}`;

      // Create and execute the roll
      const roll = new Roll(rollFormula, actor.getRollData());
      await roll.evaluate({ async: true });

      // Get the skill label for display
      const skillLabel = CONFIG.DND5E.skills[skillId]?.label || skillId.toUpperCase();

      // Create the chat message
      const chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        flavor: `${skillLabel} Check (${actor.name})`,
        rolls: [roll],
        rollMode: whisperTargets.length > 0 ? CONST.DICE_ROLL_MODES.PRIVATE : CONST.DICE_ROLL_MODES.PUBLIC,
      };

      if (whisperTargets.length > 0) {
        chatData.whisper = whisperTargets;
      }

      // Display the roll in chat
      await ChatMessage.create(chatData);

      console.log(`${MODULE_ID} | Successfully rolled ${skillId} for ${user.name}`);
      ui.notifications.info(`Rolled ${skillId} for ${user.name}.`);
    } catch (error) {
      console.error(`${MODULE_ID} | Error rolling skill for ${user.name}:`, error);
      ui.notifications.error(`Failed to roll ${skillId} for ${user.name}. See console for details.`);
    }
  }
}
