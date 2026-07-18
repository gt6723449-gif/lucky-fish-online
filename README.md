# Lucky Fish

Responsive React + Vite web game with English and Arabic support.

## Local setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Google Sheets setup

1. Create a Google Sheet.
2. Open **Extensions > Apps Script**.
3. Paste the code from `GOOGLE_APPS_SCRIPT.js`.
4. Deploy it as a web app.
5. Set access to **Anyone**.
6. Copy the web app URL.
7. Put that URL in Netlify as:

```text
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

For local development, copy `.env.example` to `.env` and replace the value.

## Contact link

Edit the contact button URL in:

```text
src/config.js
```

Change:

```js
export const CONTACT_URL = 'https://example.com/contact';
```

## Prize and target score

The target score and default prize text are also in `src/config.js`.
