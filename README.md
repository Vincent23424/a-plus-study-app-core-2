# A+ Core 2 Study App

A free CompTIA A+ Core 2 (220-1202) study PWA covering Modules 11–22.

## Current Build

- **1,333 questions**: 798 original + 535 new questions with a Study Guide page reference and an explanation for every answer option
- Module and All Modules quizzes
- **Final Test — 75-question exam mode**
- **Mock Exam**: domain-weighted (OS 28%, Security 28%, Software Troubleshooting 23%, Operational Procedures 21%), timer (120/90 min or none), flag for review, review grid, estimated 100–900 score, per-domain results and full answer review
- **PBQ Simulator** (`pbq-simulator.html`): 19 realistic Core 2 performance-based tasks and a Core 2 mock exam that includes PBQs
- Random Practice
- New Questions, Weak Areas, Wrong Questions and Starred Questions
- Flashcard Review
- PBQ & Lab terminal exercises with 37 practical scenarios
- Reference section for ports, protocols, commands, security, backups, scripting and other Core 2 topics
- **Commands Quiz** with command → function and function → command practice
- 3-Module Challenge
- Randomized questions and answer choices
- Explanations after every normal practice question
- Study Readiness and module statistics
- LocalStorage progress tracking
- Responsive design
- **Dark mode by default + Light mode toggle**

## Source Scope

Based on the supplied:

- **CompTIA A+ Core 2 (220-1202) Student Guide — Modules 11–22 only**
- **CompTIA A+ 220-1202 Exam Objectives, Version 4.0**

All study content in the app is based on the supplied Core 2 source material.

## Technology

HTML, CSS, JavaScript, LocalStorage and GitHub Pages.

Built with **AI-assisted development** as a personal CompTIA A+ study project.

## Disclaimer

This is an independent personal project and is not affiliated with, sponsored by, or endorsed by CompTIA.

The app is intended as a study aid and should be used alongside the official CompTIA exam objectives and study materials.


## Commands Quiz

- Dedicated quiz for Core 2 Windows commands and management tools.
- Tests both command-to-function and function-to-command recall.
- Uses only commands/tools already represented in the supplied Core 2 study material.

## Recent UI Improvements

- Mobile navigation is now a dedicated full-width horizontal row and no longer competes with the theme or Final Test controls.
- Mobile navigation buttons have larger touch targets and horizontal scrolling on narrow screens.
- Header controls are compacted on very small screens to prevent overflow.
- Dark mode remains the default, with Light mode available.
- Light-mode styling covers the Reference hero and flashcard back.
- Final Test remains a 75-question all-module exam mode with no explanations during the test.

## Files

- `index.html`, `style.css`, `app.js`, `data.js`: the main app
- `extras.js`: Mock Exam, shuffled answers, per-answer explanations and page references
- `pbq-simulator.html`: stand-alone PBQ simulator (works offline, no network requests)

## Known issues in the Student Guide

Some printed facts in the Student Guide are wrong or unclear (for example the boot log file name on p. 491 is `ntbtlog.txt`, not `ntblog.txt`). New questions avoid these points or test only the part that is correct.

## Question bank status

- All questions are Core 2, Modules 11–22, with a Study Guide page reference and an explanation for every answer option.
- Section check (guide sections with no question, then new questions added where needed): all modules 11–22.
- Correct-answer and explanation check against the cited pages: all modules 11–22 have been checked. Wrong-answer explanations have not been read one by one in any module.
