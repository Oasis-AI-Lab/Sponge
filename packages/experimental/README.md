# experimental/ — private experimental packages

English | [中文](README.zh.md)

This group contains prototypes and internal-only Cordis plugins that use the repository's real runtime without joining an official release. Its packages are private, carry no stability or support promise, and retain the same engineering, security, documentation, lifecycle, testing, and snapshot requirements as release packages.

| Package | Role | ctx key |
|---|---|---|
| `agent-team/` | Implicit-root Agent Teams roster, durable peer mailbox, shared task DAG, and runtime coordination | `ctx.agentTeams` |
| `tool-agent-team/` | Scoped model-facing Agent Teams tools and collaboration guidance | — |
| `move-up-detector/` | Shadow-mode Move Up detector over the session event feed: replaceable judgment implementations, retained observations, and a corpus harness | `ctx.moveUpDetector` |
| `move-up-space/` | Move Up MVP closed loop: promotes a judged conversation chunk into a durable Space object, then recalls it through a `space_recall` tool | `ctx.tools` |

The [subtree rules](AGENTS.md) define dependency isolation, release exclusion, and promotion.
