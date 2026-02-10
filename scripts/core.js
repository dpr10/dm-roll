const MODULE_ID = 'dm-roll';

/**
 * Allows the DM to send a request to players to roll an ability check.
 * @param {string} abilityId The ID of the ability to roll (e.g., "str", "dex").
 * @param {string[]} playerIds An array of user IDs for whom to roll.
 */
export async function dmRollAbilityForPlayers(abilityId, playerIds) {
  console.log(`${MODULE_ID} | Sending ability roll request for ${abilityId} to players:`, playerIds);

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

  // Send a message to each player requesting them to roll
  for (const userId of playerIds) {
    const user = game.users.get(userId);
    if (!user || !user.character) {
      console.warn(`${MODULE_ID} | User ${userId} not found or has no assigned character.`);
      continue;
    }

    if (!user.active) {
      console.warn(`${MODULE_ID} | User ${userId} is not active (online). Skipping roll request.`);
      continue;
    }

    console.log(`${MODULE_ID} | Sending roll request to ${user.name} for ${abilityId}`);

    // Prepare template data
    const templateData = {
      formula: `${CONFIG.DND5E.abilities[abilityId]?.label || abilityId.toUpperCase()} Check`,
      buttonClass: 'ability-roll-button',
      dataType: 'ability',
      dataValue: abilityId,
      userId: userId,
      label: CONFIG.DND5E.abilities[abilityId]?.label || abilityId.toUpperCase(),
    };

    // Render the template
    const content = await renderTemplate('modules/dm-roll/templates/chat-roll-request.hbs', templateData);

    // Create a chat message that only the target player can see
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ alias: game.user.name }),
      content: content,
      whisper: [user.id], // Whisper to the specific player
    };

    // Display the message in chat
    await ChatMessage.create(chatData);
  }

  console.log(`${MODULE_ID} | Sent ability roll requests to ${playerIds.length} players for ${abilityId}`);
  ui.notifications.info(`Sent ability roll requests to ${playerIds.length} players.`);
}

/**
 * Allows the DM to send a request to players to roll a skill check.
 * @param {string} skillId The ID of the skill to roll (e.g., "athletics", "persuasion").
 * @param {string[]} playerIds An array of user IDs for whom to roll.
 */
export async function dmRollSkillForPlayers(skillId, playerIds) {
  console.log(`${MODULE_ID} | Sending skill roll request for ${skillId} to players:`, playerIds);

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

  // Send a message to each player requesting them to roll
  for (const userId of playerIds) {
    const user = game.users.get(userId);
    if (!user || !user.character) {
      console.warn(`${MODULE_ID} | User ${userId} not found or has no assigned character.`);
      continue;
    }

    if (!user.active) {
      console.warn(`${MODULE_ID} | User ${userId} is not active (online). Skipping roll request.`);
      continue;
    }

    console.log(`${MODULE_ID} | Sending roll request to ${user.name} for ${skillId}`);

    // Prepare template data
    const skillLabel = CONFIG.DND5E.skills[skillId]?.label || skillId.toUpperCase();
    const templateData = {
      formula: `${skillLabel} Check`,
      buttonClass: 'skill-roll-button',
      dataType: 'skill',
      dataValue: skillId,
      userId: userId,
      label: skillLabel,
    };

    // Render the template
    const content = await renderTemplate('modules/dm-roll/templates/chat-roll-request.hbs', templateData);

    // Create a chat message that only the target player can see
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ alias: game.user.name }),
      content: content,
      whisper: [user.id], // Whisper to the specific player
    };

    // Display the message in chat
    await ChatMessage.create(chatData);
  }

  console.log(`${MODULE_ID} | Sent skill roll requests to ${playerIds.length} players for ${skillId}`);
  ui.notifications.info(`Sent skill roll requests to ${playerIds.length} players.`);
}

/**
 * Handles the player's roll when they click the button in the GM's message.
 * @param {string} abilityId The ID of the ability to roll (e.g., "str", "dex").
 * @param {string} userId The ID of the user making the roll.
 * @param {string} type The type of roll ("ability" or "skill").
 */
export async function handlePlayerRoll(abilityId, userId, type = 'ability') {
  if (game.userId !== userId) {
    ui.notifications.error('You are not authorized to make this roll.');
    return;
  }

  const user = game.users.get(userId);
  if (!user || !user.character) {
    ui.notifications.error("You don't have a character assigned.");
    return;
  }

  const actor = user.character;

  try {
    let rollFormula;
    let rollLabel;

    if (type === 'ability') {
      // Get the ability data
      const ability = actor.system.abilities[abilityId];
      if (!ability) {
        throw new Error(`Ability ${abilityId} not found on actor`);
      }

      // Calculate the ability modifier
      const modifier = ability.mod || ability.value || 0;

      // Create the roll formula (1d20 + modifier)
      rollFormula = `1d20${modifier >= 0 ? '+' : ''}${modifier}`;
      rollLabel = `${CONFIG.DND5E.abilities[abilityId]?.label || abilityId.toUpperCase()} Check (${actor.name})`;
    } else if (type === 'skill') {
      // Get the skill data
      const skill = actor.system.skills[abilityId];
      if (!skill) {
        throw new Error(`Skill ${abilityId} not found on actor`);
      }

      // Calculate the skill modifier
      const modifier = skill.total || 0;

      // Create the roll formula (1d20 + modifier)
      rollFormula = `1d20${modifier >= 0 ? '+' : ''}${modifier}`;
      const skillLabel = CONFIG.DND5E.skills[abilityId]?.label || abilityId.toUpperCase();
      rollLabel = `${skillLabel} Check (${actor.name})`;
    } else {
      throw new Error(`Unknown roll type: ${type}`);
    }

    // Create and execute the roll
    const roll = new Roll(rollFormula, actor.getRollData());
    await roll.evaluate({ async: true });

    // Create the chat message - make it public
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      flavor: rollLabel,
      rolls: [roll],
      rollMode: CONST.DICE_ROLL_MODES.PUBLIC, // Public roll
    };

    // Display the roll in chat
    await ChatMessage.create(chatData);

    console.log(`${MODULE_ID} | Player rolled ${abilityId} successfully`);
    ui.notifications.info(`You rolled ${rollLabel}`);
  } catch (error) {
    console.error(`${MODULE_ID} | Error rolling for player:`, error);
    ui.notifications.error(`Failed to roll. See console for details.`);
  }
}
