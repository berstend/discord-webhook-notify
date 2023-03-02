const core = require("@actions/core")
const github = require("@actions/github")

const webhook = require("webhook-discord")

const default_avatarUrl =
  "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
const default_username = "GitHub"
const default_colors = {
  info: "#00ff00",
  warn: "#ff9900",
  error: "#ff0000",
}
const long_severity = {
  info: "Informational",
  warn: "Warning",
  error: "Error",
}

async function getDefaultDescription() {
  const context = github.context
  const payload = context.payload

  switch (github.context.eventName) {
    default:
      return (
        [
          ["Event", context.eventName],
          ["Repo", payload.repository?.full_name],
          ["Ref", context.ref],
          ["Base ref", context.base_ref],
          ["Tag", payload.release?.tag_name],
          ["Workflow", context.workflow],
          ["Author", payload.head_commit?.author?.name],
          ["Pusher", payload.pusher?.name],
          ["Committer", payload.head_commit?.committer?.name],
          ["Commit SHA", context.sha],
          ["Commit URL", payload.head_commit?.url],
          ["Commit Message", payload.head_commit?.message],
          [
            "Run",
            `${context.serverUrl}/${payload.repository?.full_name}/actions/runs/${context.runId}`,
          ],
        ]
          .filter(([k, v]) => !!v)
          .map(([k, v]) => `- **${k}:** ${v}`)
          .join("\n") + "\n"
      )
  }
}

async function run() {
  try {
    const webhookUrl = core.getInput("webhookUrl").replace("/github", "")
    if (!webhookUrl) {
      core.setFailed(
        "The webhookUrl was not provided. For security reasons the secret URL must be provided " +
          "in the action yaml using a context expression and can not be read as a default."
      )
      return
    }
    const severity = core.getInput("severity")
    const description = core.getInput("description")
    const details = core.getInput("details")
    const footer = core.getInput("footer")
    const text = core.getInput("text")
    const username = core.getInput("username")
    const color = core.getInput("color")
    const avatarUrl = core.getInput("avatarUrl")

    const context = github.context
    const obstr = JSON.stringify(context, undefined, 2)
    core.debug(`The event github.context: ${obstr}`)

    const hook = new webhook.Webhook(webhookUrl)

    core.info(
      `${username} ${avatarUrl} ${color} ${description} ${details} ${footer} ${text}`
    )

    const msg = new webhook.MessageBuilder()
      .setName(username || default_username)
      .setAvatar(avatarUrl || default_avatarUrl)
      .setColor(color || default_colors[severity])
      .setDescription(
        (description || (await getDefaultDescription())) + "\n" + details
      )
      .setFooter(footer || "Severity: " + long_severity[severity])
      .setText(text)
      .setTime()

    hook.send(msg)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
