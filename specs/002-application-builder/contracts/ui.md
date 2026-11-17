# Contract: UI

- **Nav**: new item "Application" (`#application`) after "My Plan".
- **My Plan item row**:
  - "✎ Details" button opens the editor dialog
  - toggles "Activity" and "Honor"
  - a summary line when details exist
- **Editor dialog** (`#detailDialog`):
  - labelled fields per data-model, with counters "n / limit" (`aria-live="polite"`) that turn to a warning style when over the limit
  - a weak-opener tip under the description
  - Save and Cancel; Escape cancels
- **Application view** (`#application`): tabs (`role="tablist"`): Activities · Honors · Brag sheet · Resume · Tips.
  - **Activities / Honors**: ordered cards showing included/overflow, ↑/↓ buttons (keyboard accessible), an Edit button, counters and completeness flags.
  - **Every document**: "📋 Copy as text" and "🖨️ Print" buttons. Printing shows only that document (`data-doc`).
  - **Tips**: general guidance plus `ST().appHints`, each with a source link.
- **Empty states**: friendly guidance linking to My Plan and career paths.
