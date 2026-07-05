"""DS token -> OOXML theme (clrScheme/fontScheme) writer (data-model.md §4).

Overrides the presentation's ThemePart so that DS-token-derived colors and
Noto Sans JP become the deck-wide default (Clarification #2 in spec.md): not
just placeholder fills, but the default color/font PowerPoint offers for any
shape a user draws later.
"""

from lxml import etree
from pptx.opc.constants import RELATIONSHIP_TYPE as RT
from pptx.oxml import parse_xml

A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
NSMAP = {"a": A_NS}

# OOXML theme color slot -> DS token role (data-model.md §4 ThemeMapping).
THEME_SLOT_MAP = {
    "dk1": "text-primary",
    "lt1": "slide-bg",
    "dk2": "text-secondary",
    "lt2": "surface",
    "accent1": "accent",
    "accent2": "accent-strong",
    "accent3": "accent-weak",
    "accent4": "state-success",
    "accent5": "state-error",
    "accent6": "state-warning",
    "hlink": "accent",
    "folHlink": "accent",
}

FONT_ROLE = "font-sans"


def _qn(tag: str) -> str:
    prefix, local = tag.split(":")
    return f"{{{NSMAP[prefix]}}}{local}"


def _set_solid_color(slot_element: etree._Element, hex_color: str) -> None:
    """Replace a clrScheme slot's child color element with a fixed srgbClr."""
    hex_color = hex_color.lstrip("#").upper()
    for child in list(slot_element):
        slot_element.remove(child)
    srgb = etree.SubElement(slot_element, _qn("a:srgbClr"))
    srgb.set("val", hex_color)


def apply_theme(prs, token_values: dict) -> None:
    """Overwrite theme color/font scheme in-place on *prs* using *token_values*.

    `token_values` maps DS token role names (e.g. "accent", "text-primary",
    "font-sans") to resolved values: colors as "#RRGGBB" strings, fonts as
    typeface name strings.
    """
    theme_part = prs.slide_masters[0].part.part_related_by(RT.THEME)
    root = parse_xml(theme_part.blob)

    clr_scheme = root.find(f".//{_qn('a:clrScheme')}")
    for slot_name, token_role in THEME_SLOT_MAP.items():
        slot_element = clr_scheme.find(_qn(f"a:{slot_name}"))
        if slot_element is None:
            continue
        color_hex = token_values.get(token_role)
        if not color_hex:
            continue
        _set_solid_color(slot_element, color_hex)

    font_family = token_values.get(FONT_ROLE)
    if font_family:
        for font_group in ("majorFont", "minorFont"):
            latin = root.find(f".//{_qn(f'a:{font_group}')}/{_qn('a:latin')}")
            if latin is not None:
                latin.set("typeface", font_family)

    # ThemePart is a plain (non-XML-aware) opc.package.Part in python-pptx: its
    # `.blob` returns the raw bytes captured at load time, it does not
    # re-serialize from an `_element`. Write the edited XML back explicitly.
    theme_part._blob = etree.tostring(
        root, xml_declaration=True, encoding="UTF-8", standalone=True
    )
