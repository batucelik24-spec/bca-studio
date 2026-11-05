# Project hologram reference audit

Updated: 2026-11-05.

The previews are authored spatial reconstructions of the project's supplied
drawings, diagrams, prototype photographs and renders. They are not recovered
CAD models or photogrammetric measurements. Unseen faces and minor construction
details remain interpretations. Prefer an original model when one becomes
available, rather than inventing extra detail from a single cover image.

## Sources and identifying geometry

Paths below are relative to this repository. The project descriptions and image
captions were also reviewed. Multiple views, plans and sections take precedence
over a cover's perspective, vegetation, lighting or graphic overlays.

| Code | Principal references | Geometry to preserve |
| --- | --- | --- |
| OPR | `img/portfolio-final/opr-roof-sketch.webp`, `opr-program.webp`, `opr-flow.webp`; `img/portfolio/opr-0860.webp`, `opr-0862.webp` | Two distinct concave tent roofs, raised tips, central glazed cleft, separate oval halls and low podium. Roof seams follow the curved surfaces. |
| TAS | `img/portfolio-final/tas-plan-ground.webp`, `tas-elevation.webp`, `tas-section-a.webp`, `tas-section-b.webp`, `tas-arch-facade.webp` | Rounded rectangular stadium, straight-legged round arches, alternating portal angles, pleated roof ring and open pitch. |
| ALJ | `img/portfolio/alj-0675.webp`, `alj-0680.webp`, `alj-0494.webp`; `img/dg/alj-plan01.jpg`, `alj-sec.jpg` | Asymmetric oval stadium with changing roof height, substantial perimeter ribbon, inclined fins and entry opening. |
| WA | `img/portfolio-final/wa-assembled.webp`, `wa-exploded.webp`, `wa-frame.webp`, `wa-bracing.webp`, `wa-physical-model.webp`, `wa-plan-3.webp`, `wa-plan-4.webp`, `wa-plan-5.webp`, `wa-green-facade.webp` | Slender 19-storey tower; diagonal lower-level passage creates two triangular floor regions; upper full floors, multi-storey bracing, projecting platforms and attached green facade. The artwork's airborne ribbon is not a structural helix. |
| ALT | `img/portfolio/alt-0456.webp`, `alt-0451.webp`, `alt-0113.webp`; `img/dg/alt-arch.jpg`, `alt-grids.jpg`, `alt-slabs.jpg`, `alt-f24.jpg` | Chamfered tower, heavier arched base, transition levels, glazed upper floors and a large crown arch on each face. No invented external X-frame. |
| STC | `img/portfolio/stc-0598.webp`, `stc-0599.webp`, `stc-0600.webp`, `stc-0712.webp`, `stc-0713.webp`, `stc-0714.webp`; `img/portfolio-complete/stc-model-overview.webp`; `img/dg/stc-long.jpg` | Bent, forked wings, folded roof surfaces and Y supports; lower curved auditorium and separate planetarium volume around a court. |
| SOC | `img/portfolio-final/soc-plan-1.webp` through `soc-plan-8.webp`, `soc-section-1.webp`, `soc-section-2.webp`; `img/portfolio-complete/soc-axons.webp` | Stepped L-shaped mass, projecting window boxes, terraces, open ground frontage, dark vertical core and two glazed upper levels. |
| DYF | `img/portfolio/dyf-0541.webp`, `dyf-0543.webp`, `dyf-0539.webp`, `dyf-0540.webp`; `img/dg/dyf-panels.jpg` | Pavilion with a dense array of pivoting panels, slender supports and an opaque roof/fascia. Panel rotation creates spatial depth. |
| HMP | `img/portfolio/hmp-0045.webp`, `hmp-0046.webp`, `hmp-0287.webp`, `hmp-0283.webp`, `hmp-0284.webp`; `img/dg/hmp-open.jpg`, `hmp-closed.jpg`, `hmp-plan.jpg` | Foldable kiosk in its open state: raised canopy, counter, swung side panel and floor extension; distinguish the open and closed sides. |
| CBR | `img/portfolio/cbr-0549.webp`, `cbr-0550.webp`, `cbr-0551.webp` | Curved green island counter, four checker-pattern stools, curved screens and circular platform. |
| OVS | `img/portfolio/ovs-0016.webp`, `ovs-0012.webp` | Headphones above a raised central cube, surrounded by rotated display cubes. |
| HKK | `img/portfolio/hkk-01.webp` through `hkk-04.webp` | Four open pleated curtain arcs around the central rug; suspended rings, seating and rear display. Preserve the gaps between curtains. |
| BDP | `img/portfolio/bdp-0130.webp`, `bdp-0131.webp`, `bdp-0128.webp`, `bdp-0485.webp`, `bdp-0484.webp` | Six lobed speaker chambers in a three-by-two arrangement, individual grilles, central badge and substantial enclosure depth. |
| ABR | `img/archbrick/archbrick-prototype.png`, `archbrick-mould.png`, `archbrick-production.jpg`, `archbrick-lab.png` | Use the physical prototype: six cells along each long edge, side cells, central pointed lens divided by crossing webs and external fluting. Preserve open holes through the brick. Generated cover imagery is not geometry evidence. |
| PCE | `img/pace/home.webp`, `crew.webp`, `feed.webp`, `stats.webp` | A digital product presented on a volumetric phone. Sample the actual app interface on its flat screen; do not turn UI brightness into imaginary building-like relief. |
| HUB | `img/urban-hub/program.webp`, `site.webp`, `ground.webp`, `floor-1.webp`, `floor-2.webp`, `floor-3.webp`, `section-aa.webp`, `section-bb.webp`, `elevation-1.webp`, `elevation-2.webp`, `circulation.webp` | Curved four-level building on pilotis, facade fins, large voids, red circulation bridge/stair, separate round conference volume and internal council chamber. |
| AUL | `img/lab-rig/overview.webp`, `front.webp`, `load-head.webp`, `sensors.webp`, `sensors-context.webp` | Stiffened steel portal, central layered wall specimen, vertical and horizontal actuators, load-spreading beam/rollers, side gauges, control console, camera and lamps. Load capacities and measured performance are not inferred. |

## Rendering and interaction

- `hologram-models.js` defines real XYZ surfaces, edges and named assemblies.
  Part weights emphasize the identifying geometry instead of letting a large
  base consume most samples. Each project has its own initial camera angle.
- `holograms.js` samples these surfaces and edges into deterministic point
  clouds. All visible model elements are points. Invisible depth geometry hides
  rear surfaces; glazing and intended openings remain open. Loose particles
  follow the silhouette with irregular density rather than filling a box.
- Assembly and a moving light band scan downward. Pointer movement and a gentle
  orbit reveal side surfaces while keeping the defining face readable.
- `hologram-transition.js` snapshots the current XYZ positions, reveal state,
  lighting, opacity and depth before morphing points into the selected cover.
  This also works when the user clicks before formation is complete.
- A single WebGL renderer is reused. Touch and reduced-motion visitors retain
  the photographic previews and normal project navigation.

## Validation

All 17 models were checked for finite coordinates, nonzero extent in all three
axes, rendered from two viewpoints, and compared with the reference sheets.
Browser checks covered representative Architecture and Studio hover previews,
partial/full formation-to-cover transitions, closing/reopening, shared canvas
reuse, keyboard opening, English navigation, a 390-pixel mobile viewport and
reduced motion. These checks reported no JavaScript or WebGL shader errors.

The local reference sheets, rendered comparisons and browser QA outputs are in
`D:/BCA_Hologram_Audit_2026-11-05`; they are not deployed website assets.
