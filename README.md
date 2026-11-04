# CompTIA A+ Core 2 Study App

Offline study app for CompTIA A+ Core 2 (220-1202), built from *The Official CompTIA A+ Core 1 and Core 2 Student Guide*, Modules 11–22.

## Files

- `index.html`, `style.css`, `app.js`: the main app (practice, flashcards, stats, reference).
- `data.js`: all questions and flashcards.
- `extras.js`: Mock Exam, shuffled answers, per-answer explanations, statistics backup (download and upload).
- `pbq-simulator.html`: PBQ practice (19 Core 2 tasks), shown inside the PBQ tab.
- `icon.svg`: app icon.

Upload all of these together. The PBQ tab and the Mock Exam depend on the other files.

## Features

- Practice by module, flashcards, weak areas, stats per lesson.
- Mock Exam: domain-weighted, timer (120 / 90 min or none), flags, review grid, estimated 100–900 score.
- PBQ practice: 19 tasks with partial credit and page references.
- Statistics backup: download progress as a JSON file and upload it later (merge or replace).

## Question bank status

- All questions are Core 2, Modules 11–22, with a Study Guide page reference and an explanation for every answer option.
- Correct answers and their explanations were checked against the cited pages for all modules.
- Wrong-answer explanations were checked for factual claims in all modules, but not read word for word.
- Flashcards were checked for word-level matches against the guide. Their content has not been reviewed fact by fact.

## Known limits

- Progress is stored in the browser only. Use the statistics download to back it up.
- The Student Guide's Core 1 and Core 2 layout differs in places from the official exam objectives; questions avoid the passages the guide itself gets wrong.
