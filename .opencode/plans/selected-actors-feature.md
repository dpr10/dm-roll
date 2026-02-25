# Feature: GM Roll on Selected Actors

## Overview

Add ability for GM to roll ability/skill checks for tokens selected on the canvas, in addition to rolling for player characters.

## Requirements

1. Include tokens selected on canvas in the dialog selection list
2. **Unified list**: Single multi-select with optgroup labels ("Online Players" and "Selected Tokens")
3. Unlinked actors follow `rollVisibility` setting and post to chat
4. Single data structure with `type` field (`'user'` or `'actor'`) for each selection
5. One "Select All" and one "Clear" button for the entire list
6. When no tokens selected, show only players (no message)
7. Token list is a snapshot at dialog open time (doesn't update while open)
8. Filter out tokens without actors silently
9. GM's character appears only in "Selected Tokens" (not duplicated in players)

## Files to Modify

### 1. lang/en.json

Update localization strings:

- Keep `ONLINE_PLAYERS_LABEL`: "Online Players" (for optgroup)
- Keep `SELECTED_TOKENS_LABEL`: "Selected Tokens" (for optgroup)
- Remove `NO_TOKENS_SELECTED` (no longer needed)

### 2. scripts/ui.js

Changes in `openDmRollDialog()`:

- Get selected tokens from `canvas.tokens.controlled`
- Extract actors from selected tokens (filter out tokens without actors)
- Skip GM's character to avoid duplication
- Create unified `targets` array with `{ value, label, type }` structure
- Pass `players` and `selectedActors` separately to template (for optgroup rendering)
- Update callback to filter selections by `data-type` attribute
- Route to appropriate functions based on selection type
- Single Select All/Clear handlers for the unified list

### 3. scripts/core.js

**No changes needed** - Already has:

- `dmRollAbilityForActors(abilityId, actorIds)` - Direct roll for actors
- `dmRollSkillForActors(skillId, actorIds)` - Direct roll for actors
- `dmRollAbilityForPlayers(abilityId, playerIds)` - Roll request for players
- `dmRollSkillForPlayers(skillId, playerIds)` - Roll request for players

### 4. templates/dm-roll-dialog.hbs

Update to unified list:

- Single `<select>` element with `<optgroup>` labels
- One optgroup for "Online Players", one for "Selected Tokens"
- Conditional rendering: only show tokens optgroup if `hasSelectedActors` is true
- Single set of Select All/Clear buttons
- Remove separate token section and message

### 5. scripts/module.js

**No changes needed** - Already exports all functions

### 6. styles/dm-roll.css

Update styling:

- Remove `.selected-tokens-section`, `.token-actions`, `.no-tokens-message` styles
- Keep single select styling (apply to unified list)
- Remove token-specific button styles (keep single set)

## Implementation Details

### Unified Targets Array

```javascript
const gmCharacterId = game.user.character?.id;
const selectedTokens = canvas.tokens?.controlled || [];
const targets = [];

// Add players
const players = game.users
  .filter(u => u.character && !u.isGM && u.active)
  .map(u => ({ value: u.id, label: u.name, type: 'user' }));

// Add selected tokens
for (const token of selectedTokens) {
  if (!token.actor) continue;
  if (token.actor.id === gmCharacterId) continue;
  targets.push({
    value: token.actor.id,
    label: token.actor.name,
    type: 'actor',
  });
}

const templateData = {
  abilityChoices,
  skillChoices,
  skillsByAbility,
  players,
  selectedActors: targets.filter(t => t.type === 'actor'),
  hasSelectedActors: targets.some(t => t.type === 'actor'),
};
```

### Dialog Callback with Type Routing

```javascript
const selectedOptions = Array.from(dialogEl.element.querySelector('select[name="targets"]')?.selectedOptions || []);

const selectedPlayerIds = selectedOptions.filter(opt => opt.dataset.type === 'user').map(opt => opt.value);

const selectedActorIds = selectedOptions.filter(opt => opt.dataset.type === 'actor').map(opt => opt.value);

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
}
```

### Template Structure

```handlebars
<div class='form-group targets-selection'>
  <label>{{localize 'TARGETS_LABEL'}}:</label>
  <div class='targets-container'>
    <select name='targets' multiple class='targets-select'>
      <optgroup label='{{localize "ONLINE_PLAYERS_LABEL"}}'>
        {{#each players}}
          <option value='{{this.value}}' data-type='user'>{{this.label}}</option>
        {{/each}}
      </optgroup>
      {{#if hasSelectedActors}}
        <optgroup label='{{localize "SELECTED_TOKENS_LABEL"}}'>
          {{#each selectedActors}}
            <option value='{{this.value}}' data-type='actor'>{{this.label}}</option>
          {{/each}}
        </optgroup>
      {{/if}}
    </select>
  </div>
</div>
<div class='target-actions'>
  <button type='button' class='select-all-btn'>{{localize 'SELECT_ALL_BUTTON'}}</button>
  <button type='button' class='clear-selection-btn'>{{localize 'CLEAR_BUTTON'}}</button>
</div>
```

## Testing Checklist

- [ ] Dialog opens with unified list showing optgroups
- [ ] "Online Players" optgroup always shown when players exist
- [ ] "Selected Tokens" optgroup only shown when tokens are selected
- [ ] Tokens without actors are filtered out
- [ ] GM's character doesn't appear in players optgroup
- [ ] Single Select All selects everything in visible optgroups
- [ ] Single Clear clears all selections
- [ ] Rolling for players sends whisper roll requests
- [ ] Rolling for actors creates direct chat rolls
- [ ] Actor rolls respect `rollVisibility` setting
- [ ] Mixed selections (players + tokens) work correctly
- [ ] Token list doesn't change while dialog is open
- [ ] Macro compatibility maintained
