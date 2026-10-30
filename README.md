# CICG Pledge Tracker

Full HD TV tracker. Starts at **$135M**, target **$600M**. Each new pledge plays a full-screen flag and amount animation, then adds that money to the total.

Once this is deployed, yes — the TV just opens a URL.

- **TV in the room:** `https://YOUR-APP-URL/`
- **You, announcing pledges:** `https://YOUR-APP-URL/control`

Leave the TV browser on the first URL, fullscreen. From your laptop or phone, open `/control` and announce. The room screen updates live.

Anyone with the link can open `/control`. There is no PIN or login.

## Deploy online (Render)

1. Push this repo to GitHub.
2. In [Render](https://render.com), create a **New Web Service** from that repo.
3. Render will use `render.yaml`. After it deploys you get a public URL, for example `https://cicg-tracker.onrender.com`.
4. On the TV, open the root URL and go fullscreen. On your device, open `/control`.

GitHub Pages / Netlify static hosting will **not** work: the TV and the operator need a live server so pledges sync.

## Run locally

```bash
npm install
npm run dev
```

- TV display: http://localhost:5173
- Operator console: http://localhost:5173/control

## During the event

1. Search the donor country (for example `U.K.`).
2. Enter the amount in millions of USD (`90`).
3. Click **Announce**. The TV shows the flag and amount, then the bar moves toward $600M.

Undo last pledge or reset to $135M from the operator panel. Start and target figures can be changed there too.
