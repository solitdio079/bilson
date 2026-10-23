# Bilson — Film & Photography

## Project
Static portfolio in `dist/`, with a password-protected admin at `/admin/` and a Netlify Function that saves `dist/content.json` to GitHub. No database. Uploaded photos are stored in `dist/assets/uploads/` in the repository; external media links are also supported. A GitHub save triggers a new deploy when the repository is connected to Netlify. Public visitors read the deployed JSON; allow the deployment to finish before checking changes.

## Deploy with GitHub + Netlify
1. Push this project as its own GitHub repository, including `dist/content.json`, `netlify/`, and `netlify.toml`. **Never commit `.env`.**
2. Import the repository in Netlify. Leave the build command empty, use `dist` as the publish directory. Functions directory is configured in `netlify.toml`. Node 22+ is required.
3. Create a fine-grained GitHub personal access token limited to this repository, with **Contents: Read and write** permission. Choose an expiry and rotate it before it expires. The target branch must allow this account to commit directly. This token is only used by the server.
4. In Netlify's environment settings, add the values below with **Functions** scope. The local ignored `.env` already contains the generated salt/hash for the requested admin password, plus a random session secret. Copy those values privately into Netlify; do not add them to frontend code or `netlify.toml`.

| Variable | Value |
| --- | --- |
| `ADMIN_USERNAME` | `Bilson` |
| `ADMIN_PASSWORD_SALT` | From local `.env` |
| `ADMIN_PASSWORD_HASH` | From local `.env` |
| `SESSION_SECRET` | From local `.env` |
| `GITHUB_TOKEN` | Repository-scoped token |
| `GITHUB_REPOSITORY` | `owner/repository` |
| `GITHUB_BRANCH` | The production branch, usually `main` |
| `GITHUB_CONTENT_PATH` | `dist/content.json` |

5. Redeploy after configuring variables. Open `/admin/`, sign in using username `Bilson` and the requested password, edit content, and select **Save to GitHub**. Confirm the new commit and successful Netlify deployment. Save conflicts preserve the draft; download it before reloading saved content.

For a monorepo, set Netlify's base to `bilson-portfolio` and `GITHUB_CONTENT_PATH` to `bilson-portfolio/dist/content.json`.

**The old static ZIP/drag-and-drop deployment does not provide the admin backend.** Use the Git-connected deployment for this version. `bilson-cms-source.zip` contains the source without secrets; it is for repository setup, not Netlify Drop. Add the private environment variables separately.

## Local preview
Node 22+ required, no package installation needed:

```sh
npm run dev
```

Open http://127.0.0.1:5185/ and http://127.0.0.1:5185/admin/. The local development server uses the same username and password authentication but saves to the **local** JSON file instead of GitHub. It never sends local saves to the production repository. The old server at port 5184 only supports static viewing.

## Content editor
- Add, edit, remove and reorder photos and videos.
- Use **Upload photos** to select one or several JPEG, PNG, WebP or GIF files (up to 3 MB each). Uploads are authenticated and checked server-side, then stored in the repository. Add titles/descriptions and select **Save to GitHub** to publish them. Uploading alone does not add images to the public collection.
- Photos can also use public HTTPS image URLs; use direct media URLs rather than sharing-page links. Removing an entry leaves the uploaded asset in the repository.
- Videos support YouTube watch/short/share URLs, Vimeo URLs (including unlisted hashes), and direct MP4/WebM/OGV links. The hosting provider must permit embedding and the visitor must have access to the video.
- Every video needs a public thumbnail image URL.
- Titles, captions, accessibility descriptions, credits and sample-image labels are editable.
- The uploaded film in `dist/assets/hero.mp4` is the fixed hero background, with a local poster and pause/play control. The first-photo hero behavior applies only when the hero uses an image; the remaining collection is shown in swipeable photo and video carousels. Viewers support keyboard navigation and stop playback when closed.
- No video is fabricated for this demo. Current stock photos are credited and labeled; replace with Bilson's real work. Contact details still need to be supplied.

## Security and validation
Passwords are checked server-side using a salted scrypt hash. Eight-hour sessions use signed HttpOnly, SameSite cookies (Secure on HTTPS). Writes require matching Origin and authentication. The function has a per-IP rate limit; verify Netlify's post-processing deploy log confirms the rule. Media URLs and video providers are validated on both client and server. GitHub's file SHA prevents overwriting a newer edit. Rotating SESSION_SECRET invalidates existing sessions.

Run `npm test` for auth, CSRF/origin, URL/provider validation, GitHub read/write and conflict checks. Real GitHub saving and live deployment still require the owner's repository/token setup.

Docs: https://docs.netlify.com/build/functions/environment-variables/ and https://docs.github.com/en/rest/repos/contents

The hero uses the supplied WhatsApp film with its original audio. Sound starts automatically where browsers permit it; otherwise select **Enable sound**. Other portfolio videos start muted. The hero has independent sound and pause controls.
