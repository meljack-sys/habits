# Habits, Together: Control

## Status (as of 2026-10-31)
- Pushed 2026-10-31 (third batch): Today goes back to one wide themed box per life area (3-4 habits per row inside, areas stacked); Bills cards are one fixed size showing the last 2 payments (no notes), with full history, notes, edit and add-payment in a pop-out. Live check: PENDING.
- Pushed 2026-10-31 (second batch, from Muhammed's review): Today shows one tile per life area with a done count; Log button reads "Record transaction", type buttons are short (Expense, Refund, Income, Cash out, Lent, Repaid, Bill), picking an option no longer jumps to the amount; Bills show name, Planned/Paid/Left in large dark type with one-line notes; weight shown with two decimals (91.00). Live check: PENDING.
- Pushed 2026-10-31 (12 commits, up to 9a1efe0): Money (average-spend strip, bill payments in Log, no amount arrows, 6-month category table with drill-down, clickable budget rows, Bills grid, monthly exchange rates, Excel/CSV/JSON export) and outside Money (5 period tabs on Dashboard and Impact, denser laptop layout, new weight chart, Setup fold/unfold). Only tested on sample data. Live check on phone and laptop: PENDING.
- First Money open after this push asks for October's exchange rates (Muhammed's phone only).
- Week tab is still one long column on laptop (not changed, not asked).
- Full money export added (commit 826e9c7): Money > Dashboard > Money report > "Export all money details (CFO)". One JSON file, all time. Live check on phone: PENDING.
- Live: https://meljack-sys.github.io/habits/ (GitHub Pages, repo meljack-sys/habits, public)
- App is split into index.html, styles.css, app.js (commit b17b325). Live check on phone after the split: DONE 2026-10-28, works. Snapshot job checked on sample data: OK.
- Weekly review removed. Impact is month-to-date. Only the monthly coach review remains.
- Test runs on 2026-10-25 (content refresh) and 2026-10-28 (coach catch-up) failed with "usage limit reached". Watch the real runs on Nov 1 and Nov 3.
- Domain: bought at Cloudflare (name not yet recorded here). Habits is not private yet (family code in the URL is the only lock).
- Move to Cloudflare in progress. Step 1 (create Cloudflare Pages project from the repo, get the .pages.dev address) is with Muhammed. Nothing changed in the app or repo yet.
- Known risk: the family code is visible in the public repo (snapshot.py default address), so treat it as exposed. Only the Firebase rules step truly locks the data.

## Scheduled tasks
| Task | When (Cairo time) | State |
| --- | --- | --- |
| Monthly coach review | 1st, 08:23 | On |
| Coach catch-up (writes last month if missing) | 1st and 2nd, 10:07 | On |
| Monthly content refresh | 3rd, 05:47 | On |
| Weekly coach review | | Off |
| Old weekly content refresh | | Off |

## Roadmap
1. Done 2026-10-28: live app works after the split.
2. Finish any features wanted before the move.
3. Buy domain at Cloudflare (personal account). DONE.
4. Move habits, in this order: (a) Cloudflare Pages project from the repo, (b) habits.[domain] attached, (c) both phones open the new link, (d) repo private, (e) Cloudflare Access login, (f) Firebase sign-in in the app, then rules, plus snapshot.py sign-in.
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
- The CFO export is one JSON file with every entry, bill payment, bill month and the budget setup. Field names are always English. The older "Export CSV for the ledger" stays as it is (September import format).
- Money pages show the average daily spend strip at the top. Log can record a Bill payment; it writes to the same bill records as the Bills section.
- Exchange rates are entered every month and apply to that month only. Budget lines are kept in SAR (old lines convert on first budget save).
- "Where the money goes" is a table: last 6 months plus an average of completed months with spending. It counts logged entries only, not bill payments.
- Budget amounts can be typed in EGP, SAR or AED; the line is kept as a SAR amount and EGP follows each month's rate.
- Weights are always shown with two decimals.
- Today: one wide box per life area, never several areas side by side. Area name is not repeated on each row; shared habits show "Together".
- Bills: every card is the same size and shows only the last 2 payments (no notes). History, notes, edit, delete and add payment live in a pop-out.
- Money export comes as Excel, CSV and JSON, all with the same totals.
- Period tabs everywhere outside Money: Last week, This week, This month, Last month, All time.
- Setup sections fold; habit areas start folded, Expand all / Collapse all on top.
- Move order keeps the old GitHub Pages site live until both phones work on the new address. The repo goes private only after that, because a private repo stops the old site.
- Sign-in code goes into the app and is tested on both phones before the database rules are locked. Locking first would stop sync and the snapshot.
- A new address means fresh phone storage: each phone opens the full link with #f=code once. The coach key comes from that code.
- Snapshot only commits when the data changed, so Cloudflare builds stay well under the free limit.

## Rules
- One change per commit. Nothing pushed until "push".
- Render every tab in English and Arabic before pushing.
- Bump ?v= in index.html when styles.css or app.js changes.
- Search for the function and read only that part. Never open whole files.
