# Habits, Together

A shared habit tracker for two people. Static site (GitHub Pages) with a small Firebase database for sync.

## Files
- `index.html`: page shell only. When `styles.css` or `app.js` changes, bump the `?v=` on its two tags so phones fetch the new file.
- `styles.css`: the whole look.
- `app.js`: all the logic, the Arabic dictionary and `PROFILE_Q` (the deep-profile questions).
- `content.json`: daily quotes, facts and stories (refreshed monthly by a scheduled task).
- `coach.json`: encrypted monthly coach review.
- `snapshot.json`, `snapshot.py`, `.github/workflows/snapshot.yml`: encrypted copy of the data that the coach task reads.
- `coach_tool.py`: encrypt and decrypt helper for `coach.json` and `snapshot.json`.

## Working on it
- Find the function with a search, then read only that part. Do not open whole files.
- Change one thing per commit. Test by rendering each tab in English and Arabic before pushing.
