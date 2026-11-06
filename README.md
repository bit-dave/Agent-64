# AGENT 64: THE COMPLEX
An N64-style first-person shooter for phones. You can play online with friends or offline against bots. Made by Zed Head Games.

## Put it online (GitHub Pages, free)
1. Sign in at github.com, then click **+ > New repository**. Name it something like `agent64`, set it to **Public**, and click **Create repository**.
2. On the new repo page, click **uploading an existing file**.
3. On your iPhone, unzip `agent64-iphone.zip` in the Files app. In GitHub, tap **Add file > Upload files > choose your files**, then select all 16 files in the unzipped folder (there are no subfolders). Tap **Commit changes**.
4. Open **Settings > Pages**. Under "Build and deployment", set Source to **Deploy from a branch**, choose Branch **main** and folder **/(root)**, then click **Save**.
5. Wait about 1–2 minutes, then refresh. Your link appears at the top of that page, for example `https://YOURNAME.github.io/agent64/`.

## Play with friends
1. Everyone opens the link on their phone. Safari and Chrome both work.
2. On the title screen, tap **JOIN LOBBY**, then pick your agent and nickname.
3. One person taps **CREATE ROOM** and reads out the 4-letter code.
4. Everyone else types that code and taps **JOIN WITH CODE**. Finding each other can take 5–20 seconds.
5. Optional: tap **Voice** to talk. Allow the microphone, then choose Open Mic or Push-to-Talk.
6. The host can add bots and set the kill and time limits, then taps **START MATCH**.

**Play solo:** tap **PLAY VS BOTS** and choose 1–5 bots on Easy, Normal or Hard.

## Controls
- **Look:** move the phone. On iPhone, allow "Motion & Orientation". You can also drag on the right side of the screen. 📱 turns motion look on or off, ⌖ re-centers the view, and ⚙ has the sensitivity settings.
- **Move:** the joystick at bottom-left.
- **FIRE:** bottom-right. **JUMP:** just above Fire. **↻:** switches weapon.
- **On a computer:** WASD to move, mouse to look (click to lock the pointer), Space to jump, Q or the mouse wheel to switch weapons, 1–8 to pick a weapon, Tab for scores, and hold T to talk.

## Add a new character later
1. Get a full-body picture of the character standing and facing forward, with the face in the upper middle, like the others. Name it something simple, for example `ninja.jpg`.
2. In the repo, tap **Add file > Upload files** and upload the picture into the same main folder as everything else.
3. Open `characters.js`, tap the pencil icon, and add one line at the end of the list:
   ```js
   { code: 'NINJA', img: 'ninja.jpg' },
   ```
   That's all you need. The game cuts out the face, shirt and pants from the picture by itself.
   Optional: you can also add `hair: 'long'` (or `'short'`, `'curly'`, `'dreads'`, `'fur'`, `'hat'` or `'bald'`), plus colors like `hairColor: 0x3a2010`, `beard: 0xa0502a`, `hat: 0x6a4428` or `sleeves: 0x333333`, or `shortSleeves: true` for a T-shirt.
   If the face comes out off-center, add `face: [left, top, width, height]` using fractions of the picture. The existing lines in `characters.js` show examples.
4. Tap **Commit changes**. The new character shows up in the lobby a minute later.

## Notes
- Online play connects phones directly to each other using WebRTC. Free public Nostr relays (via the Trystero library) are only used to find the room, so there's no server to pay for. On some strict mobile-carrier or work networks, two phones may not connect directly. If that happens, try Wi-Fi.
- The music and sound effects are made in code. The theme is original 60s spy-style music.
- The map, called "The Complex", is fictional.

## Controls (Settings → Control Configuration, also on start screen & lobby; saved on device)
1. **Motion look** – left stick moves, tilt phone (gyro) + drag right side to look. FIRE / JUMP / switch buttons.
2. **Dual stick** – left stick moves, right stick looks. Adjustable sensitivity + invert Y. Buttons sit above/left of the right stick (portrait & landscape).
3. **Bluetooth controller** (Gamepad API, standard mapping – Xbox / PlayStation / MFi):
   - Left stick move, right stick look
   - RT / R2 fire, A / Cross jump
   - Y / Triangle or RB next weapon, LB previous weapon
   - Start = menu / scoreboard
   - Menus: D-pad or left stick to move, A select, B back, left/right to change options
   - Touch controls hide while a pad is active; connecting a pad offers to switch automatically.
   - Settings: sensitivity, invert Y, deadzone.

## v5 (iPhone fixes)
- **No forced rotation.** The game always renders in the browser's real orientation. With Portrait Orientation Lock ON you play in portrait (fully supported); turn the lock OFF to play in landscape.
- **Safe areas:** HUD and controls respect the notch / home bar (`viewport-fit=cover` + `env(safe-area-inset-*)`), and size to the *visible* viewport (`visualViewport` / `100dvh`) so Safari's toolbar can't cover them.
- **Weapon strip:** owned weapons show as a compact tappable row (KNF PST SHT MG LSR GRN RKT MIN) under the top bar; current weapon + ammo sits above JUMP. ↺ still cycles.
- **Performance:** Settings → PERFORMANCE → Render quality *Auto* (default; lowers resolution when FPS < 40, raises it back when smooth) / Low / Medium / High, plus a *Show FPS* counter. The lobby preview's 2nd WebGL context is released when you leave the lobby; bot line-of-sight checks no longer allocate.
- **Full screen:** Share → *Add to Home Screen* launches without Safari bars.
