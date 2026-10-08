# -*- coding: utf-8 -*-
"""Shared primitives: build one ordered draw list, emit .excalidraw + .svg."""
import json, random, xml.sax.saxutils as sx

rnd = random.Random(20251007)
_n = [0]


def nid(p="el"):
    _n[0] += 1
    return "%s-%04d" % (p, _n[0])


OPS = []  # ordered draw list -> both backends

PAL = {
    "client": ("#e7f5ff", "#1971c2"),
    "edge": ("#fff9db", "#f08c00"),
    "web": ("#e6fcf5", "#099268"),
    "gw": ("#f3f0ff", "#7048e8"),
    "svc": ("#fff0f6", "#c2255c"),
    "data": ("#ebfbee", "#2f9e44"),
    "async": ("#fff5f5", "#e03131"),
    "ext": ("#f1f3f5", "#868e96"),
    "plat": ("#f8f9fa", "#495057"),
    "white": ("#ffffff", "#343a40"),
    "pick": ("#d3f9d8", "#2b8a3e"),
    "reject": ("#ffe3e3", "#c92a2a"),
    "maybe": ("#fff3bf", "#e67700"),
    "band": ("#fcfcfd", "#ced4da"),
    "note": ("#fffbea", "#b08900"),
}
INK = "#1a1d23"
SUB = "#495057"
MUTE = "#6c757d"


def cpl(w, fs, mono, pad):
    ratio = 0.605 if mono else 0.545
    return max(8, int((w - pad * 2) / (fs * ratio)))


def wrap(text_in, w, fs, mono, pad):
    lim = cpl(w, fs, mono, pad)
    out = []
    for para in text_in.split("\n"):
        if not para.strip():
            out.append("")
            continue
        if len(para.rstrip()) <= lim:
            out.append(para.rstrip())   # fits as-is: keep column alignment intact
            continue
        indent = len(para) - len(para.lstrip(" "))
        pre = " " * indent
        words, line = para.split(), ""
        for wd in words:
            cand = wd if not line else line + " " + wd
            if len(pre + cand) <= lim:
                line = cand
            else:
                if line:
                    out.append(pre + line)
                line = wd
        out.append(pre + line)
    return out


def tblock_h(lines, fs, lh):
    return len(lines) * fs * lh


def rect(x, y, w, h, fill, stroke, sw=2, r=12, dash=None):
    d = dict(k="rect", x=x, y=y, w=w, h=h, fill=fill, stroke=stroke, sw=sw, r=r, dash=dash)
    OPS.append(d)
    return d


def text(x, y, lines, fs, fill=INK, align="left", mono=False, lh=1.25, w=None):
    d = dict(k="text", x=x, y=y, lines=lines, fs=fs, fill=fill, align=align,
             mono=mono, lh=lh, w=w)
    OPS.append(d)
    return d


def arrow(x1, y1, x2, y2, stroke=SUB, dash=None, sw=2, both=False):
    d = dict(k="arrow", x1=x1, y1=y1, x2=x2, y2=y2, stroke=stroke, dash=dash, sw=sw, both=both)
    OPS.append(d)
    return d


def line(x1, y1, x2, y2, stroke="#ced4da", dash="dotted", sw=1.5):
    d = dict(k="line", x1=x1, y1=y1, x2=x2, y2=y2, stroke=stroke, dash=dash, sw=sw)
    OPS.append(d)
    return d


PAD = 14


def box_need(w, title, body, fs_t, fs_b, mono_body):
    lt = wrap(title, w, fs_t, False, PAD) if title else []
    lb = wrap(body, w, fs_b, mono_body, PAD) if body else []
    h = 2 * PAD + tblock_h(lt, fs_t, 1.22) + (8 if (lt and lb) else 0) + tblock_h(lb, fs_b, 1.42)
    return h, lt, lb


def box(x, y, w, h, title, body="", style="white", fs_t=15, fs_b=12,
        mono_body=False, align="center", sw=2, grow=True, vtop=False,
        fill=None, stroke=None, dash=None, body_fill=SUB):
    bg, st = PAL[style]
    bg = fill or bg
    st = stroke or st
    need, lt, lb = box_need(w, title, body, fs_t, fs_b, mono_body)
    if grow:
        h = max(h, need)
    rect(x, y, w, h, bg, st, sw=sw, dash=dash)
    content_h = need - 2 * PAD
    top = y + PAD if (vtop or need >= h - 2) else y + (h - content_h) / 2.0
    if lt:
        if align == "left":
            text(x + PAD, top, lt, fs_t, INK, "left", False, 1.22, w - 2 * PAD)
        else:
            text(x, top, lt, fs_t, INK, "center", False, 1.22, w)
        top += tblock_h(lt, fs_t, 1.22) + (8 if lb else 0)
    if lb:
        if align == "left":
            text(x + PAD, top, lb, fs_b, body_fill, "left", mono_body, 1.42, w - 2 * PAD)
        else:
            text(x, top, lb, fs_b, body_fill, "center", mono_body, 1.42, w)
    return h


def row(specs, x0, total_w, y, gap=20, min_h=90, **kw):
    """specs = [(title, body, style)] -> all boxes share the tallest height."""
    n = len(specs)
    w = (total_w - gap * (n - 1)) / float(n)
    hs = []
    for (t, b, s) in specs:
        need, _, _ = box_need(w, t, b, kw.get("fs_t", 15), kw.get("fs_b", 12),
                              kw.get("mono_body", False))
        hs.append(need)
    h = max(min_h, max(hs))
    for i, (t, b, s) in enumerate(specs):
        box(x0 + i * (w + gap), y, w, h, t, b, s, grow=False, **kw)
    return h


def grid(specs, x0, total_w, y, cols, gap=20, vgap=20, min_h=90, **kw):
    """Row-major grid; each row sized to its own tallest cell. Returns height."""
    w = (total_w - gap * (cols - 1)) / float(cols)
    cur = y
    for i in range(0, len(specs), cols):
        chunk = specs[i:i + cols]
        hs = []
        for (t, b, s) in chunk:
            need, _, _ = box_need(w, t, b, kw.get("fs_t", 15), kw.get("fs_b", 12),
                                  kw.get("mono_body", False))
            hs.append(need)
        h = max(min_h, max(hs))
        for j, (t, b, s) in enumerate(chunk):
            box(x0 + j * (w + gap), cur, w, h, t, b, s, grow=False, **kw)
        cur += h + vgap
    return cur - vgap - y


COMMON = dict(isDeleted=False, fillStyle="solid", strokeWidth=2, strokeStyle="solid",
              roughness=0, opacity=100, angle=0, groupIds=[], frameId=None,
              boundElements=None, updated=1, link=None, locked=False, version=1)


def _seed():
    return rnd.randint(1, 2 ** 31)


def _stroke_style(dash):
    return {"dotted": "dotted", "dashed": "dashed"}.get(dash, "solid")


def _sw(v):
    return 1 if v <= 1.5 else (2 if v <= 2.5 else 4)


def to_excalidraw(path):
    els = []
    for o in OPS:
        base = dict(COMMON)
        base.update(id=nid(), seed=_seed(), versionNonce=_seed())
        if o["k"] == "rect":
            base.update(type="rectangle", x=o["x"], y=o["y"], width=o["w"], height=o["h"],
                        strokeColor=o["stroke"], backgroundColor=o["fill"],
                        strokeWidth=_sw(o["sw"]), strokeStyle=_stroke_style(o["dash"]),
                        roundness={"type": 3} if o["r"] else None)
            els.append(base)
        elif o["k"] == "text":
            txt = "\n".join(o["lines"])
            wmax = max((len(l) for l in o["lines"]), default=1)
            ratio = 0.605 if o["mono"] else 0.545
            w = o["w"] or max(10, wmax * o["fs"] * ratio)
            base.update(type="text", x=o["x"], y=o["y"], width=w,
                        height=tblock_h(o["lines"], o["fs"], o["lh"]),
                        strokeColor=o["fill"], backgroundColor="transparent",
                        fontSize=o["fs"], fontFamily=3 if o["mono"] else 2,
                        text=txt, originalText=txt, textAlign=o["align"],
                        verticalAlign="top", containerId=None, lineHeight=o["lh"],
                        autoResize=False, baseline=o["fs"] * 0.8)
            els.append(base)
        else:
            dx, dy = o["x2"] - o["x1"], o["y2"] - o["y1"]
            base.update(type="arrow" if o["k"] == "arrow" else "line",
                        x=o["x1"], y=o["y1"], width=abs(dx), height=abs(dy),
                        strokeColor=o["stroke"], backgroundColor="transparent",
                        strokeWidth=_sw(o["sw"]), strokeStyle=_stroke_style(o["dash"]),
                        points=[[0, 0], [dx, dy]], lastCommittedPoint=None,
                        startBinding=None, endBinding=None, roundness={"type": 2},
                        startArrowhead="arrow" if o.get("both") else None,
                        endArrowhead="arrow" if o["k"] == "arrow" else None,
                        elbowed=False)
            els.append(base)
    doc = {"type": "excalidraw", "version": 2, "source": "https://excalidraw.com",
           "elements": els,
           "appState": {"gridSize": None, "gridStep": 5, "gridModeEnabled": False,
                        "viewBackgroundColor": "#ffffff"},
           "files": {}}
    with open(path, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1)
    return len(els)


MONO = "ui-monospace, SFMono-Regular, Consolas, Liberation Mono, monospace"
SANS = "Inter, Helvetica Neue, Helvetica, Arial, sans-serif"


def to_svg(path, pad=48):
    xs, ys = [], []
    for o in OPS:
        if o["k"] == "rect":
            xs += [o["x"], o["x"] + o["w"]]
            ys += [o["y"], o["y"] + o["h"]]
        elif o["k"] == "text":
            xs += [o["x"], o["x"] + (o["w"] or 200)]
            ys += [o["y"], o["y"] + tblock_h(o["lines"], o["fs"], o["lh"])]
        else:
            xs += [o["x1"], o["x2"]]
            ys += [o["y1"], o["y2"]]
    x0, y0, x1, y1 = min(xs) - pad, min(ys) - pad, max(xs) + pad, max(ys) + pad
    W, H = x1 - x0, y1 - y0
    out = ['<svg xmlns="http://www.w3.org/2000/svg" width="%.0f" height="%.0f" '
           'viewBox="%.0f %.0f %.0f %.0f">' % (W, H, x0, y0, W, H),
           '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
           'markerHeight="7" orient="auto-start-reverse">'
           '<path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker></defs>',
           '<rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" fill="#ffffff"/>'
           % (x0, y0, W, H)]
    for o in OPS:
        if o["k"] == "rect":
            da = {"dotted": ' stroke-dasharray="2 5"',
                  "dashed": ' stroke-dasharray="10 7"'}.get(o["dash"], "")
            out.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="%d" '
                       'fill="%s" stroke="%s" stroke-width="%.1f"%s/>'
                       % (o["x"], o["y"], o["w"], o["h"], o["r"], o["fill"],
                          o["stroke"], o["sw"], da))
        elif o["k"] == "text":
            fam = MONO if o["mono"] else SANS
            anc = {"left": "start", "center": "middle", "right": "end"}[o["align"]]
            tx = o["x"] + (o["w"] or 0) / 2.0 if o["align"] == "center" else o["x"]
            fs, lh = o["fs"], o["lh"]
            out.append('<text x="%.1f" y="%.1f" font-size="%.1f" font-family="%s" '
                       'fill="%s" text-anchor="%s" xml:space="preserve">'
                       % (tx, o["y"] + fs * 0.92, fs, fam, o["fill"], anc))
            for i, ln in enumerate(o["lines"]):
                dy = 0 if i == 0 else fs * lh
                out.append('<tspan x="%.1f" dy="%.1f">%s</tspan>'
                           % (tx, dy, sx.escape(ln) if ln else " "))
            out.append('</text>')
        else:
            da = {"dotted": ' stroke-dasharray="2 5"',
                  "dashed": ' stroke-dasharray="10 7"'}.get(o["dash"], "")
            mk = ' marker-end="url(#ah)"' if o["k"] == "arrow" else ""
            if o.get("both"):
                mk += ' marker-start="url(#ah)"'
            out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" '
                       'stroke-width="%.1f" stroke-linecap="round"%s%s/>'
                       % (o["x1"], o["y1"], o["x2"], o["y2"], o["stroke"], o["sw"], da, mk))
    out.append('</svg>')
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(out))
    return W, H
