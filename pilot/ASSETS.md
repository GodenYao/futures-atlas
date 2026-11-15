# pilot_v45 · ASSETS

Every file below is **CC0 1.0** or MIT (three.js). No other licences are used. Files were downloaded with curl from the official KayKit GitHub repos (author Kay Lousberg, kaylousberg.com). They are unmodified, and each glTF is loaded with its own `.bin` and shared palette texture.
At run time the pilot reads only these local files. No CDN is used.

| Path | Source URL (raw.githubusercontent.com) | Licence |
|---|---|---|
| `assets/kk_city/building_{A,B,C,D,E,F}_withoutBase.gltf` + `.bin` | `KayKit-Game-Assets/KayKit-City-Builder-Bits-1.0/main/addons/kaykit_city_builder_bits/Assets/gltf/<file>` | CC0 (repo LICENSE) |
| `assets/kk_city/{streetlight,bush,car_sedan,bench}.gltf` + `.bin` | same base as above | CC0 |
| `assets/kk_city/citybits_texture.png` (palette atlas) | same base as above | CC0 |
| `assets/kk_hex/building_{home_A,home_B,windmill,watermill,well}_yellow.gltf` + `.bin` | `KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0/main/addons/kaykit_medieval_hexagon_pack/Assets/gltf/buildings/yellow/<file>` | CC0 (`.../main/LICENSE.txt`) |
| `assets/kk_hex/fence_wood_straight.gltf` + `.bin` | `.../Assets/gltf/buildings/neutral/<file>` | CC0 |
| `assets/kk_hex/{trees_A_medium,trees_B_small,tree_single_A,tree_single_B,rock_single_A}.gltf` + `.bin` | `.../Assets/gltf/decoration/nature/<file>` | CC0 |
| `assets/kk_hex/{sack,barrel,wheelbarrow,resource_lumber}.gltf` + `.bin` | `.../Assets/gltf/decoration/props/<file>` | CC0 |
| `assets/kk_hex/hexagons_medieval.png` (yellow palette atlas) | `.../Assets/gltf/buildings/yellow/hexagons_medieval.png` | CC0 |
| `assets/fonts/BarlowSemiCondensed-Medium.ttf`, `IBMPlexMono-Regular.ttf` | copied from `site/src_v44/fonts/` (the v4.4 build) | SIL OFL 1.1 |
| `js/three.min.js` (r149) | copied from `site/src_v44/three.min.js` (the v4.4 build) | MIT |
| `js/GLTFLoader.js` | `https://unpkg.com/three@0.147.0/examples/js/loaders/GLTFLoader.js` (the last release that ships the non-module `examples/js` build; 0.148+ returns 404) | MIT |

Several kits were tried and dropped:
- Kenney kits: the kenney.nl pages gave no zip URLs that could be scraped.
- KayKit Space Base Bits: the `structure_low` tower read as a sci-fi lander.
- Hex `building_grain` and `building_bridge_A`: both carry hex ground tiles.

Everything else is procedural code, with no files involved:
- the landmark spire and eye, the wall and the plinth
- terrain, water, sky, crop rows, haystacks and the footbridge
- the textures for the iris, paving, glow and smoke

Checkpoint A1 techniques in `style=bluefacet` were **independently re-implemented from a written spec**. These are the jittered terraced facet terrain, the river shelf with depth tint and foam, sky-only IBL with an auto-solved gain, the Neutral-type tone curve, contact AO decals with crease bands, on-demand shadows, and batched glow and smoke.
- The spec is our own review, `site/review/fable_saltline_20261115_1725.md`, which describes the Saltline techniques in prose.
- No Saltline source code was opened or copied. That source is unlicensed.
- The tone curve follows the public Khronos PBR Neutral description.
- All of this code is original to this project.
