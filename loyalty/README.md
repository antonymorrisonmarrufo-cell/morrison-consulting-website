# Clip Club — Barber Loyalty Card

A dead-simple digital loyalty card for a barber shop. Collect a stamp per haircut;
**every 10th cut is free.** Stamps can only be added by the barber (PIN-protected),
so customers can't stamp their own cards.

- **One file, no backend, no accounts, works offline.** Open `loyalty/index.html`.
- Data is stored locally on the device (browser `localStorage`), with export/import backup.
- Mobile-first — designed for a phone or tablet at the counter.

---

## The model (why it's built this way)

The key requirement is **authorisation**: a stamp must be authenticated by the barber,
not the customer. There are three ways to do that; this app uses the first because it is
the simplest and most fraud-proof for a small shop.

| Model | Where cards live | How a stamp is authorised | Trade-off |
|---|---|---|---|
| **A. Barber's device (this app)** | One phone/tablet at the counter holds all cards | Barber unlocks with a private **PIN**; the device is theirs | Simplest & safest. Cards live on one device → **must back up** |
| B. Customer's phone | Each customer's own phone | Barber types their PIN on the customer's phone to authorise each stamp | Nice "it's my card" feel, but the PIN check runs on a device the customer controls |
| C. Cloud accounts | A server | Barber scans a customer QR / logs into a dashboard | Most robust & syncs everywhere, but needs a backend, hosting, and sign-ups |

This app is **Model A**, with a **"Require PIN for every stamp"** toggle that also makes it
safe to use in a Model-B style (hand the device to the customer between visits) — every
single stamp then demands the PIN.

---

## Architecture

```
loyalty/index.html   ← the entire app (HTML + CSS + vanilla JS, no dependencies)

Browser localStorage key: "clipclub.loyalty.v1"
{
  shop:     { name, goal, salt, pinHash, recovery, createdAt },
  settings: { perStamp, autoLock },
  customers:[ { id, name, phone, stamps, lifetimeStamps, rewards, history[], createdAt, updatedAt } ]
}
```

- **PIN security:** the PIN is never stored. Only a salted **SHA-256 hash** is kept
  (via the browser's Web Crypto API). Entering a PIN re-hashes and compares.
- **Recovery:** an 8-character recovery code is shown once at setup to reset a forgotten PIN.
- **Auto-lock:** re-locks after 90s of inactivity so a customer can't grab an unlocked device.
- **Backup:** Settings → Export downloads a JSON file; Import restores it (e.g. new device,
  or after clearing the browser).

### Screens / states
`Setup → Lock ↔ Home (customer list) → Card → Settings`, plus a PIN-prompt modal for
authorising sensitive actions.

---

## End-to-end user journeys

**First-time setup (barber, once)**
1. Enter shop name and stamps-per-free-cut (default 10).
2. Create a 4-digit barber PIN (entered twice).
3. Save the recovery code somewhere safe. Done.

**A returning customer gets a haircut**
1. Barber opens the app (unlocks with PIN if locked).
2. Searches the customer by name/phone → taps their card.
3. Taps **✂ Add a stamp**. Stamp appears; card shows e.g. `9 / 10`.
4. At 9 stamps the card lights up: *"next haircut is FREE."*

**Redeeming the free cut**
1. On the free visit, barber opens the customer's card and taps **🎁 Give free haircut**.
2. The app **always** asks for the PIN here (it's the valuable action).
3. Card resets to `0 / 10`, "free cuts earned" ticks up, and it's logged in history.

**New customer**
- **+ New customer** → name (phone optional) → card created at `0 / 10`.

**Everyday safety**
- Tap the **🔒 top-right** to lock whenever the device leaves the barber's hands.
- Turn on **Require PIN for every stamp** if the device is ever shared with customers.
- **Undo last stamp** fixes an accidental tap. **Export backup** regularly.

**Forgot PIN** → *Forgot PIN?* on the lock screen → enter recovery code → set a new PIN.

---

## Edge cases handled
- Wrong PIN rejected on unlock, stamping, and redeeming.
- Can't over-stamp past the goal — you're prompted to give the free cut instead.
- Undo (with authorisation) for mis-taps.
- Duplicate names disambiguated by phone/search; each card has a unique id.
- Data loss protection via export/import and an explicit "back up regularly" nudge.
- Changing the goal keeps existing cards.

## Hosting
It's a static file. Host it anywhere (e.g. GitHub Pages / the existing site) and open
`/loyalty/`. On a phone, "Add to Home Screen" makes it feel like an app.

## Possible next steps (if a backend is ever wanted)
- Model C: customer QR codes + a small server so cards sync across devices and staff.
- SMS/email when a free cut is earned.
- Multi-staff PINs and an owner dashboard with stats.
