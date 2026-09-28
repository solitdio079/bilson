# Bilson — Film & Photography
A responsive static personal portfolio in charcoal, ivory and amber. Open `dist/index.html` through any static server. No install or build required.

Sample photographs are from Unsplash and are credited in the page and image viewer. Replace image URLs and text in `dist/index.html` and the `projects` array in `dist/app.js` with Bilson's real work. No films, clients, awards or production credits have been fabricated. Contact details have not been supplied, so the contact section currently states that they are coming soon. Replace that line with Bilson's actual email/social links before launch.

Features: responsive layout, keyboard-accessible image viewer, previous/next navigation, image credits, reduced-motion preference, native modal focus handling. SVG favicon and typographic Bilson wordmark included.

Run locally: `python3 -m http.server 5184 --directory dist`

## Deploy to Netlify

### Drag and drop (no build required)
Upload `bilson-netlify.zip` to https://app.netlify.com/drop, or drag the `dist` folder into the deploy area. The ZIP contains `index.html` at its root. Do not upload the whole source folder for a manual static deployment.

### Deploy from GitHub
Push this project folder as its own repository and import it in Netlify. The included `netlify.toml` sets the publish directory to `dist`; leave the build command empty. No dependencies, environment variables, or backend are required. If using a repository with multiple projects, set the base directory to `bilson-portfolio`.

To refresh the manual deployment ZIP after edits, run from this project folder:

```sh
python3 -c "import shutil; shutil.make_archive('bilson-netlify', 'zip', 'dist')"
```

The intro plays once per browser tab session, with a skip button. Scroll reveals and the intro respect reduced-motion settings. Images load from Unsplash and fonts from Google Fonts; these require internet access. Contact information and real portfolio work still need to be supplied before a public launch.

Netlify documentation: https://docs.netlify.com/start/quickstarts/netlify-drop-quickstart/
