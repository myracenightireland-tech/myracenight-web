# Working agreement

- Start every response with a short TL;DR before any detail.
- Only change what was explicitly asked. Do not touch unrelated
  code, copy, or config. If a change seems necessary but was not
  asked for, stop and ask rather than doing it and reporting it
  afterwards.
- Start every session with git pull.
- Never connect to the production database. PROD_DATABASE_URL may
  be present in the environment; do not use it.
- Money-path changes and migrations: branch and PR, never
  self-merge.
- Long output (SQL, diffs, plans) goes into a committed file, not
  the chat response.
- Backend deploys before frontend when migrations are involved.
