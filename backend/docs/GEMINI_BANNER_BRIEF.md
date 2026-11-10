# Gemini brief: login / register advertisement banners

Paste the prompts below into Gemini (Imagen / "Create image"). Generate **3 images**, save them as JPG with these exact names in
`frontend/public/banners/`:

| File | Slide message |
|------|---------------|
| `login-1.jpg` | Find your next home |
| `login-2.jpg` | List your property |
| `login-3.jpg` | Book a visit |

The login page cycles through them every 5 seconds with a slow zoom and fade, and puts the text on top. **Do not put any text in
the images.** The site adds its own headline, so baked-in text would double up.

## Specs (all three)
- Size: **1200 x 1600 px** (portrait 3:4). It fills the left half of the login screen and is cropped to fit, so keep the subject centred.
- Format: JPG, under 400 KB each (compress at squoosh.app if larger).
- Leave the **lower 40%** calm and uncluttered; the text overlay sits there.
- Palette: deep green (#064e3b), teal (#0f766e), warm yellow accent (#fde047), soft sky blue. Bright, friendly, optimistic.
- Setting: Bangladesh (Dhaka-style apartment buildings, tropical greenery, warm daylight). No logos, no watermarks, no readable text.

## Prompt 1: login-1.jpg
> Portrait 3:4 illustration, no text. A sunny modern Dhaka residential street with colourful mid-rise apartment buildings,
> tropical trees and a few small balconies with plants, warm golden-hour light, soft sky blue background. A young family
> looks up happily at one building. Flat-vector semi-3D style, clean shapes, deep green and teal palette with warm yellow
> highlights. Calm empty foreground in the bottom 40% of the image. No text, no logos.

## Prompt 2: login-2.jpg
> Portrait 3:4 illustration, no text. A friendly property owner handing over house keys at the door of a bright
> apartment, a "to-let" style tag hanging from the door without any readable writing, potted plants, warm daylight.
> Flat-vector semi-3D style, deep green and teal palette with warm yellow highlights. Calm, uncluttered bottom 40%.
> No text, no logos.

## Prompt 3: login-3.jpg
> Portrait 3:4 illustration, no text. A couple viewing a sunny empty flat with a real-estate agent: large windows,
> city skyline outside, a phone showing a generic calendar icon (no readable text). Flat-vector semi-3D style, deep green
> and teal palette with warm yellow highlights. Calm, uncluttered bottom 40%. No text, no logos.

## Optional: animated video banner instead
If you prefer motion, ask Gemini (Veo) for one 6-8 s loop per slide: *"Same scene as above, slow camera push-in, gentle cloud
and leaf movement, seamless loop, no text, 3:4 portrait."* Tell me and I'll switch the slider from `<img>` to `<video autoplay muted loop>`.

## After saving the files
Refresh http://localhost:8080/login. Missing images are skipped, and the skyline illustration shows instead.
If the frontend is served from Docker, rebuild: `docker compose up -d --build frontend`.
