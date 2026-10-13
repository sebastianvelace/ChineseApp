# Hanlu

Mobile-first web app for learning Mandarin. HSK 1 (150 words) plus an Everyday pattern track. Progress stays in this browser.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:4317](http://localhost:4317).

Check the lesson files with `npm run lint:content`. It fails if a word, sentence, or id does not match.

Run the local quality checks with:

```bash
npm run lint:content
npm run test
npm run lint
npm run build
```

GitHub Actions runs those checks on pushes and pull requests, then runs the production E2E suite with Chromium.

The dev server listens on port **4317**.

## What this build includes

- Onboarding: English or Spanish, pinyin shown or hidden
- HSK path and Everyday path, units unlocking in order
- Lessons: teach cards, meaning, pinyin, tones, radicals, stroke order, sentence building, fill-in
- After a pass, continue to the next lesson or the culture note
- Stroke order is stored in the app, so those quizzes work offline
- The path shows how far you are in each unit, and Practice can send you back to the next lesson

Offline use needs a production server, not `npm run dev`:

```bash
npm run build
npm start
```

`npm start` serves http://localhost:4317. Open Learn once online. After that, Learn and any lesson you already opened still load with the network off. A lesson you have never opened shows a short offline message.
- Teacher talks and unit reviews
- Practice with FSRS (`ts-fsrs`) for words you have already passed
- Daily goal, XP, and streak, saved in IndexedDB with a `localStorage` fallback

Account sync (Supabase + Google) is specified in the design package and is not required to study.
# ChineseApp
