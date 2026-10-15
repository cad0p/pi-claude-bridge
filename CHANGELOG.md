# Changelog

All notable changes to this project will be documented in this file.

## [calver-released]

<!-- USER-EDITABLE SECTION START -->
<!-- Add your curated release notes here. -->
<!-- USER-EDITABLE SECTION END -->

### 🐛 Bug Fixes

- Carry Claude Code's own image and oversized tool results across rebuilds (closes #6)

### 💼 Other

- Fork Claude Code's session when /tree goes back to an earlier turn, instead of rebuilding it
- Say so when no earlier request is repeated whole
- Carry Claude Code's session-start context across rebuilds so the history stays cached
- Narrow the rebuild known issue to the triggers this fix does not cover
- Also carry the instructions attachment across rebuilds
- Match Claude Code's tool_result shape and carry tool-result-anchored context across rebuilds
- Keep the RPC harness's session links out of the real agent dir
- Rebuild empty tool results as Claude Code's note, drop blocks the live path drops, test the key-order call site

### ⚙️ Miscellaneous Tasks

- Publish the fork as @cad0p/pi-claude-bridge with semver-calver-release (closes #1)
- Revert CHANGELOG edit (curation happens on the release PR)
- Publish the fork as @cad0p/pi-claude-bridge with semver-calver-release (closes #1)
- Require node >=22.19.0, matching pi (closes #3)


