import {
  dmRollAbilityForPlayers,
  dmRollSkillForPlayers,
  dmRollAbilityForActors,
  dmRollSkillForActors,
} from './core.js';

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

  const gmCharacterId = game.user.character?.id;

  const playerCharacterIds = new Set(
    game.users
      .filter(u => u.character && !u.isGM && u.active)
      .map(u => u.character.id)
  );

  const selectedTokens = canvas.tokens?.controlled || [];
  const selectedActors = [];

  for (const token of selectedTokens) {
    if (!token.actor) continue;
    if (token.actor.id === gmCharacterId) continue;
    if (playerCharacterIds.has(token.actor.id)) continue;
    selectedActors.push({
      value: token.actor.id,
      label: token.actor.name,
    });
  }

  const players = game.users
    .filter(u => u.character && !u.isGM && u.active)
    .map(u => ({ value: u.id, label: u.name }));

  if (players.length === 0 && selectedActors.length === 0) {
    ui.notifications.warn('No players or tokens found to roll for.');
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
    slt: { label: 'Sleight of Hand', ability: 'dex' },
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
    selectedActors,
    hasSelectedActors: selectedActors.length > 0,
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
          const hiddenInput = dialogEl.element.querySelector('input[name="abilitySkill"]');
          const abilitySkillValue = hiddenInput ? hiddenInput.value : null;

          const selectedOptions = Array.from(
            dialogEl.element.querySelector('select[name="targets"]')?.selectedOptions || []
          );

          const selectedPlayerIds = selectedOptions.filter(opt => opt.dataset.type === 'user').map(opt => opt.value);

          const selectedActorIds = selectedOptions.filter(opt => opt.dataset.type === 'actor').map(opt => opt.value);

          if (!abilitySkillValue || (selectedPlayerIds.length === 0 && selectedActorIds.length === 0)) {
            ui.notifications.warn('Please select an ability or skill and at least one target.');
            return false;
          }

          const [type, id] = abilitySkillValue.split(':');

          if (type === 'ability') {
            if (selectedPlayerIds.length > 0) {
              await dmRollAbilityForPlayers(id, selectedPlayerIds);
            }
            if (selectedActorIds.length > 0) {
              await dmRollAbilityForActors(id, selectedActorIds);
            }
          } else if (type === 'skill') {
            if (selectedPlayerIds.length > 0) {
              await dmRollSkillForPlayers(id, selectedPlayerIds);
            }
            if (selectedActorIds.length > 0) {
              await dmRollSkillForActors(id, selectedActorIds);
            }
          } else {
            ui.notifications.error('Invalid selection. Please select an ability or skill.');
            return false;
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
    const targetsSelect = dialog.element.querySelector('.targets-select');

    // Handle custom ability/skill dropdown
    const customSelectTrigger = dialog.element.querySelector('.custom-select-trigger');
    const customSelectOptions = dialog.element.querySelector('.custom-options');
    const selectedValueSpan = dialog.element.querySelector('.selected-value');
    const hiddenInput = dialog.element.querySelector('.ability-skill-hidden-input');
    const arrow = dialog.element.querySelector('.arrow');

    if (customSelectTrigger && customSelectOptions) {
      // Toggle dropdown visibility when clicking the trigger
      customSelectTrigger.onclick = () => {
        const isOpen = customSelectOptions.style.display !== 'none';
        customSelectOptions.style.display = isOpen ? 'none' : 'block';
        arrow.classList.toggle('open', !isOpen);
      };

      // Handle option selection
      const options = dialog.element.querySelectorAll('.option');
      options.forEach(option => {
        option.onclick = () => {
          // Update the hidden input value
          hiddenInput.value = option.dataset.value;

          // Update the displayed value
          selectedValueSpan.textContent = option.textContent;

          // Close the dropdown
          customSelectOptions.style.display = 'none';
          arrow.classList.remove('open');

          // Highlight selected option
          options.forEach(opt => opt.classList.remove('selected'));
          option.classList.add('selected');
        };
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', event => {
        if (!customSelectTrigger.contains(event.target) && !customSelectOptions.contains(event.target)) {
          customSelectOptions.style.display = 'none';
          arrow.classList.remove('open');
        }
      });
    }

    if (selectAllBtn && targetsSelect) {
      selectAllBtn.onclick = null;
      selectAllBtn.onclick = event => {
        event.preventDefault();
        event.stopPropagation();
        Array.from(targetsSelect.options).forEach(option => {
          option.selected = true;
        });
      };
    }

    if (clearSelectionBtn && targetsSelect) {
      clearSelectionBtn.onclick = null;
      clearSelectionBtn.onclick = event => {
        event.preventDefault();
        event.stopPropagation();
        Array.from(targetsSelect.options).forEach(option => {
          option.selected = false;
        });
      };
    }
  }, 100);
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
