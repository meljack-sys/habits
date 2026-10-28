# Habits, Together: Control

## Status (as of 2026-10-28)
- Live: https://meljack-sys.github.io/habits/ (GitHub Pages, repo meljack-sys/habits, public)
- App is split into index.html, styles.css, app.js (commit b17b325). Live check on phone after the split: PENDING.
- Weekly review removed. Impact is month-to-date. Only the monthly coach review remains.
- Domain: NOT bought yet. Habits is not private yet (family code in the URL is the only lock).

## Scheduled tasks
| Task | When (Cairo time) | State |
| --- | --- | --- |
| Monthly coach review | 1st, 08:23 | On |
| Coach catch-up (writes last month if missing) | 1st and 2nd, 10:07 | On |
| Monthly content refresh | 3rd, 05:47 | On |
| Weekly coach review | | Off |
| Old weekly content refresh | | Off |

## Roadmap
1. Confirm the live app works after the split.
2. Finish any features wanted before the move.
3. Buy domain at Cloudflare (personal account).
4. Move habits to habits.[domain], private repo, Cloudflare Access login, Firebase sign-in and rules.
5. Re-test data snapshot and monthly coach tasks after the move.
6. Workspace Home page.
7. CFO app (private from day one), Islamic book app, others.

## Decisions
- Every habit counts equal in scoring. Impact numbers are month-to-date.
- Week starts on Sunday.
- Average daily spend = total spent / recorded days that have passed; unrecorded days are skipped and shown.
- Cash withdrawals and transfers are recorded but do not count as spending.
- Anything over budget or bad is true red, not orange.
- Arabic is plain white Arabic. Qur'an and hadith are always Arabic.
- Coach content is written automatically and retried on failure, without asking.

## Rules
- One change per commit. Nothing pushed until "push".
- Render every tab in English and Arabic before pushing.
- Bump ?v= in index.html when styles.css or app.js changes.
- Search for the function and read only that part. Never open whole files.
