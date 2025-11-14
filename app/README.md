# Just Intonation - App Documentation

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project Overview

Just Intonation is an ear training app designed to help musicians develop accurate pitch recognition and interval matching skills. The app uses a state machine-based learning system, MIDI input handling, and contextual settings to provide customized practice experiences.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/` - Next.js app directory
  - `page.tsx` - Home page with app introduction
  - `layout.tsx` - Root layout
  - `learn/` - Main learning interface
- `components/` - React components
  - `learn/` - Learning UI components (piano, visualizations)
  - `learningApproachUI/` - Settings and configuration components
  - `providers/` - Context providers for state management
  - `ui/` - Reusable UI primitives
  - `icon/` - SVG icon components
- `constants/` - Application constants
  - `settingDescriptions.tsx` - Master bank of setting descriptions
  - `settings.tsx` - Settings types and defaults
  - `termDefinitions.tsx` - Musical term definitions
- `lib/` - Utility functions and helpers
- `machines/` - State machines for learning logic
- `public/` - Static assets (audio files, etc.)
