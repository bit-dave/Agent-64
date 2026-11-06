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
1. Put the picture in the main folder, for example `ninja.jpg`. Use a portrait picture with the face in the upper-middle, like the others. On GitHub, open the main folder, then click **Add file > Upload files**.
2. Open `characters.js` and click the pencil icon. Add one line inside the list:
   ```js
   { code: 'NINJA', img: 'ninja.jpg', shirt: 0x222222, pants: 0x111111, hair: 0x000000 },
   ```
   `code` is the name shown in the game. The colors are for the 3D body. The face is cropped from the picture automatically.
3. Commit. The new character shows up in the lobby a minute later.

## Notes
- Online play connects phones directly to each other using WebRTC. Free public Nostr relays (via the Trystero library) are only used to find the room, so there's no server to pay for. On some strict mobile-carrier or work networks, two phones may not connect directly. If that happens, try Wi-Fi.
- The music and sound effects are made in code. The theme is original 60s spy-style music.
- The map, called "The Complex", is fictional.
