import { dmRollAbilityForPlayers } from './core.js';

const MODULE_ID = 'dm-roll';
let dmRollDialog = null;

async function openDmRollDialog() {
  if (!game.user.isGM) {
    ui.notifications.error('You are not the GM.');
    return;
  }

  // Prevent opening multiple instances
  if (dmRollDialog) {
    dmRollDialog.bringToFront();
    return;
  }

  const players = game.users.filter(u => u.character && !u.isGM).map(u => ({ value: u.id, label: u.name }));

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
        action: 'roll',
        label: 'Roll',
        callback: async (_1, _2, dialogEl) => {
          const formData = new FormData(dialogEl.element.querySelector('form'));
          const abilityId = formData.get('ability');
          const selectedPlayerIds = formData.getAll('players');

          if (!abilityId || selectedPlayerIds.length === 0) {
            ui.notifications.warn('Please select an ability and at least one player.');
            return false; // Keep dialog open
          }

          await dmRollAbilityForPlayers(abilityId, selectedPlayerIds);
        },
        default: true,
      },
      {
        action: 'cancel',
        label: 'Cancel',
      },
    ],
  });

  dmRollDialog = dialog;
  dialog.addEventListener('close', () => {
    dmRollDialog = null;
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
