
<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=waving&height=240&color=0:0A0A0E,45:34244F,100:EE924E&text=TDK%20CLI&fontColor=F7EFE2&fontSize=72&fontAlignY=35&desc=Start%20services%20on%20your%20machine.&descAlignY=58&descSize=18">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=240&color=0:F7EFE2,45:D8D0FF,100:EE924E&text=TDK%20CLI&fontColor=0A0A0E&fontSize=72&fontAlignY=35&desc=Start%20services%20on%20your%20machine.&descAlignY=58&descSize=18" alt="TDK CLI. Start services on your machine." width="100%">
</picture>

<h3>Start your services on your machine.</h3>

<p>
TDK CLI — generate and run your whole tech stack without the setup pain
Go from an empty folder to a running tech stack with one command. Built for agents.
Define each service once in `service.json`, then run `tdk up`. No Kubernetes, no Compose file to maintain. Production stays on Helm.
</p>

<p>
Docker runs the containers. Tilt runs the dev loop. TDK CLI writes that config.
</p>

<p>
Use TDK CLI when you are an engineer or tech lead already running several services and are tired of local Compose, Dockerfiles, and a week of setup. If Compose already works for you, skip TDK CLI.
</p>

<p>
  <a href="https://github.com/tdk-landscape/tdk-cli-core"><img src="https://img.shields.io/github/stars/tdk-landscape/tdk-cli-core?style=for-the-badge&logo=github&label=Star%20tdk-cli-core&color=EE924E" alt="Star tdk-cli-core on GitHub"></a>
  <a href="https://www.npmjs.com/package/@tdk-landscape/tdk-cli-core"><img src="https://img.shields.io/npm/v/@tdk-landscape/tdk-cli-core?style=for-the-badge&logo=npm&color=34244F" alt="npm version"></a>
  <a href="https://github.com/tdk-landscape"><img src="https://img.shields.io/github/followers/tdk-landscape?style=for-the-badge&logo=github&label=Follow&color=D8D0FF&labelColor=0A0A0E" alt="Follow tdk-landscape on GitHub"></a>
  <a href="https://github.com/tdk-landscape/tdk-cli-core/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tdk-landscape/tdk-cli-core?style=for-the-badge&color=0A0A0E" alt="MIT license"></a>
</p>

<p>
  <a href="https://tdk-landscape.github.io/tdk-website/"><strong>Website</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/tdk-landscape/awesome-tdk-framework"><strong>Awesome TDK CLI</strong></a>
  &nbsp;·&nbsp;
  <a href="https://tdk-landscape.github.io/tdk-website/docs/quickstart/"><strong>Quickstart</strong></a>
  &nbsp;·&nbsp;
  <a href="https://tdk-landscape.github.io/tdk-website/docs/examples/"><strong>Examples</strong></a>
  &nbsp;·&nbsp;
  <a href="https://tdk-landscape.github.io/tdk-demo-animation/"><strong>Demo</strong></a>
</p>

</div>

---

## Try it in 30 seconds

```sh
npm install -g @tdk-landscape/tdk-cli-core
tdk project --yes                                      # set up the project
tdk resource orders-api --type backend --stack shop    # scaffold a service
tdk up shop                                            # run it with hot reload
```

⭐ **If TDK CLI helps you start your local services, [star tdk-cli-core](https://github.com/tdk-landscape/tdk-cli-core).** Stars help other developers find it.

## Why TDK CLI

| | Compose | Local Kubernetes | Tilt | **TDK CLI** |
|---|---|---|---|---|
| Scaffold a new service in one command | ❌ | ❌ | ❌ | ✅ |
| Hot reload on file change | ⚠️ | ⚠️ | ✅ | ✅ |
| Health-checked startup order | ⚠️ | ✅ | ⚠️ | ✅ |
| Proxy, Postgres, monitoring included | ❌ | ❌ | ❌ | ✅ |
| Needs a cluster | No | Yes | Optional | **No** |
| Start one stack of a large system | ⚠️ | ⚠️ | ⚠️ | ✅ `tdk up <stack>` |

<p><small>Fixture benchmark only: a generated <code>/health</code> fixture with 100 services, all healthy in 112 s, 1.6 GiB total memory, 0 OOM kills on a 16 GB machine. This is a scale fixture, not the TDK CLI product example. <a href="https://github.com/tdk-landscape/tdk-cli-core/blob/main/docs/benchmarks/scale-bench.md">See the benchmark →</a></small></p>

## Repositories

### Start here

| Repo | What it is |
| --- | --- |
| ⭐ [**tdk-cli-core**](https://github.com/tdk-landscape/tdk-cli-core) | The CLI. Starts your services on your machine from one `service.json`, then `tdk up`. Not a deploy, not a Compose file. No Kubernetes. |
| [tdk-website](https://github.com/tdk-landscape/tdk-website) | Docs for TDK CLI. Start services locally. Not a deploy tool. |
| [tdk-landscape.github.io](https://github.com/tdk-landscape/tdk-landscape.github.io) | Install script for TDK CLI, then `tdk up`. |
| [create-tdk-stack](https://github.com/tdk-landscape/create-tdk-stack) | Landing page to start a TDK CLI project. Same commands as the quickstart. |
| [tdk-cli-releases](https://github.com/tdk-landscape/tdk-cli-releases) | Prebuilt TDK CLI binaries for Linux and macOS, with checksums. |
| [tdk-demo-animation](https://github.com/tdk-landscape/tdk-demo-animation) | Recorded walkthrough: install TDK CLI, generate a service, open the local health URL. |

### Examples

| Repo | What it is |
| --- | --- |
| [tdk-example](https://github.com/tdk-landscape/tdk-example) | Smallest TDK CLI example: two stacks, four services, started locally. |
| [tdk-saas-starter](https://github.com/tdk-landscape/tdk-saas-starter) | Local SaaS dashboard and a checkout button. Not a billing deploy. |
| [tdk-restaurant-example](https://github.com/tdk-landscape/tdk-restaurant-example) | Reservations, kitchen, menu, and floor, started locally. |
| [tdk-user-management](https://github.com/tdk-landscape/tdk-user-management) | Identity admin, portal, and compliance stacks on your machine. Not a hosted IdP. |
| [tdk-ecommerce-example](https://github.com/tdk-landscape/tdk-ecommerce-example) | Vue 3 storefront and a Hono catalog API on your machine. |
| [tdk-auth-queue-email-example](https://github.com/tdk-landscape/tdk-auth-queue-email-example) | Local OIDC, NATS JetStream, and Mailpit. Not production auth or email. |
| [tdk-docker-compose-example](https://github.com/tdk-landscape/tdk-docker-compose-example) | Run the TDK CLI inside Docker Compose so the host needs no install. The product is still a local stack. |
| [tdk-erp-system](https://github.com/tdk-landscape/tdk-erp-system) | Scale fixture: 100 generated health services. Not an ERP product. |
| [tdk-labs](https://github.com/tdk-landscape/tdk-labs) | Lessons for TDK CLI. Each lesson starts a local stack. |

### Ecosystem

| Repo | What it is |
| --- | --- |
| [awesome-tdk-framework](https://github.com/tdk-landscape/awesome-tdk-framework) | Curated links for TDK CLI examples and docs. Not a runtime. |
| [tdk-skills](https://github.com/tdk-landscape/tdk-skills) | Agent skills for the `service.json` contract. Agents run `tdk up` locally. |

## How it works

```text
Project                 one repo, one local landscape
  Stack                 a business slice: shop, identity, kitchen…  →  tdk up <stack>
    Resource            one API, frontend, worker, or database
      service.json      what it is and what it depends on
      .autogenerated/   generated local development wiring
```

Generated files are plain local plumbing you can read, not a hidden platform.

## Contributing

Issues labeled [`good first issue`](https://github.com/tdk-landscape/tdk-cli-core/labels/good%20first%20issue) are the best place to start. See [CONTRIBUTING.md](https://github.com/tdk-landscape/tdk-cli-core/blob/main/CONTRIBUTING.md). Built something with TDK CLI? [Open an issue](https://github.com/tdk-landscape/tdk-cli-core/issues/new/choose) and we'll add it here.

<div align="center">

**TDK CLI — start services on your machine.**

<a href="https://github.com/tdk-landscape/tdk-cli-core"><img src="https://img.shields.io/badge/Get_started-tdk--cli--core-EE924E?style=for-the-badge&logo=github" alt="Get started with tdk-cli-core"></a>

</div>
