"""W5 production layer — the tangible brand assets, generated from the living Brand Core.

Both competitors (Tailor Brands, ZenBusiness) win on tangible output: a real logo, brand assets, and
a published website. We keep our moat (grounded strategy + co-founder coaching) and add that output
here — but *derived from the Brand Core*, so it stays on-brand by construction and in sync: change
the Core and the wordmark, favicon, and site all follow. No image model needed; clean vector + HTML.
"""

from __future__ import annotations

import base64
import html
from typing import Any

from startupkit.core.company_object.brand_types import VisualSystem
from startupkit.core.company_object.projections.snapshot import CompanySnapshot


def _color(visual: VisualSystem, role: str, default: str) -> str:
    for s in visual.palette:
        if s.role == role:
            return s.hex
    return default


def _accent(visual: VisualSystem) -> str:
    for role in ("accent", "support"):
        for s in visual.palette:
            if s.role == role:
                return s.hex
    return _color(visual, "primary", "#4C46E8")


def _initial(name: str) -> str:
    letters = [c for c in name if c.isalnum()]
    return letters[0].upper() if letters else "S"


def _esc(text: str) -> str:
    return html.escape(text or "")


# ================================== Logo — SVG wordmark + favicon ================================


def svg_wordmark(name: str, visual: VisualSystem) -> str:
    """A clean vector wordmark: an initial mark + the name set in the brand's display type/color."""
    primary = _color(visual, "primary", "#4C46E8")
    ink = _color(visual, "ink", "#12131A")
    paper = _color(visual, "paper", "#FFFFFF")
    display = visual.type_display or "Inter"
    label = _esc(name or "Your Brand")
    initial = _esc(_initial(name))
    # Rough monospace-ish estimate so the viewBox hugs the text at font-size 64.
    text_w = int(len(name or "Your Brand") * 38)
    total_w = 150 + text_w
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_w} 128" '
        f'width="{total_w}" height="128" font-family="{display}, Inter, system-ui, sans-serif">'
        f'<rect x="16" y="24" width="80" height="80" rx="20" fill="{primary}"/>'
        f'<text x="56" y="82" text-anchor="middle" font-size="52" font-weight="800" '
        f'fill="{paper}">{initial}</text>'
        f'<text x="122" y="82" font-size="64" font-weight="800" fill="{ink}" '
        f'letter-spacing="-1.5">{label}</text>'
        f"</svg>"
    )


def svg_favicon(name: str, visual: VisualSystem) -> str:
    """A square favicon: brand-color rounded tile with the initial in the paper color."""
    primary = _color(visual, "primary", "#4C46E8")
    paper = _color(visual, "paper", "#FFFFFF")
    initial = _esc(_initial(name))
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">'
        f'<rect width="64" height="64" rx="16" fill="{primary}"/>'
        f'<text x="32" y="45" text-anchor="middle" font-size="38" font-weight="800" '
        f'fill="{paper}" font-family="Inter, system-ui, sans-serif">{initial}</text>'
        "</svg>"
    )


# ================================== Published website (hosted HTML) ==============================
# Three real, polished, responsive templates the founder picks from (ZenBusiness-style), all
# generated from the Brand Core so they stay on-brand and in sync.

SITE_TEMPLATES = ["minimal", "bold", "classic"]

_CTA_BY_PLAY = {
    "trust-first": "Book a demo",
    "premium": "Request access",
    "community-led": "Join free",
    "challenger": "Try it free",
    "category-creator": "Get started",
}


def _favicon_b64(name: str, visual: VisualSystem) -> str:
    return base64.b64encode(svg_favicon(name, visual).encode("utf-8")).decode()


def _site_ctx(snap: CompanySnapshot) -> dict[str, Any]:
    core = snap.brand.core
    visual = snap.brand.visual
    return {
        "name": _esc(snap.name),
        "initial": _esc(_initial(snap.name)),
        "tagline": _esc(core.tagline or snap.one_liner or snap.name),
        "pitch": _esc(core.pitch or snap.solution or ""),
        "positioning": _esc(core.positioning or ""),
        "category": _esc(core.category or snap.industry or ""),
        "cta": _CTA_BY_PLAY.get(core.play_id, "Get started"),
        "primary": _color(visual, "primary", "#4C46E8"),
        "ink": _color(visual, "ink", "#12131A"),
        "paper": _color(visual, "paper", "#FFFFFF"),
        "accent": _accent(visual),
        "display": visual.type_display or "Inter",
        "pillars": [p for p in (core.pillars or []) if p][:3],
        "values": [v for v in (core.values or []) if v][:4],
        "fav": _favicon_b64(snap.name, visual),
    }


_BASE_CSS = """
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:Inter,system-ui,-apple-system,sans-serif;color:var(--ink);
  background:var(--paper);line-height:1.6;-webkit-font-smoothing:antialiased}
img{max-width:100%}
.wrap{max-width:1120px;margin:0 auto;padding:0 24px}
a{text-decoration:none}
nav{display:flex;align-items:center;justify-content:space-between;padding:22px 0}
.logo{display:flex;align-items:center;gap:10px;font-family:var(--display);
  font-weight:800;font-size:20px;letter-spacing:-.4px}
.logo .m{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;
  justify-content:center;font-weight:800;font-size:17px;background:var(--primary);color:#fff}
.nav-links{display:flex;gap:26px;align-items:center}
.nav-links a{color:var(--ink);opacity:.7;font-size:15px;font-weight:500}
.btn{display:inline-block;border-radius:12px;font-weight:600;font-size:16px;
  padding:14px 28px;cursor:pointer;transition:transform .1s}
.btn:hover{transform:translateY(-1px)}
.btn-primary{background:var(--primary);color:#fff}
.btn-accent{background:var(--accent);color:#fff}
.btn-ghost{border:1.5px solid rgba(0,0,0,.14);color:var(--ink)}
.eyebrow{font-family:var(--display);text-transform:uppercase;letter-spacing:1.5px;
  font-size:13px;font-weight:700;color:var(--primary);margin-bottom:16px}
h1{font-family:var(--display);font-weight:800;letter-spacing:-2px;line-height:1.05;
  font-size:clamp(36px,6vw,64px)}
.lede{font-size:clamp(17px,2.3vw,21px);opacity:.72;margin-top:20px;max-width:640px}
.cta-row{display:flex;flex-wrap:wrap;gap:14px;margin-top:34px}
.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
  gap:20px;padding:20px 0 64px}
.feat{border:1px solid rgba(0,0,0,.09);border-radius:18px;padding:28px;background:#fff}
.feat .ic{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;
  justify-content:center;font-weight:800;color:#fff;font-size:18px;background:var(--primary)}
.feat h3{font-family:var(--display);font-size:19px;font-weight:700;margin-top:18px}
.feat p{font-size:15px;opacity:.66;margin-top:8px}
footer{border-top:1px solid rgba(0,0,0,.09);padding:30px 0;font-size:13px;opacity:.6;
  display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:20px}
.cta-band{background:var(--ink);color:#fff;border-radius:24px;padding:56px 40px;
  text-align:center;margin:20px 0 40px}
.cta-band h2{font-family:var(--display);font-size:clamp(26px,4vw,40px);letter-spacing:-1px}
.cta-band p{opacity:.7;margin-top:12px;font-size:17px}
.chips{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.chips span{border:1px solid var(--primary);color:var(--primary);border-radius:999px;
  padding:7px 15px;font-size:14px;font-weight:600}
@media(max-width:720px){.nav-links{display:none}}
"""


def _feature_cards(ctx: dict[str, Any]) -> str:
    pillars = ctx["pillars"] or ["Simple to adopt", "Built to scale", "Trusted by teams"]
    subs = [
        "Set up in minutes with no heavy lift for your team.",
        "Grows with you from day one to your next round.",
        "The reliability your customers and investors expect.",
    ]
    out = []
    for i, p in enumerate(pillars):
        out.append(
            f'<div class="feat"><div class="ic">{i + 1}</div>'
            f"<h3>{_esc(str(p))}</h3><p>{subs[i % len(subs)]}</p></div>"
        )
    return "".join(out)


def _page(ctx: dict[str, Any], extra_css: str, body: str) -> str:
    fam = str(ctx["display"]).replace(" ", "+")
    fonts = (
        '<link rel="preconnect" href="https://fonts.googleapis.com">'
        f'<link href="https://fonts.googleapis.com/css2?family={fam}:wght@400;600;700;800'
        '&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">'
    )
    return f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{ctx["name"]} — {ctx["tagline"]}</title>
<link rel="icon" href="data:image/svg+xml;base64,{ctx["fav"]}">
{fonts}
<style>
:root{{--primary:{ctx["primary"]};--ink:{ctx["ink"]};--paper:{ctx["paper"]};
  --accent:{ctx["accent"]};--display:'{ctx["display"]}',Inter,sans-serif}}
{_BASE_CSS}{extra_css}
</style></head>
<body>{body}</body></html>"""


def _nav(ctx: dict[str, Any], links: bool = False, on_dark: bool = False) -> str:
    link_html = ""
    if links:
        link_html = (
            '<div class="nav-links"><a href="#features">Features</a>'
            '<a href="#why">Why us</a><a href="#start">Pricing</a></div>'
        )
    btn = "btn-ghost" if on_dark else "btn-primary"
    return (
        f'<nav><div class="logo"><span class="m">{ctx["initial"]}</span>{ctx["name"]}</div>'
        f'{link_html}<a class="btn {btn}" href="#start">{ctx["cta"]}</a></nav>'
    )


def _footer(ctx: dict[str, Any]) -> str:
    return f"<footer><span>© {ctx['name']}</span><span>Built with StartupKit</span></footer>"


def _tpl_minimal(ctx: dict[str, Any]) -> tuple[str, str]:
    css = """
.hero-min{text-align:center;padding:72px 0 40px;max-width:800px;margin:0 auto}
.hero-min .cta-row{justify-content:center}
.trust{margin-top:26px;font-size:14px;opacity:.5;font-weight:500}
.quote{max-width:820px;margin:0 auto;text-align:center;padding:32px 0 64px}
.quote p{font-family:var(--display);font-size:clamp(20px,3vw,28px);
  font-weight:700;letter-spacing:-.5px;line-height:1.35}
"""
    val0 = str(ctx["values"][0]) if ctx["values"] else "getting it right"
    body = f"""<div class="wrap">
{_nav(ctx)}
<section class="hero-min">
  {f'<p class="eyebrow">{ctx["category"]}</p>' if ctx["category"] else ""}
  <h1>{ctx["tagline"]}</h1>
  <p class="lede" style="margin-left:auto;margin-right:auto">{ctx["pitch"]}</p>
  <div class="cta-row"><a class="btn btn-accent" href="#start">{ctx["cta"]}</a>
    <a class="btn btn-ghost" href="#features">See how it works</a></div>
  <p class="trust">Built for teams who care about {_esc(val0)}</p>
</section>
<section class="features" id="features">{_feature_cards(ctx)}</section>
{f'<section class="quote"><p>“{ctx["positioning"]}”</p></section>' if ctx["positioning"] else ""}
<div id="start"></div>
{_footer(ctx)}
</div>"""
    return css, body


def _tpl_bold(ctx: dict[str, Any]) -> tuple[str, str]:
    css = """
.bold-hero{background:var(--primary);color:#fff;padding-bottom:80px}
.bold-hero .logo,.bold-hero .nav-links a{color:#fff}
.bold-hero .logo .m{background:#fff;color:var(--primary)}
.bold-inner{max-width:820px;padding-top:40px}
.bold-inner h1{font-size:clamp(40px,7vw,72px)}
.bold-inner .lede{opacity:.9;color:#fff}
.features-bold{padding-top:56px}
"""
    body = f"""<header class="bold-hero"><div class="wrap">
{_nav(ctx, on_dark=True)}
<section class="bold-inner">
  <h1>{ctx["tagline"]}</h1>
  <p class="lede">{ctx["pitch"]}</p>
  <div class="cta-row"><a class="btn btn-accent" href="#start">{ctx["cta"]}</a></div>
</section></div></header>
<div class="wrap">
<section class="features features-bold" id="features">{_feature_cards(ctx)}</section>
<section class="cta-band" id="start"><h2>{ctx["tagline"]}</h2>
  <p>{ctx["positioning"] or ctx["pitch"]}</p>
  <div style="margin-top:26px"><a class="btn btn-accent" href="#">{ctx["cta"]}</a></div></section>
{_footer(ctx)}
</div>"""
    return css, body


def _tpl_classic(ctx: dict[str, Any]) -> tuple[str, str]:
    css = """
.split{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center;
  padding:48px 0 64px}
.split-r{position:relative}
.mock{background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:18px;
  box-shadow:0 30px 60px -30px rgba(0,0,0,.35);overflow:hidden}
.mock .bar{display:flex;gap:6px;padding:14px 16px;border-bottom:1px solid rgba(0,0,0,.08)}
.mock .bar i{width:11px;height:11px;border-radius:50%;background:rgba(0,0,0,.14)}
.mock .body{padding:22px}
.mock .stat{height:60px;border-radius:12px;background:var(--primary);opacity:.12;margin-bottom:14px}
.mock .ln{height:12px;border-radius:6px;background:rgba(0,0,0,.08);margin-bottom:10px}
.mock .ln.s{width:60%}
.logos{display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:6px 0 44px;
  border-top:1px solid rgba(0,0,0,.07);opacity:.85}
.logos b{font-size:13px;text-transform:uppercase;letter-spacing:1px;opacity:.5;margin-right:6px}
.quote-card{border:1px solid rgba(0,0,0,.1);border-radius:20px;padding:36px;
  background:#fff;margin:8px 0 48px}
.quote-card p{font-family:var(--display);font-size:clamp(19px,2.6vw,26px);
  font-weight:700;letter-spacing:-.4px;line-height:1.4}
.quote-card span{display:block;margin-top:14px;opacity:.55;font-size:15px;font-weight:600}
@media(max-width:820px){.split{grid-template-columns:1fr}}
"""
    val_chips = "".join(f"<span>{_esc(str(v))}</span>" for v in ctx["values"])
    quote = ""
    if ctx["positioning"]:
        quote = (
            f'<section class="quote-card" id="why"><p>“{ctx["positioning"]}”</p>'
            f"<span>— {ctx['name']}</span></section>"
        )
    body = f"""<div class="wrap">
{_nav(ctx, links=True)}
<section class="split">
  <div class="split-l">
    {f'<p class="eyebrow">{ctx["category"]}</p>' if ctx["category"] else ""}
    <h1>{ctx["tagline"]}</h1>
    <p class="lede">{ctx["pitch"]}</p>
    <div class="cta-row"><a class="btn btn-primary" href="#start">{ctx["cta"]}</a>
      <a class="btn btn-ghost" href="#features">Learn more</a></div>
  </div>
  <div class="split-r"><div class="mock"><div class="bar"><i></i><i></i><i></i></div>
    <div class="body"><div class="stat"></div><div class="ln"></div>
      <div class="ln"></div><div class="ln s"></div></div></div></div>
</section>
{f'<section class="logos"><b>Built on</b>{val_chips}</section>' if val_chips else ""}
<section class="features" id="features">{_feature_cards(ctx)}</section>
{quote}
<section class="cta-band" id="start"><h2>Ready to get started?</h2>
  <p>{ctx["pitch"]}</p>
  <div style="margin-top:26px"><a class="btn btn-accent" href="#">{ctx["cta"]}</a></div></section>
{_footer(ctx)}
</div>"""
    return css, body


_RENDERERS = {"minimal": _tpl_minimal, "bold": _tpl_bold, "classic": _tpl_classic}


def render_site_html(snap: CompanySnapshot, template: str | None = None) -> str:
    """A real, responsive landing page from the Brand Core, in the founder's chosen template."""
    tpl = template or snap.brand.site_template or "minimal"
    ctx = _site_ctx(snap)
    css, body = _RENDERERS.get(tpl, _tpl_minimal)(ctx)
    return _page(ctx, css, body)
