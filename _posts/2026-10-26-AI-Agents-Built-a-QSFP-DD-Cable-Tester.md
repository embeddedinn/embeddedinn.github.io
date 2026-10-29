---
title: "AI Agents Built a QSFP-DD Cable Tester, Part 1: What We Built and What It Does"
date: 2026-10-26 09:00:00.000000000 -07:00
classes: wide
published: true
toc: true
toc_label: "Contents"
toc_icon: "list-ul"
toc_sticky: true
categories:
  - articles
  - tutorial
tags:
  - Hardware
  - AI Agents
  - KiCad
  - JLCPCB
  - QSFP-DD
  - CMIS
  - 3D Printing
  - Claude Code
excerpt: >
  Part 1 of 6. A small, cheap QSFP-DD tester I can plug an active cable or an
  optical module into and poke at every register, the power, the heat, the
  firmware and the module's own pattern tests, without a lab cable tester.
  The design tools are free and open source (the AI tools that did the typing
  are not), and AI agents took it from my written brief to a filled-in JLC order. This part covers the finished unit,
  what it does, what it found and how it got built.
header:
  teaser: images/posts/aec_ct2/aec_ct2_header.png
  og_image: images/posts/aec_ct2/aec_ct2_header.png

---

<style>.image-wrapper{text-align:center;margin:1.5em 0}.image-wrapper img,.image-wrapper video{max-width:100%;height:auto}.image-wrapper .image-caption{color:gray;margin-top:.3em}.series-nav{border:1px solid #dfe3e8;border-radius:10px;padding:1em 1.1em .8em;margin:1.2em 0 2em;background:#fafbfc;font-size:.8em;line-height:1.35}.series-nav .sn-head{display:flex;justify-content:space-between;flex-wrap:wrap;gap:.3em 1em;margin-bottom:.8em}.series-nav .sn-title{font-weight:700;color:#333}.series-nav .sn-cadence{color:#6b7280}.series-nav ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:.6em}.series-nav li{margin:0}.series-nav li a,.series-nav li .sn-cur{display:flex;gap:.55em;align-items:flex-start;height:100%;box-sizing:border-box;padding:.6em .65em;border:1px solid #e3e6ea;border-radius:8px;background:#fff;color:#333;text-decoration:none}.series-nav li a:hover{border-color:#3b6e8f;box-shadow:0 1px 4px rgba(0,0,0,.08)}.series-nav .sn-num{flex:none;width:1.7em;height:1.7em;border-radius:50%;background:#e8eef3;color:#3b6e8f;font-weight:700;display:flex;align-items:center;justify-content:center}.series-nav li .sn-cur{background:#3b6e8f;border-color:#3b6e8f;color:#fff}.series-nav li .sn-cur .sn-num{background:#fff;color:#3b6e8f}.series-nav .sn-here{display:block;font-size:.85em;opacity:.85;margin-top:.15em}.series-nav .sn-note{margin:.8em 0 0;color:#6b7280;font-size:.95em}@media (max-width:900px){.series-nav ol{grid-template-columns:1fr}}</style>

<nav class="series-nav" aria-label="Series"><div class="sn-head"><span class="sn-title">AI Agents Built a QSFP-DD Cable Tester</span><span class="sn-cadence">A series in six parts, one each week</span></div><ol><li><span class="sn-cur" title="the finished tester, what it can do, what it found and how it was built."><span class="sn-num">1</span><span>What we built and what it does<span class="sn-here">you are here</span></span></span></li><li><a href="{{ '/articles/tutorial/AI-Agents-Built-a-QSFP-DD-Cable-Tester-Part-2-Hardware/' | relative_url }}" title="why copper grew a DSP, CMIS, the block diagram, the parts and the placement decisions."><span class="sn-num">2</span><span>The cable, CMIS and the board</span></a></li><li><a href="{{ '/articles/tutorial/AI-Agents-Built-a-QSFP-DD-Cable-Tester-Part-3-Design-Flow/' | relative_url }}" title="generated schematics, waivers, replayable placement and routing, the layout and JLC's checks."><span class="sn-num">3</span><span>The design flow and making it</span></a></li><li><a href="{{ '/articles/tutorial/AI-Agents-Built-a-QSFP-DD-Cable-Tester-Part-4-Case/' | relative_url }}" title="the cracked trays, the no-waiver rule, a case generated from code, PETG, light pipes, magnets and the fan hood."><span class="sn-num">4</span><span>The case</span></a></li><li><a href="{{ '/articles/tutorial/AI-Agents-Built-a-QSFP-DD-Cable-Tester-Part-5-Bring-up/' | relative_url }}" title="first power, real cables, what a PRBS run can prove, counters and the unattended runs."><span class="sn-num">5</span><span>Bring-up and the bench</span></a></li><li><a href="{{ '/articles/tutorial/AI-Agents-Built-a-QSFP-DD-Cable-Tester-Part-6-Method/' | relative_url }}" title="blind reviews, aectest and its cable data, the published skill and rev 1."><span class="sn-num">6</span><span>The method, the tool and what comes next</span></a></li></ol><p class="sn-note">A link to a part that is not out yet starts to work on the day that part is published.</p></nav>

<div class="image-wrapper"><a href="{{ '/images/posts/aec_ct2/bench_pair_om4.jpg' | relative_url }}" target="_blank"><img src="{{ '/images/posts/aec_ct2/bench_pair_om4.jpg' | relative_url }}" alt="Two AEC-CT2-MINI rev 0 units in their home-printed cases" width="450" /></a><p class="image-caption">The AEC-CT2-MINI rev 0: two units in their home-printed cases, with an optical module pair on OM4 fibre and the status LEDs lit through the light pipes.</p></div>

## 1. Why I wanted one {#why-i-wanted-one}

Active cables connector ends and optical transciever modules hve powerful DSPs, firmware, a temperature sensor, power classes and a register map with hundreds of fields with interesting data, and it behaves differently at low power, at full power, warm, cold, half-inserted, or right after a firmware update. I wanted to *see* all of that for myself: read every register, push a module to full power and watch it heat up, update its firmware, and run its built-in pattern tests across a real cable.

The usual ways of doing that are not very friendly if all you have is a bench and some curiosity. You can plug the cable into a switch or a server, which shows you whatever the host decides to show you and hides the rest. Or you can use a very expensive lab cable tester or a bit error rate tester (BERT), which is the right tool for qualification work and lives in a lab rather than on a desk. I wanted something in between, a small and cheap platform where I plug in a cable and explore every parameter it has from a laptop, with every step recorded.

There was a second itch as well. As with everyone else in the industry, I have been using AI extensively for work and personal projects. I wront about a few in the previous blogs, like the [TinyTapeout VGA chip]({% post_url 2026-06-20-Taping-Out-a-VGA-Demo-on-Real-Silicon %}) I developed with AI agents and [Passbook]({% post_url 2026-06-15-Passbook-Serverless-Allowance-Tracker-Built-With-AI-Agents %}) recently. This project follows a similar vein, but is much more extensive.

The Idea: give AI agents a written brief and let them take a piece of hardware all the way to a filled-in order, with me providing some extensive initial guardrails and stepping in only where judgment is needed and to pay where an order gets placed.

I also set myself one more constraint, which is that every design tool, from EDA and CAD to simulation, slicing, the test tool, the viewer and this blog, had to be free and open source. Here's the whole kit and what each one did:

| Tool | What it did here |
| --- | --- |
| `KiCad` | Schematic capture and PCB layout. Its command line, `kicad-cli`, runs the electrical and design rule checks and writes the fab files without opening the GUI. |
| `Freerouting` | An autorouter. It routed most of the board from a script, headless. |
| `Python` | The glue. Scripts read the design YAML and generate the schematic, the placement and the fab package, and the test tool is Python too. |
| `OpenSCAD` | Code-first CAD. The whole printed case is generated from parameters, never drawn by hand. |
| `CadQuery` | Reads the vendor's 3D models of the cage and heat sink, so the case is checked against the real parts. |
| `Gmsh`, `fTetWild`, `scikit-fem` | Meshing and finite-element solving, for the case's stress and heat checks. |
| `trimesh` | Loads the printed meshes for the thin-wall and clearance checks. |
| `Bambu Studio` | The slicer that turns the case into printer toolpaths. |
| `pyftdi` | A pure-Python driver for the FTDI USB chip on the board. It's how the laptop speaks I2C to the module. |
| `three.js` | The interactive 3D case viewer in this post. |
| `Jekyll` | This blog. |

The AI tools themselves are not open source: Claude Code, plus Cursor's `agent` command line and the Gemini app for reviews. JLC's online manufacturability checks and DigiKey's parts API are free web services, and the connector drawings sit behind a vendor's sign-in and licence. The tool, the case and the method are public. The board's generator scripts and the licensed drawings stay private.

This first part of teh sries stays with the finished unit, what it does, what it found on real cables and how it was built. The five parts after it go deep on each piece.

## 2. What I ended up with {#what-i-ended-up-with}

Each unit is basically a QSFP-DD cage on a stick. You plug a cable or a module into the cage, connect the unit to a laptop over USB-C, and power the module from a USB-C charger (`5 V / 3 A`) on a second USB-C port. One unit is enough to read, power and update a module. With two units, one at each end, you can drive both ends of a cable and run an end-to-end pattern test when the modules carry their own generators and checkers.

It is really three things, a board, a printed case and the software that drives them, so I'll go through them in that order.

The board is a `42 × 136 mm` four-layer PCB with a press-fit QSFP-DD cage, an FTDI `FT2232H` acting as the I2C master and pin driver, two buck converters (one for the logic and one for the module), slide switches for a human to flip, and eight status LEDs. I left out the microcontroller on purpose, so there is no firmware on the board and every decision lives in software on the laptop. JLC made five bare boards and assembled four of them.

<div class="image-wrapper"><a href="{{ '/images/posts/aec_ct2/jlc_photo_top.jpg' | relative_url }}" target="_blank"><img src="{{ '/images/posts/aec_ct2/jlc_photo_top.jpg' | relative_url }}" alt="A real rev 0 board in its assembly panel, in JLC's production photo before shipping" width="800" /></a><p class="image-caption">A real rev 0 board in its assembly panel, in JLC's production photo before shipping. The cage is pressed on by hand after delivery.</p></div>

The case prints at home on a `Bambu Lab P2S`, in a handful of parts: a tray, a body, a deck that carries the labels, and a hood over the cage. The parts that sit near the hot metal are specified in PETG, and the units on my bench so far are PLA prints. It has eight light pipes that carry the LEDs up to labels on the lid, a hood over the cage, and magnets that hold the hood in place. You can take it apart in the viewer below. It animates on its own, and if you click it you get a larger view that you can turn and explode yourself.

<figure class="aec-viewer" style="margin: 1.5em 0;">
  <iframe
    id="aec-ct2-preview"
    src="{{ '/assets/aec_ct2_viewer/index.html?mode=autoplay&theme=light' | relative_url }}"
    title="AEC-CT2-MINI case in 3D, looping preview. Click to open the interactive viewer."
    loading="lazy"
    style="display: block; width: 100%; aspect-ratio: 16 / 10; min-height: 300px; border: 1px solid rgba(128, 128, 128, .35); border-radius: 8px;">
  </iframe>
  <noscript>
    <a href="{{ '/assets/aec_ct2_viewer/index.html' | relative_url }}">
      <img src="{{ '/assets/aec_ct2_viewer/poster.jpg' | relative_url }}" alt="Exploded view of the AEC-CT2-MINI case and board" width="800">
    </a>
  </noscript>
  <figcaption style="text-align: center; color: gray;">
    The printed case in 3D. Click or tap the model to explore it: orbit, pull it apart and step through the build.
    <a href="{{ '/assets/aec_ct2_viewer/index.html' | relative_url }}" target="_blank" rel="noopener">Open the viewer in a new tab</a>.
  </figcaption>
</figure>

<dialog id="aec-ct2-dialog" aria-label="AEC-CT2-MINI case viewer"
        data-src="{{ '/assets/aec_ct2_viewer/index.html?mode=full&theme=light' | relative_url }}">
  <button type="button" id="aec-ct2-close" aria-label="Close the viewer" title="Close (Esc)">✕</button>
  <iframe id="aec-ct2-full" title="AEC-CT2-MINI case viewer: orbit, zoom, explode and step through the build"></iframe>
</dialog>

<script src="{{ '/assets/aec_ct2_viewer/embed.js' | relative_url }}"></script>

`aectest` is the `Python` package with a command line and a browser UI that was built for this tool. The browser UI has a guided "Test a cable" flow for someone who just wants a verdict, and an Advanced page for those of us who want to poke at registers. Every run writes a record that can be judged again later.

<div class="image-wrapper"><a href="{{ '/images/posts/aec_ct2/ui_test_verdict.png' | relative_url }}" target="_blank"><img src="{{ '/images/posts/aec_ct2/ui_test_verdict.png' | relative_url }}" alt="The guided test in the web UI, here in simulation mode with two simulated units" width="800" /></a><p class="image-caption">The guided test in the web UI, here in simulation mode with two simulated units: live temperature and supply during the high-power step, then the verdict card with its record and report.</p></div>

The software, its docs and the case files are public at [vppillai/aec-ct2-mini](https://github.com/vppillai/aec-ct2-mini), with pages at [vppillai.github.io/aec-ct2-mini](https://vppillai.github.io/aec-ct2-mini/). The agent workflow that built it is packaged as a Claude Code skill at [vppillai/hw-from-spec](https://github.com/vppillai/hw-from-spec).

## 3. What it can do {#what-it-can-do}

Here is what the platform does, roughly in the order you'd use it on a new cable.

- **Identify and decode.** Read the module's identity and every page of the Common Management Interface Specification (CMIS) that it advertises: vendor, part, firmware, power class, supported applications, alarm thresholds, and live temperature and supply. An audit then checks the module against the required CMIS fields.
- **Drive the pins.** Each control pin (reset, low-power mode, module select) can be driven from software or by hand with a slide switch. The LEDs show `PWR`, `MAN`, `USB`, `PRS`, `INT`, `LP`, `5V IN` and `PC`; reset and module select have none.
- **Take it to full power, under software interlocks.** The software releases a module into high power only after a pre-flight check and a power budget check. It then watches temperature and supply every `1 s` and drops the module back to low power if it gets too hot.
- **Measure heat.** A hold at high power records the temperature curve, which gives you a fair idea of how hot the module would run in your own setup.
- **Update firmware.** The update goes through the module's command channel in steps you can stop between: download to the inactive bank, run it, then commit it.
- **Test the signal path.** Many modules carry their own pattern generator and checker. Two units drive the generator in one module and the checker in the far module across the cable, in both directions, and count the errors in short windows.
- **Keep a cable database.** Whatever the tool knows about each cable type lives in small YAML files rather than in the code, so adding a new cable means adding a file instead of writing a patch.

Each of these is also a single command from a terminal. My first look at a new cable is these three read-only commands:

```console
aectest bringup id       # vendor, part, serial, firmware, power class
aectest bringup decode   # every advertised page, decoded by field
aectest bringup audit    # the CMIS compliance checks, A01 to A19
```

Anything that takes a module to high power needs two explicit permission flags, and the software refuses to go ahead without them. [Part 2]({{ '/articles/tutorial/AI-Agents-Built-a-QSFP-DD-Cable-Tester-Part-2-Hardware/' | relative_url }}) explains why, along with the board and the safety rules.

## 4. What it found on real cables {#what-it-found-on-real-cables}

The four boards came up one step at a time, and both `3.3 V` rails I measured sat within `15 mV` of `3.3 V`. Then I started plugging in real cables.

The first real cable was a Credo 400G active electrical cable (AEC). It went to high power and held a `10 min` run without raising a single flag, peaking at `48 °C` on a bare board with no fan. I also moved its firmware from `5.1` to `5.6` through the tester, which is a nice thing to be able to do on a desk. What rev 0 can't do is run a pattern test on this cable. Its DSP waits for a signal from a real host before it brings the data path up, and this board has no host side. That gap ended up shaping the next revision.

Next came a pair of 400G optical modules over fibre, and here the pattern tests did run in both directions. Once I had the right fibre in, the runs looked wonderful, and the modules reported numbers that read like excellent bit error ratios. Then the tool started checking those numbers against the raw counters it read, and they didn't add up. Every checked run since then comes back `INCONCLUSIVE` with a reason attached, instead of a clean number. I had wanted clean bit error ratios. What I got instead was the tool catching its own instrument misbehaving before I published a wrong answer, and that turned out to be the most useful thing it did. [Part 5]({{ '/articles/tutorial/AI-Agents-Built-a-QSFP-DD-Cable-Tester-Part-5-Bring-up/' | relative_url }}) tells that detective story.

On a bare board with no fan, the AEC settles near `50 °C`. The optical modules advertise `8 W`, which is above this board's `6.6 W` nominal ceiling. I ran them anyway as a one-off characterisation (Part 2 owns up to that), and they were still climbing when the `70 °C` throttle stopped them.

<div class="image-wrapper"><a href="{{ '/images/posts/aec_ct2/thermal_holds.png' | relative_url }}" target="_blank"><img src="{{ '/images/posts/aec_ct2/thermal_holds.png' | relative_url }}" alt="Module temperature at high power on a bare board with no fan" width="800" /></a><p class="image-caption">Module temperature at high power on a bare board with no fan. A fit puts the AEC's steady state near <code>50 °C</code>. The <code>8 W</code>-class optical module is still climbing when the <code>70 °C</code> throttle stops it; the fitted curve heads for about <code>75 °C</code>. This plot changed the next revision.</p></div>

The throttle stopped runs exactly as designed. Later runs had a desk fan aimed at the cages, and that fan failed on two occasions without me noticing. The first outage caused three throttle trips in one session, and the second stopped one soak in the first unattended campaign, Campaign A. Every one of those runs still ended with both modules back in low power.

<b>What is and isn't proven:</b> the boards power, manage and update modules, and the thermal throttle works. None of the signal-path measurements are validated yet, since rev 0 can't pattern-test the AEC without the cable DSP FW supporting it. The `8 W` optics ran above the board's nominal ceiling.
{: .notice--warning}

## 5. How it was built {#how-it-was-built}

The build process was the other half of the experiment. The first stretch took the brief to a filled-in board order, and the work after that turned the board into the system you saw above, with the case, the software and the manuals.

I wrote the brief and a `CLAUDE.md` with the project rules, made the calls that needed judgment, and reviewed each step. AI agents in Claude Code did the design and ordering work, many of them in parallel: the spec, part selection against live JLC stock, generated schematics, scripted placement and routing, the fab outputs, the case, the test software and the manuals. One coordinating agent handed out the jobs and merged the results. The `git` history has 1,617 commits from about 150 commit identities, and nearly all of those are agents, since each job commits under its own name.

<div class="image-wrapper"><a href="{{ '/images/posts/aec_ct2/pcb_routing.gif' | relative_url }}" target="_blank"><img src="{{ '/images/posts/aec_ct2/pcb_routing.gif' | relative_url }}" alt="The routing, replayed from the board's git history" width="800" /></a><p class="image-caption">The routing, replayed from the board's git history. Placement and routing are scripts with their data in files, so every change is a reviewable diff.</p></div>

A handful of rules carried the whole thing. The agents never use a part number from memory and always fetch it live. Everything is generated and nothing is hand-edited, so a review finding changes a script and the design gets rebuilt. Reviews are blind, so no reviewer sees another reviewer's notes. The outside reviewers ran through Cursor's `agent` command line, plus one case review through the Gemini app in a browser. And every decision gets logged, because agents forget. By the end, the decision log held 96 of my calls and 356 agent proposals, and it is the only reason a fresh agent could pick up where the previous one stopped.

This specific version of the board wasn't the originalplan. The initial was for a bigger dual-port tester with a microcontroller, and this small board was supposed to be a cheap *footprint coupon* to prove out the cage footprint first. Early on, I looked at the renders and wrote *"it is no longer just a footprint coupon"*, and from then on it was the product.

Before the order went in, the agent ran the design-rule, manufacturability and traceability checks, filled in the JLC quote in my signed-in browser up to the Save to Cart button, and stopped there. I clicked Save to Cart and Checkout, picked the shipping and placed the order. No agent ever signs in to a vendor or clicks an order button, and the clicks that place an order are always mine. The licensed downloads, the vendor replies, the assembly and all of the bench time were also mine.

## 6. What I learned {#what-i-learned}

**I still had to make the calls.** The agents produced an absurd amount of careful work and carried the board all the way to a filled-in order. The project still turned on a handful of calls I made from experience or from a real part on a real bench: live part data only, everything generated, and no waivers on printed parts after a batch of nylon trays cracked exactly where a waiver said they'd be fine. Once a call was in the log, the agents never forgot it, which is more than I can say for myself ;)

**Write it all down, because nobody else will remember.** A decision log, a learnings log and a diary sound like bureaucracy, and I expected to resent them. With about 150 commit identities in one repository, though, the log was how a fresh agent knew what the last one had decided, and it is also why this series can quote exact numbers.

**Check the numbers a module hands you.** The optics reported lovely bit error ratios, and publishing them would have been the easy thing to do. Checking them against the raw counters cost a few hundred lines of `Python` and saved me from a wrong answer more than once.

## 7. What's next {#whats-next}

Most of the rev 1 list came straight from the bench. The AEC that sat waiting in `DPInit` for a host gets a swappable cage board with a host loopback, so it can finally run a pattern test, and the fan that failed twice becomes one the board powers, controls and watches. Rev 1 also adds protection on every line that faces the controller, LEDs that look equally bright through the pipes, and one cable per unit instead of two, because with rev 0, two units on a desk means four USB-C cables. To get there it brings back a microcontroller, an `ESP32-S3` that talks Wi-Fi, which reverses the no-firmware rule; the measurement logic stays on the laptop.

## 8. The rest of the series {#the-rest-of-the-series}

Each part goes deep on one piece of the picture above.

- **[Part 2: the cable, CMIS and the board]({{ '/articles/tutorial/AI-Agents-Built-a-QSFP-DD-Cable-Tester-Part-2-Hardware/' | relative_url }}).** Why copper cables grew a DSP, what CMIS actually is, the block diagram, how each part was picked and why every part sits where it does.
- **[Part 3: the design flow and making it]({{ '/articles/tutorial/AI-Agents-Built-a-QSFP-DD-Cable-Tester-Part-3-Design-Flow/' | relative_url }}).** Schematics from YAML, placement and routing as scripts you can rerun in CI, how DRC and ERC waivers were handled, and what JLC's engineers asked before they built it.
- **[Part 4: the case]({{ '/articles/tutorial/AI-Agents-Built-a-QSFP-DD-Cable-Tester-Part-4-Case/' | relative_url }}).** The cracked trays that made the no-waiver rule, a case generated from code and checked like a part, PETG, light pipes, magnets and the fan hood.
- **[Part 5: bring-up and the bench]({{ '/articles/tutorial/AI-Agents-Built-a-QSFP-DD-Cable-Tester-Part-5-Bring-up/' | relative_url }}).** First power from a phone charger, the Credo firmware update, what a PRBS run can and can't prove, and the counters that didn't add up.
- **[Part 6: the method, the tool and what comes next]({{ '/articles/tutorial/AI-Agents-Built-a-QSFP-DD-Cable-Tester-Part-6-Method/' | relative_url }}).** Blind reviews across several AI models, how `aectest` keeps cable knowledge in data, the published skill, the case, and the rev 1 plan.

**Next:** [Part 2: the cable, CMIS and the board]({{ '/articles/tutorial/AI-Agents-Built-a-QSFP-DD-Cable-Tester-Part-2-Hardware/' | relative_url }}).
