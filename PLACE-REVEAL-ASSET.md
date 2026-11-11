# Place Reveal: the exact video to create

## Deliverables

1. **One real Photoso Share Video export**, portrait 9:16, 1080×1920,
   30 fps, H.264 MP4. Use the original file, not a WhatsApp/social download.
2. **One web version**, 720×1280, H.264, no audio, preferably 12–18 seconds
   and at most **4,000,000 bytes**. Keep the original export too.
3. **One poster image**, 720×1280 JPEG, ideally below 100 KB, showing the
   first fully revealed photo. Keep important detail clear behind a play button.

Suggested handoff names:

- `place-reveal-original.mp4`
- `place-reveal.mp4`
- `place-reveal-poster.jpg`

Provide their local paths. The original does not need to be committed to this
repository. The eventual website assets belong in `assets/`.

## The scene

Pick **one public place you have personally photographed**: a waterfront,
campus landmark, concert venue exterior, or a favorite public viewpoint.
Use **four different photos from that pin**, rather than four near-duplicates:

1. An immediately appealing portrait-oriented photo for the circular reveal.
2. A wider view that establishes the place.
3. A detail or candid moment you have permission to publish.
4. A strong final image that still looks good when playback stops.

Use your own work or assets with permission for public promotional use.
Do not use a home, dorm room, private address, or a location you want hidden.
The map animation visibly reveals the pin even though exports omit location
metadata. Check faces, license plates, messages, and other private details.

## In Photoso

1. Open **Photo Map** and find the chosen pin.
2. Long-press the pin, or use VoiceOver's **Play Place Reveal** action.
3. Use the photo-stack **Choose Photos** control to select the four photos.
   The app plays them in date order; choose a set whose date order tells the story.
4. Choose **Map** for a legible country/city-to-street sequence.
   Satellite is a useful optional second take, not required.
5. Check the country, city, and final caption. Edit them in the preview if
   needed. A short real place name is better than a long promotional line.
6. Watch the complete reveal once: country → city → street → photo pin →
   circular photo reveal → slideshow.
7. Use **Share Video** and save the original MP4 to Files.

Keep the real "Made with Photoso" watermark if it is present in your export.
Do not crop out map-provider attribution or cover it with a website overlay.
Do not manually accelerate the zoom; its pacing is tuned for re-encoding.

## Editorial target

These are desired beats, **not claims about fixed in-app timings**:

| Approximate time | What the viewer should see |
|---|---|
| 0–2 s | Country and its name |
| 2–4 s | Flight toward the city |
| 4–6 s | Street-level arrival and photo pin |
| 6–8 s | Pin opens into the first photo |
| 8–16 s | Remaining photos and final place caption |

Use the duration shown in Choose Photos as the actual timing reference.
If the genuine export runs longer, send it intact. We can choose a shorter
photo set or trim an idle tail later without falsifying the app's motion.

## Web encoding

If FFmpeg is installed, an example starting point is:

```sh
ffmpeg -i place-reveal-original.mp4 \
  -vf "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2" \
  -r 30 -c:v libx264 -preset slow -crf 24 \
  -maxrate 1600k -bufsize 3200k -pix_fmt yuv420p \
  -an -map_metadata -1 -movflags +faststart place-reveal.mp4
```

The settings are a starting point, not a guarantee of byte size. Check the
result with `wc -c < place-reveal.mp4`. If it exceeds 4,000,000 bytes, reduce
the bitrate or shorten the photo selection, then check map-label legibility.
Do not compress the original.

To make the poster, choose a frame after the first photo is fully visible.
For example, if that frame occurs at eight seconds:

```sh
ffmpeg -ss 00:00:08 -i place-reveal.mp4 \
  -frames:v 1 -q:v 3 place-reveal-poster.jpg
```

Check the poster separately. The example timestamp may not suit your export.

## What will change on the website

The current map is a **labeled illustrated web preview**, not an app recording.
Once the real files are available, replace it with a poster-first, inline,
muted video player. Keep playback user-initiated, pause when offscreen,
preserve the download CTA, and show a static poster for Reduce Motion.
Load the video on demand, not with the initial hero. Check iPhone Safari,
iPad, compact/expanded Duo-sized layouts, and desktop before publishing.

## App-size claim

The page currently avoids a numeric size claim. To publish **Under 10 MB**,
provide a current live App Store size below 10 MB for the intended storefront
and device, or verified app-thinning download-size evidence for the released
version. An archive size or next-build size alone does not establish the live
download size. Qualify platform/version if download sizes differ.
