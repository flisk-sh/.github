# Flisk North Star

## The direction

Help a developer go from an idea or an existing codebase to a working, healthy
multi-service application with the least possible setup and maintenance effort.

## The metric

**Weekly active projects with a healthy Flisk-managed stack.**

A project counts once in a week when `flisk up` started it and every service
passed its health check. Stars, downloads and repository count are not the
metric.

Why this one: it measures value delivered, not interest. It includes the whole
core path (services found, dependencies wired, stack started, checks green),
and its four-week retention shows whether Flisk is still useful after the first
try.

## Who it is for

A developer or small team running several services (and often agents) on their
own laptop who does not want to hand-write Compose, Tilt or proxy config.

## Supporting measures

| Measure | Question it answers |
| --- | --- |
| Time to first healthy stack | How fast is the first success? |
| First-run success rate | How often does the first try work? |
| Weekly active projects | Is it used again? (the North Star) |
| Four-week retention | Is it still useful after the first try? |

## How repositories connect

Every repository in this organisation declares one measured headline metric in
`gel.json` under `north_star`, and says how it helps the metric above. The
[GEL](https://github.com/flisk-sh/gel) `north-star` guard checks that the metric
exists, that a result is recorded, and that it is fresh. GEL enforces the
evidence. It does not choose the direction; this file does.

## How we measure it

Opt-in, privacy-preserving telemetry only. Measured usage is reported apart
from self-reported adopters. Until telemetry ships, the metric is reported as
"not yet measured", never estimated.

## What we deliberately do not build

- A production cluster orchestrator. Flisk is for the local inner loop.
- Kubernetes manifest generation (Helm, Kustomize, Flux and Argo stay with the
  user's own workflow).
- Anything whose success we can only claim, not measure.
