<!--
The "claim your badge" steps in the thank-you comment that the bot posts on every merged
community PR in flisk-sh/flisk (.github/workflows/contributor-merged.yml). Edit this file to
change the wording: the next merged PR uses it, no change in flisk needed.

Placeholders, filled in by the bot:
  {{lockedBadge}}    the locked Founding/Contributor badge image, linked to Discord
  {{badgeName}}      Founding Contributor, or Flisk Contributor once the 100 seats are gone
  {{repoUrl}}        https://github.com/flisk-sh/flisk
  {{orgUrl}}         https://github.com/flisk-sh
  {{discordInvite}}  the permanent Discord invite
  {{xPostUrl}}       an X compose link with a ready post about the merged PR (PR link included)
  {{seatsLine}}      "First 100 only. 85 left." while seats remain, empty after
  {{claimButton}}    the blue "Claim your badge" Discord button
This comment block is removed before posting.
-->
### 🎁 Your {{badgeName}} badge in 3 steps

{{lockedBadge}}

1. ⭐ [Star flisk]({{repoUrl}}) (runs your microservices and agent stacks locally with one command) and 👤 [follow flisk-sh]({{orgUrl}})
2. ✅ Get a PR merged. Done! Now 📣 [post it on X]({{xPostUrl}}), the text is ready
3. 💬 Post this PR's link in `#start-here` on [our Discord]({{discordInvite}}). Within minutes the bot gives you your number, your role, the private `#contributors` channel with the maintainers and, if your GitHub avatar is the default, an Octocat on flisk.sh.

{{seatsLine}}

{{claimButton}}
