Implement "Combo Neural" and Score Multipliers.

### User Benefits
- Higher scores for fast reactions.
- Visual feedback for performance.
- More depth to the leaderboard.

### Technical Details
- Update `useGameStore.ts` to include `combo`, `maxCombo`, and `multiplier` state.
- Update `GameArena.tsx` to calculate reaction time on each correct answer.
- Implement multiplier logic:
    - Reaction < 0.5s: Increase combo, multiplier up to 4x.
    - Reaction < 1.0s: Maintain combo, multiplier up to 2x.
    - Reaction > 1.0s: Reset combo, 1x multiplier.
- Update `updateScore` in the store to respect the current multiplier.
- Add visual combo indicator in `GameArena.tsx`.

### Step-by-Step Plan
1.  **Modify `useGameStore.ts`**:
    - Add `combo`, `maxCombo`, and `multiplier` to state.
    - Update `updateScore` to multiply points by current multiplier.
    - Add `increaseCombo` and `resetCombo` actions.
    - Update `startGame` to reset these values.
2.  **Update `GameArena.tsx`**:
    - Track the time when a command was shown using a `lastCommandTime` state.
    - On `handleAction` (if correct), calculate `reactionTime = now - lastCommandTime`.
    - Based on `reactionTime`, call `increaseCombo` or `resetCombo`.
    - Add a visual `ComboBadge` component to display the current multiplier and combo streak.
3.  **Visual Polish**:
    - Add animations to the combo indicator using `framer-motion`.
    - Show a floating "+X" text near the score when a multiplier is active.
