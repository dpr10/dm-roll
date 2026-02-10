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

  // Define abilities and skills based on D&D 5e system
  const abilityChoices = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma',
  };

  // Define skills grouped by ability based on D&D 5e system
  const skillChoices = {
    // Strength-based skills
    ath: { label: 'Athletics', ability: 'str' },

    // Dexterity-based skills
    acr: { label: 'Acrobatics', ability: 'dex' },
    soh: { label: 'Sleight of Hand', ability: 'dex' },
    ste: { label: 'Stealth', ability: 'dex' },

    // Intelligence-based skills
    arc: { label: 'Arcana', ability: 'int' },
    his: { label: 'History', ability: 'int' },
    inv: { label: 'Investigation', ability: 'int' },
    nat: { label: 'Nature', ability: 'int' },
    rel: { label: 'Religion', ability: 'int' },

    // Wisdom-based skills
    ani: { label: 'Animal Handling', ability: 'wis' },
    ins: { label: 'Insight', ability: 'wis' },
    med: { label: 'Medicine', ability: 'wis' },
    prc: { label: 'Perception', ability: 'wis' },
    sur: { label: 'Survival', ability: 'wis' },

    // Charisma-based skills
    dec: { label: 'Deception', ability: 'cha' },
    itm: { label: 'Intimidation', ability: 'cha' },
    prf: { label: 'Performance', ability: 'cha' },
    per: { label: 'Persuasion', ability: 'cha' },
  };

  // Group skills by ability for the template
  const skillsByAbility = {};
  for (const [skillId, skillData] of Object.entries(skillChoices)) {
    if (!skillsByAbility[skillData.ability]) {
      skillsByAbility[skillData.ability] = {};
    }
    skillsByAbility[skillData.ability][skillId] = skillData;
  }

  const templateData = {
    abilityChoices,
    skillChoices,
    skillsByAbility,
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
          const abilitySkillValue = formData.get('abilitySkill');
          const selectedPlayerIds = formData.getAll('players');

          if (!abilitySkillValue || selectedPlayerIds.length === 0) {
            ui.notifications.warn('Please select an ability or skill and at least one player.');
            return false; // Keep dialog open
          }

          // Parse the selected value to determine if it's an ability or skill
          const [type, id] = abilitySkillValue.split(':');

          if (type === 'ability') {
            await dmRollAbilityForPlayers(id, selectedPlayerIds);
          } else if (type === 'skill') {
            await dmRollSkillForPlayers(id, selectedPlayerIds);
          } else {
            ui.notifications.error('Invalid selection. Please select an ability or skill.');
            return false; // Keep dialog open
          }
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

  // Attach event listeners after the dialog is rendered
  setTimeout(() => {
    const selectAllBtn = dialog.element.querySelector('.select-all-btn');
    const clearSelectionBtn = dialog.element.querySelector('.clear-selection-btn');
    const playersSelect = dialog.element.querySelector('.players-select');

    if (selectAllBtn && playersSelect) {
      // Remove any existing event listeners to avoid duplicates
      selectAllBtn.onclick = null;
      selectAllBtn.onclick = event => {
        event.preventDefault();
        event.stopPropagation();
        // Select all options in the players select
        Array.from(playersSelect.options).forEach(option => {
          option.selected = true;
        });
      };
    }

    if (clearSelectionBtn && playersSelect) {
      // Remove any existing event listeners to avoid duplicates
      clearSelectionBtn.onclick = null;
      clearSelectionBtn.onclick = event => {
        event.preventDefault();
        event.stopPropagation();
        // Clear all selections in the players select
        Array.from(playersSelect.options).forEach(option => {
          option.selected = false;
        });
      };
    }
  }, 100); // Slight delay to ensure DOM is fully ready
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
