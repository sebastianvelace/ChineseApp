# Hanlu

Mobile-first web app for learning Mandarin. HSK 1 (150 words) plus an Everyday pattern track. Progress stays in this browser.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:4317](http://localhost:4317).

The dev server listens on port **4317**.

## What this build includes

- Onboarding: English or Spanish, pinyin shown or hidden
- HSK path and Everyday path, units unlocking in order
- Lessons: teach cards, meaning, pinyin, tones, radicals, stroke order, sentence building, fill-in
- After a pass, continue to the next lesson or the culture note
- Stroke order is stored in the app, so those quizzes work offline
- The path shows how far you are in each unit, and Practice can send you back to the next lesson
- Teacher talks and unit reviews
- Practice with FSRS (`ts-fsrs`) for words you have already passed
- Daily goal, XP, and streak, saved in `localStorage`

Account sync (Supabase + Google) is specified in the design package and is not required to study.
