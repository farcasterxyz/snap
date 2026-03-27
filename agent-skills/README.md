# Agent Skills

This directory contains agent-facing command/skill files used to run structured workflows in this repository.

## Available Skills

- [`create-farcaster-snap/SKILL.md`](https://github.com/farcasterxyz/snap/blob/main/agent-skills/create-farcaster-snap/SKILL.md) — Generates a valid Farcaster Snap JSON from a prompt, validates with `@farcaster/snap`, and documents how to implement/deploy via `template/` on Vercel.

## Notes

- Structural truth: `spec/SPEC.md` plus `spec/elements.md` and `spec/buttons.md` (stack `root.children`, first-page rules, limits).
- Runnable servers: `snap-template` in `template/` — see `template/README.md` for env vars and Vercel.
