const MODULE_ID = 'dm-roll';

async function openDmRollDialog() {
  if (!game.user.isGM) {
    ui.notifications.error('You are not the GM.');
    return;
  }

  const players = game.users.filter(u => !u.isGM).map(u => ({ value: u.id, label: u.name }));

  console.log(`${MODULE_ID} | Available players:`, players);

  if (players.length === 0) {
    ui.notifications.warn('No players found to roll for.');
    return;
  }

  const abilityChoices = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma',
  };

  const templateData = {
    abilityChoices,
    players,
  };

  const content = await foundry.applications.handlebars.renderTemplate(
    'modules/dm-roll/templates/dm-roll-dialog.hbs',
    templateData
  );

  const dialog = new foundry.applications.api.DialogV2({
    window: {
      title: 'DM Roll Ability',
      icon: 'fas fa-dice-d20',
    },
    content: content,
    buttons: [
      {
        default: true,
        action: 'roll',
        label: 'Roll',
      },
      {
        action: 'cancel',
        label: 'Cancel',
      },
    ],
    form: {
      handler: async formData => {
        const abilityId = formData.get('ability');
        const selectedPlayerIds = formData.getAll('players');

        console.log(`${MODULE_ID} | Dialog submitted - abilityId:`, abilityId, 'selectedPlayerIds:', selectedPlayerIds);

        if (!abilityId || selectedPlayerIds.length === 0) {
          ui.notifications.warn('Please select an ability and at least one player.');
          return false;
        }

        console.log(
          `${MODULE_ID} | Calling dmRollAbilityForPlayers with ability: ${abilityId}, players: ${selectedPlayerIds.join(', ')}`
        );

        await window.dmRollAbilityForPlayers(abilityId, selectedPlayerIds);
      },
    },
  });

  await dialog.render(true);
}

export function initializeUI() {
  Hooks.on('getSceneControlButtons', controls => {
    if (game.user.isGM) {
      const tokenControls = controls['tokens'];

      if (tokenControls) {
        tokenControls.tools['dm-roll'] = {
          name: 'dm-roll',
          title: 'Roll Ability Check for Players',
          icon: 'fas fa-dice-d20',
          toggle: true,
          onChange: () => {
            openDmRollDialog();
          },
        };
      }
    }
  });
}
