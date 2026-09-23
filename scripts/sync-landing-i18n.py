#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sync every localized landing page from the master template.

Master  : index.html  (Simplified Chinese, the redesign)
Catalog : scripts/i18n-landing.json   (zh source string -> en / ja / ko / tw)
Output  : landing.html, landing-en.html, landing-ja.html, landing-ko.html, landing-zh-TW.html

Edit index.html (or the catalog) and re-run to regenerate all languages:

    python scripts/sync-landing-i18n.py

Everything in the generated pages comes from the master template, so the
visual style can never drift between languages.
"""

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER = os.path.join(ROOT, "index.html")
CATALOG = os.path.join(ROOT, "scripts", "i18n-landing.json")

# lang key -> output file
TARGETS = [
    ("zh", "landing.html"),
    ("en", "landing-en.html"),
    ("ja", "landing-ja.html"),
    ("ko", "landing-ko.html"),
    ("tw", "landing-zh-TW.html"),
]

# language switcher entries, shared by every page
SWITCHER = [
    ("🇨🇳 中文", "landing.html", "zh"),
    ("🇺🇸 English", "landing-en.html", "en"),
    ("🇯🇵 日本語", "landing-ja.html", "ja"),
    ("🇰🇷 한국어", "landing-ko.html", "ko"),
    ("🇹🇼 繁體中文", "landing-zh-TW.html", "tw"),
]

# doc / store links that must point at the matching language edition
LINK_SLOTS = [
    ("docs/spec-zh-CN.html", "docs_spec"),
    ("docs/example-zh-CN.html", "docs_example"),
    ("docs/store-guide-zh-CN.html", "docs_storeguide"),
    ("store-zh-CN.html", "store"),
]

# strings in the master that have to be swapped rather than translated
MASTER_PHRASES = re.compile(r"const phrases = \[.*?\];", re.S)

# the demo widget: UI-language select, direction pairs and the floating bubble pair
DEMO_UI_SELECT = re.compile(r'(<div class="du-head"><b>🌐 QuickTranslate</b><select>).*?(</select>)', re.S)
DEMO_PAIR_SELECT = re.compile(r'(<select class="du-sel">).*?(</select>)', re.S)
DEMO_SRC = re.compile(r'(<div class="psrc">).*?(</div>)', re.S)
DEMO_TGT = re.compile(r'(<div class="ptgt">).*?(</div>)', re.S)


def die(msg):
    print("ERROR: " + msg, file=sys.stderr)
    sys.exit(1)


def load(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def build_switcher(active_lang):
    """Rebuild the language dropdown so the current language is marked active."""
    rows = []
    for label, href, lang in SWITCHER:
        cls = ' class="active"' if lang == active_lang else ""
        rows.append('          <a href="%s"%s>%s</a>' % (href, cls, label))
    return (
        '        <div class="lang-content" id="langContent">\n'
        + "\n".join(rows)
        + "\n        </div>"
    )


def translate(html, lang, catalog):
    """Apply every catalog entry, longest source string first."""
    stats = {"hits": 0, "missed": []}
    entries = sorted(catalog.items(), key=lambda kv: -len(kv[0]))

    for src, trans in entries:
        dst = trans.get(lang)
        if not dst or dst == src:
            continue
        esc = re.escape(src)
        before = html
        # text node:  >...SRC...<     attribute:  "...SRC..."    js literal:  '...SRC...'
        html = re.sub(r"(>)(\s*)" + esc + r"(\s*)(<)", lambda m, d=dst: m.group(1) + m.group(2) + d + m.group(3) + m.group(4), html)
        html = re.sub(r'(")(\s*)' + esc + r'(\s*)(")', lambda m, d=dst: m.group(1) + m.group(2) + d + m.group(3) + m.group(4), html)
        html = re.sub(r"(')(\s*)" + esc + r"(\s*)(')", lambda m, d=dst: m.group(1) + m.group(2) + d + m.group(3) + m.group(4), html)
        if html != before:
            stats["hits"] += 1
        else:
            stats["missed"].append(src)
    return html, stats


def read_master_meta(master):
    """Pull the zh-CN meta values straight out of the master so they never drift."""
    def grab(pattern):
        m = re.search(pattern, master, re.S)
        return m.group(1) if m else None

    return {
        "lang": grab(r'<html lang="([^"]+)"'),
        "canonical": grab(r'<link rel="canonical" href="([^"]+)"'),
        "og_locale": grab(r'<meta property="og:locale" content="([^"]+)"'),
        "description": grab(r'<meta name="description" content="([^"]+)"'),
        "keywords": grab(r'<meta name="keywords" content="([^"]+)"'),
        "og_desc": grab(r'<meta property="og:description" content="([^"]+)"'),
        "twitter_desc": grab(r'<meta name="twitter:description" content="([^"]+)"'),
        "aria_theme": grab(r'aria-label="([^"]+)"'),
    }


def apply_demo(html, lang, catalog):
    """Rewrite the live-demo widget so every language shows a coherent pair."""
    demo = catalog["demo"][lang]
    ui = "".join("<option>%s</option>" % o for o in demo["ui"])
    pairs = "".join("<option>%s</option>" % o for o in demo["pairs"])
    html = DEMO_UI_SELECT.sub(lambda m: m.group(1) + ui + m.group(2), html, count=1)
    html = DEMO_PAIR_SELECT.sub(lambda m: m.group(1) + pairs + m.group(2), html, count=1)
    html = DEMO_SRC.sub(lambda m: m.group(1) + demo["src"] + m.group(2), html, count=1)
    html = DEMO_TGT.sub(lambda m: m.group(1) + demo["tgt"] + m.group(2), html, count=1)
    return html


def localize(html, lang, page, catalog, master_meta):
    meta = catalog["meta"].get(lang)

    if meta:
        # <html lang>
        html = html.replace('<html lang="%s"' % master_meta["lang"], '<html lang="%s"' % meta["lang"])
        # meta description / keywords
        html = html.replace(master_meta["description"], meta["description"])
        html = html.replace(master_meta["keywords"], meta["keywords"])
        # Open Graph
        html = html.replace(master_meta["og_desc"], meta["og_desc"])
        html = html.replace('content="%s"' % master_meta["og_locale"], 'content="%s"' % meta["og_locale"])
        html = html.replace('content="%s"' % master_meta["canonical"], 'content="%s"' % meta["canonical"])
        html = html.replace('href="%s"' % master_meta["canonical"], 'href="%s"' % meta["canonical"])
        # Twitter
        html = html.replace(master_meta["twitter_desc"], meta["twitter_desc"])
        # aria-label on the theme toggle
        html = html.replace('aria-label="%s"' % master_meta["aria_theme"], 'aria-label="%s"' % meta["aria_theme"])

    # language dropdown
    html = re.sub(
        r'        <div class="lang-content" id="langContent">.*?        </div>',
        lambda m: build_switcher(lang),
        html,
        count=1,
        flags=re.S,
    )

    # brand links to this page
    html = html.replace('<a class="brand" href="index.html">', '<a class="brand" href="%s">' % page)

    # doc / store links
    for needle, slot in LINK_SLOTS:
        html = html.replace('href="%s"' % needle, 'href="%s"' % catalog["links"][slot][lang])

    # typewriter phrases (the zh master already carries its own)
    if lang in catalog["phrases"]:
        phrases = ", ".join("'%s'" % p for p in catalog["phrases"][lang])
        html = MASTER_PHRASES.sub("const phrases = [%s];" % phrases, html, count=1)

    # live-demo widget (must run before the catalog pass so nothing re-translates it)
    html = apply_demo(html, lang, catalog)

    # demo pair: on the English page Chinese becomes the source, English the target
    if lang == "en":
        swap = catalog["swap_en"]
        html = html.replace(">" + swap["src_zh"] + "<", ">\x00SRC\x00<")
        html = html.replace(">" + swap["tgt_zh"] + "<", ">" + swap["src_zh"] + "<")
        html = html.replace(">\x00SRC\x00<", ">" + swap["tgt_zh"] + "<")

    html, stats = translate(html, lang, catalog["text"])
    return html, stats


def apply_attr(html, lang, catalog):
    for src, trans in catalog["attr"].items():
        dst = trans.get(lang)
        if dst and dst != src:
            html = html.replace('"%s"' % src, '"%s"' % dst)
    return html


def main():
    if not os.path.exists(MASTER):
        die("master template not found: " + MASTER)
    if not os.path.exists(CATALOG):
        die("catalog not found: " + CATALOG)

    master = load(MASTER)
    catalog = json.loads(load(CATALOG))
    master_meta = read_master_meta(master)

    # emit the same newline style as the master so working-tree diffs stay clean
    with open(MASTER, "rb") as fh:
        newline = "\r\n" if b"\r\n" in fh.read() else "\n"

    missing = [k for k in ("lang", "canonical", "description", "keywords", "og_desc", "twitter_desc", "aria_theme")
               if not master_meta.get(k)]
    if missing:
        die("could not read from master: " + ", ".join(missing))

    print("master : index.html (%d bytes)" % len(master))
    print("catalog: %d entries\n" % len(catalog["text"]))

    for lang, page in TARGETS:
        html, stats = localize(master, lang, page, catalog, master_meta)
        html = apply_attr(html, lang, catalog)
        html = html.replace("\r\n", "\n")
        if newline != "\n":
            html = html.replace("\n", newline)
        with open(os.path.join(ROOT, page), "w", encoding="utf-8", newline="") as fh:
            fh.write(html)
        flag = "" if not stats["missed"] else "  [%d unmatched]" % len(stats["missed"])
        print("  -> %-22s %6d bytes   %3d/%d entries applied%s"
              % (page, len(html), stats["hits"], len(catalog["text"]), flag))
        for miss in stats["missed"]:
            print("        unmatched: %s" % miss[:70])

    print("\nDone.")


if __name__ == "__main__":
    main()
