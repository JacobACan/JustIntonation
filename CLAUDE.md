# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JustIntonation is a piano-based ear training web app that helps musicians develop relative pitch recognition. Users connect a MIDI keyboard and identify notes, melodies, and chords played in various keys and scales. Deployed at https://just-intonation.vercel.app/.

## Commands

- **Dev server**: `pnpm dev` (Next.js with Turbopack)
- **Build**: `pnpm build`
- **Start production**: `pnpm start`
- **Format**: `pnpm prettier --write .`

No test framework or linter is configured.

## Tech Stack

- Next.js 15 (App Router, Turbopack), React 19, TypeScript 5 (strict)
- XState 5 for state machines, @react-midi/hooks for MIDI input
- Tailwind CSS 4, Shadcn/ui (New York style), Radix UI primitives
- Prettier with prettier-plugin-tailwindcss
- pnpm package manager

## Architecture

### State Machines (XState)

The app is driven by two XState state machines, not hooks-first patterns:

1. **musicLearner** (`machines/musicLearningProcess.ts`) — Main learning loop: IDLE → SELECTING_LEARNING_APPROACH → PLAYING_MUSIC_CONTEXT → PLAYING_NEW_QUESTION → GUESSING → REVIEWING → VIEWING_RESULTS. Actor functions live in `lib/learningProcessActors.tsx`.

2. **scalesQuizMachine** (`machines/scalesQuizProcess.ts`) — Diatonic scale conceptualization quiz with similar state flow. Actor functions in `lib/scalesQuizActors.ts`.

### Provider Pattern

Each feature uses React Context wrapping an XState actor ref:
- `components/providers/learningStateMachineProvider.tsx` — MusicLearnerContext
- `components/providers/scalesQuizProvider.tsx` — ScalesQuizMachineContext
- `components/providers/settingsProvider.tsx` — Settings with localStorage persistence
- `components/providers/countdownProvider.tsx` — Timer state

### Audio System

`lib/webAudio.tsx` wraps Web Audio API with global nodes (audioContext, masterGainNode, learningStateGainNode, cadenceGainNode). Audio samples are OGG files in `public/notes/` and `public/cadences/`. Three playback methods: playNote, playChord, playMelody.

### MIDI Input

MIDI event handlers in `components/learn/midiInputUserEvents/` (notes.tsx, melodies.tsx, chords.tsx) capture input and dispatch to the learning state machine for evaluation.

### Musical Theory Constants

`constants/` contains the core domain model:
- `notes.tsx` — Note enum (88 keys: A0-C8) and MIDI mappings (21-108)
- `keys.tsx` — 12 keys with frequencies
- `scale.tsx` — Scale definitions (major, minor, modes, chromatic)
- `intervals.tsx` — Interval enums (semitone-based, unison through octave)
- `settings.tsx` — Settings interface and defaults
- `settingDescriptions.tsx` — Centralized UI text for all settings

### Piano Visualization

`components/learn/piano.tsx` — SVG-based piano with configurable display range, color-coded pressed keys (primary/secondary), and click handlers.

### Routes

- `/` — Home/welcome page
- `/learn` — Main ear training mode
- `/conceptualize/scales` — Diatonic scale visualization and quiz

## Conventions

- Custom icons go in `components/icon/`, not `components/ui/`
- Shadcn/ui components live in `components/ui/` (configured via `app/components.json`)
- Path alias `@/*` maps to the project root
- Shared content uses a "master bank" approach — centralize reusable constants rather than duplicating
- `settingDescriptions.tsx` and `constants/` are the single source of truth for domain content
- CSS custom properties for theming defined in `app/globals.css` (--background, --foreground, --middleground1, piano key colors)
- Font: M_PLUS_1_Code (Google Fonts)
