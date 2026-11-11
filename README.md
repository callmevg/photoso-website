# Photoso landing page

A responsive, download-first photo playground. No packages, mandatory build
step, remote fonts, analytics, or backend. All photos and screenshots are local.
The source is split into HTML, CSS, and JavaScript; the offline export remains
one self-contained HTML file.

This repository owns the website source, tests, and publishing tools. It is
independent of the Photoso iOS app repository; no app checkout is needed to
develop or publish the website. Do not copy website code back into the app.

## Preview and publish

From the repository root:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080`.

The public site is hosted at **https://callmevg.github.io/photoso/** from this
public [callmevg/photoso](https://github.com/callmevg/photoso) repository.
GitHub Pages publishes its `main` branch at the repository root.

For updates, edit the files here and run the tests below. Commit and push to
this repository's `main` branch, then wait for the Pages deployment and check
the live site. Website developer documentation and test/export tools live
alongside the static files; iOS app source does not belong in this repository.

Preserve the existing `.nojekyll`, `privacy.html`,
`support.html`, and **`style.css`**. The latter is the legal/support stylesheet,
distinct from this landing page's **`styles.css`**. Privacy and support retain
their original URLs and content. Do not mirror this folder with deletion
enabled, which would remove those existing pages.

For a single offline HTML file with images and the upstream license embedded:

```sh
node bundle.mjs /tmp/photoso-standalone.html
```

Only the download, support, privacy, and terms links need an internet connection.

The social preview URL assumes the existing marketing destination,
`https://callmevg.github.io/photoso/`. If hosting elsewhere, update
`og:image` to the new absolute URL for `assets/social.jpg`.

All download CTAs point to the verified App Store ID `6763928712`. Support,
privacy, and terms use the existing public destinations.
Safari can show Apple's native Smart App Banner using the same verified ID.
See [Apple's Smart App Banner guidance](https://developer.apple.com/documentation/webkit/promoting-apps-with-smart-app-banners).

## Visual direction and provenance

The revised design uses the existing logo's violet, lavender, and warm cream,
with token-based light/dark themes. It deliberately replaces the original
brochure layout with oversized scan-first type, a 3D photo fan, a pointer-reactive
ASCII texture, and a scroll-triggered download dock. The dock is hidden at
the top, appears as soon as the page scrolls down, and hides on return to
the top. Restored scroll positions are respected. There are four direct download
entry points, including the swipe completion and Place Reveal sections.
The header/navigation bar is removed; the motion pause control sits beside
the sample-photo counter instead.

The positioning is now **a free-to-download, private everyday gallery**.
Pockets, enjoyable cleanup, maps, and map reels supply the feature proof.
The daily swipe allowance appears only in the collapsed pricing FAQ.
Optional purchases remain disclosed next to download CTAs.
A numeric download-size claim is withheld until the released size is verified.

Removed the floating photo ornaments, decorative coordinates/stars, duplicate
three-step recap, extra map steps, repeated privacy section, final CTA panel,
theme button, numbered tab decorations, and confetti. The photo stack still
tilts and swipes; motion pause and system light/dark appearance remain.

The page does not claim "AI-free": Pocket similarity uses Apple's on-device
Vision. The supported promise is local processing without cloud AI uploads.
The privacy FAQ explains this alongside the published no-tracking policy.

Researched and checked November 11, 2026:

- **Initial template:** [8B Linea](https://github.com/8bsite/app-landing-page-template),
  created October 16, 2026; MIT. Its base accessibility utilities, hero entrance,
  and reduced-motion-gated view-timeline reveals remain adapted in the redesign.
  Its original layout is no longer used. [License](LICENSE) is retained.
- **2025 alternative evaluated:** [bohd4nx/app-landing](https://github.com/bohd4nx/app-landing),
  created February 19, 2025; MIT. Its app-first screenshot/FAQ organization
  informed the page structure. No source code copied.
- **Visual inspiration:** [Awwwards photography collection](https://www.awwwards.com/websites/photographic/):
  editorial scale, photo-led storytelling, generous space.
  Inspiration only; no proprietary layouts or assets copied.
- **Launch-page research:** [Swipe Sort on Product Hunt](https://www.producthunt.com/products/swipe-sort),
  discoverable through search. Direct Product Hunt access returned HTTP 403;
  its full page was not inspected or copied. The interaction-first hook uses
  Photoso's own documented behavior, not a claimed endorsement or award.
- **Motion references:** [React Bits ASCII Text](https://reactbits.dev/text-animations/ascii-text)
  and its tilted-card approach were evaluated for a more playful interaction
  vocabulary. No React Bits source, dependencies, fonts, or assets are copied.
  Its license includes Commons Clause restrictions; it is not plain MIT.
  The canvas torus and CSS perspective behavior here are local implementations
  and do not require React, Three.js, WebGL, or a motion library.

The default rose theme was intentionally replaced at the user's request to
match Photoso's actual branding. Component colors still use `--cp-*` tokens.
The interactive demo is labeled sample content and does not request photo access.

## Assets and content

- `icon.png`: originally resized from the iOS app's brand assets.
- `camera-*.jpg`: three candid-feeling, commercially usable photographs
  selected from Unsplash and Pexels. [Sources and license records](ASSETS.md)
  are retained and embedded in the offline export. They are self-hosted;
  visitors do not contact the photo providers.
- `screen-*.jpg`: resized versions of the existing iPhone App Store screenshots.
- `duo-*.jpg`: expanded-display screenshots from the iOS app's App Store assets.
- `ipad-*.jpg`: iPad screenshots from the iOS app's App Store assets.
- Dedicated Pocket-detail captures exist only for iPhone. The Duo/iPad Pocket
  preview uses the corresponding real library capture and says so in its
  caption; no unverified device UI is fabricated.
- `social.jpg`: resized from the existing product-page creative.
- Facts were checked against the iOS product spec, English store description,
  and public App Store listing. No invented user counts, reviews, savings, or
  sale prices. The original app source is not required by the website tools.

## Interactions and accessibility

- Pointer/touch swipes, explicit Keep/Bin buttons, undo, replay, and polite
  status announcements. Demo decisions are in memory only.
- Focus the sample stack and use Left/Right to Bin/Keep.
- Vertical screenshot tabs support Up/Down, Home/End, and roving focus.
- The device selector changes all four feature previews to the chosen device.
- ASCII drawing is capped at 10 fps and pauses offscreen, in background tabs,
  with Reduce Motion, or via the motion toggle. It uses a static frame when
  motion is disabled. Pointer parallax only runs for a fine mouse pointer.
- Replay/undo remain available. Completion puts keyboard focus on the
  real download link; decorative confetti has been removed.
- A user-initiated, 11-second illustrated Place Reveal zooms from a country
  into a city, drops a photo pin, opens a circle, and shows three sample photos.
  It is visibly labeled as an illustration, not an app recording or real route.
  Pause/resume/replay, offscreen/background suspension, and static playback
  when motion is disabled are supported. It loads no map tiles or video.
- [Place Reveal asset brief](PLACE-REVEAL-ASSET.md) specifies the real video,
  photo selection, export, poster, compression, rights, and privacy checks
  needed to replace the illustration with an authentic app export.
- Native FAQ disclosures, skip link, visible focus, image descriptions,
  and reduced-motion support.
- Theme follows the device by default. `?clawpilotTheme=light` or `dark`
  overrides it. There is no extra theme button.
- Navigation, App Store links, FAQ, and the first screenshot work without JS.
- Safe-area padding, 44px-or-larger controls, width-based responsive layouts,
  and an enhanced horizontal viewport-segment layout for supporting foldable
  browsers. No user-agent sniffing or locked screen orientation.

## Validation

Browser checked at 320×568, 390×844, 430×932, Duo-sized 466×678 and 951×669,
768×1024, 1366×1024, 1440×900, and 1920×1080 viewports. Verified no horizontal
overflow, an above-fold hero download button, and an in-bounds download dock
at every size. These are browser emulations, not physical-device certification;
an actual Duo hinge/pose check remains a device-level follow-up.
The browser emulator did not expose a two-segment CSS viewport when display
features were requested, so the segment-specific enhancement remains unverified.

Native emulated touch drag, mouse parallax, undo, replay, keyboard decisions,
gallery/device selection, FAQ, light/dark appearance, animated ASCII changes, and
pause-to-static behavior were also checked.

Quick syntax and structural checks (Node.js 18+):

```sh
node --test site.test.mjs
```
