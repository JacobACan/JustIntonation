# LLM Guidelines for JustIntonation App

## General Principles

When using LLMs (Large Language Models) to assist with this project, follow these principles to keep outputs simple, focused, and effective:

### 0. Misc

- Don't Verify the build workds correctly
- Don't Create Summary md files while executing Phases
- Always Update all .md "how tos"

### 1. Simplicity Over Comprehensiveness

- Avoid over-complicated solutions
- Work with existing file structures and patterns—don't introduce unnecessary new folders or files
- Generate only what's needed for the immediate task
- Keep descriptions and explanations concise (1-2 sentences each)

### 2. Content Reusability & Efficiency

- Define terms, descriptions, and content once in a master location (e.g., `constants/termDefinitions.tsx`, `constants/settingDescriptions.tsx`)
- Reference these definitions throughout the app to avoid duplication
- This reduces redundancy and makes updates easier across the entire codebase

### 3. Code Should Be Self-Explanatory

- Write clean, well-structured code that doesn't require extensive documentation
- Use clear variable names and logical organization
- Avoid generating separate documentation files—the code itself should tell the story
- Focus on implementation rather than documentation

### 4. Integration First, New Structure Last

- Always work within existing patterns and file structures first
- Only create new components/files when existing patterns won't work
- Understand how the app is currently organized before making suggestions
- Propose changes that fit naturally into the current architecture

### 5. Understand Interconnections

- Each phase of development builds on previous phases
- All features should work together seamlessly
- Avoid duplicating functionality that's already being built in other phases
- Think holistically about how each part contributes to the whole

### 6. When Creating Plans

- Don't include Success Criteria, Testing phases, or Timeline Estimates unless explicitly requested
- Focus on actionable tasks and required files
- Keep phases focused and distinct
- Number and organize logically so work flows naturally

### 7. Content Guidelines

- Preserve the core essence of original content when simplifying
- Identify the key concepts the creator values most
- Enhance clarity without losing important meaning
- Keep language accessible to beginners while remaining technically accurate

### 8. Icon & Component Locations

- Verify actual file locations before suggesting changes
- Icons are located in `components/icon/`, not `components/ui/`
- Leverage existing UI components before creating new ones
- Check the actual folder structure before implementing

### 9. Building on Existing Features

- Review what's already implemented before proposing new features
- If a play button already exists, build on it rather than creating new UI elements
- Reuse existing pages instead of creating new ones unless absolutely necessary
- Ask about existing functionality before suggesting replacements

### 10. Master Bank Approach

- Create central constants files for shared content (descriptions, terms, definitions)
- These become single sources of truth for content throughout the app
- Makes it easy for coders to reference and reuse content
- Simplifies future updates and maintenance

## Example Structure

When organizing content in constants:

```typescript
// constants/termDefinitions.tsx
// Enum of referencable terms for use throughout the app
// Each definition is concise and can be displayed contextually

// constants/settingDescriptions.tsx
// Master bank of all setting descriptions
// Referenced by setting components as needed
```

## When to Ask for Clarification

- Before creating new files or folders—understand the existing structure first
- When a feature might already exist in the codebase
- If it's unclear how multiple proposed changes should work together
- When the best approach isn't obvious given the current architecture

## Output Format

- Use markdown for clarity and readability
- Show file modifications with context
- Suggest files to create/modify, don't just describe them
- Be specific about locations and purposes

---

## Summary

The goal is to create a lean, focused implementation where:

- Content is centralized and reusable
- Code is clean and self-explanatory
- Changes work together seamlessly
- The existing architecture is respected and built upon
- Plans are focused on action, not process overhead
