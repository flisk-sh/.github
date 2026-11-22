# Flisk profile

The public organization profile lives in [profile/README.md](profile/README.md).

This repository also holds the default community health files for every repository in [flisk-sh](https://github.com/flisk-sh) that does not have its own: [Code of Conduct](CODE_OF_CONDUCT.md), [Contributing](CONTRIBUTING.md), [Security policy](SECURITY.md), [Support](SUPPORT.md), and the issue and pull request templates in [.github/](.github/).

Contact: [hello@flisk.sh](mailto:hello@flisk.sh)

## Stalled merge queue

[`stalled-merge-queue.yml`](.github/workflows/stalled-merge-queue.yml) wakes a merge queue that GitHub stalled with entries but no batch building them (flisk-sh/flisk#5105). Add the [Flisk stalled merge queue starter](workflow-templates/flisk-stalled-merge-queue.yml) to a repo that uses a merge queue. The job needs `contents: read`, `actions: read`, `pull-requests: write` and `issues: write`; pass a `token` secret only if `GITHUB_TOKEN` cannot dequeue or enqueue. The logic and its tests are in [`scripts/`](scripts/).
