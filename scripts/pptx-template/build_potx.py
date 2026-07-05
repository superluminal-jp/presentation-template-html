#!/usr/bin/env python3
"""CLI: assemble the 16-layout .potx from the Node/Playwright extraction JSON.

See specs/005-pptx-export-script/contracts/cli-interface.md for the CLI
contract (arguments, exit codes, NDJSON log schema).
"""

import argparse
import json
import sys
from pathlib import Path

from pptx import Presentation
from pptx.oxml.ns import qn

import layout_map
import theme as theme_module
from logging_util import ConversionLog
from potx_writer import save_as_potx

DEFAULT_INPUT = Path("build/slide-layout-data.json")
DEFAULT_OUTPUT = Path("dist/ds-presentation-template.potx")


def _add_frame_elements_to_master(prs, frame_elements: list[dict]) -> None:
    """Add common frame elements (classification/copyright/page number) once
    to the slide master, so all layouts inherit them (FR-013)."""
    if not frame_elements:
        return
    master = prs.slide_masters[0]
    spTree = master.element.find(f"{qn('p:cSld')}/{qn('p:spTree')}")
    # Idempotent: skip if already added (e.g. multiple layouts supply the
    # same frame_elements list, only the first application is needed).
    if spTree.find(f".//{qn('p:cNvPr')}[@name='DS Frame Classification']") is not None:
        return
    for fe in frame_elements:
        _add_master_textbox(spTree, fe)


def _add_master_textbox(spTree, frame_element: dict) -> None:
    from pptx.oxml import parse_xml
    from pptx.oxml.ns import nsdecls

    emu = layout_map.bbox_ratio_to_emu(frame_element["position"])
    shape_id = layout_map._next_shape_id(spTree)
    kind_to_name = {
        "classification": "DS Frame Classification",
        "copyright": "DS Frame Copyright",
        "page_number": "DS Frame Page Number",
    }
    name = kind_to_name.get(frame_element["kind"], f"DS Frame {frame_element['kind']}")
    xml = f"""
<p:sp {nsdecls("a", "p", "r")}>
  <p:nvSpPr>
    <p:cNvPr id="{shape_id}" name="{name}"/>
    <p:cNvSpPr txBox="1"/>
    <p:nvPr/>
  </p:nvSpPr>
  <p:spPr>
    <a:xfrm><a:off x="{int(emu['left'])}" y="{int(emu['top'])}"/><a:ext cx="{int(emu['width'])}" cy="{int(emu['height'])}"/></a:xfrm>
  </p:spPr>
  <p:txBody>
    <a:bodyPr/>
    <a:lstStyle/>
    <a:p><a:r><a:t>{frame_element['text_template']}</a:t></a:r></a:p>
  </p:txBody>
</p:sp>
"""
    sp = parse_xml(xml)
    spTree.append(sp)


def build_presentation(data: dict):
    """Build a python-pptx Presentation from extracted slide-layout data.

    Returns (presentation, log_entries) where log_entries is a list of
    LogEntry dicts (data-model.md) — never raises for per-element issues,
    only for structurally missing top-level data (FR-009).
    """
    log = ConversionLog()
    prs = Presentation()
    prs.slide_width = layout_map.SLIDE_WIDTH_EMU
    prs.slide_height = layout_map.SLIDE_HEIGHT_EMU

    frame_elements_added = False

    for layout_def in data.get("layouts", []):
        layout_id = layout_def.get("layout_id", "unknown")
        layout_name = layout_def.get("layout_name_ja") or layout_map.LAYOUT_NAMES.get(
            layout_id, layout_id
        )
        if layout_id not in layout_map.LAYOUT_NAMES:
            log.warning(
                f"Unknown layout_id '{layout_id}'; converting as a generic layout",
                layout_id=layout_id,
            )

        layout = layout_map.clone_layout(prs, layout_name)

        elements = sorted(
            layout_def.get("elements", []), key=lambda e: e.get("reading_order_index", 0)
        )
        placeholder_idx = 1
        for element in elements:
            role = element.get("role")
            try:
                fallback = element.get("fallback", {}) or {}
                if fallback.get("is_fallback"):
                    image_path = fallback.get("image_path")
                    reason = fallback.get("reason", "unspecified reason")
                    if image_path and Path(image_path).exists():
                        layout_map.add_picture_shape(layout, element, image_path)
                    else:
                        log.warning(
                            f"Fallback image missing on disk ({image_path}); "
                            "inserting placeholder instead",
                            layout_id=layout_id,
                            element_role=role,
                        )
                        layout_map.add_placeholder_shape(layout, element, placeholder_idx)
                        placeholder_idx += 1
                    log.warning(
                        f"Element rasterized to image: {reason}",
                        layout_id=layout_id,
                        element_role=role,
                    )
                else:
                    token_role = (
                        element.get("computed_style", {}).get("token_role", "") or ""
                    )
                    if token_role.lstrip("-") and token_role.lstrip("-") not in (
                        theme_module.THEME_SLOT_MAP.values()
                    ) and token_role not in ("--text-primary", "--text-secondary"):
                        # Non-fatal: token role isn't one we recognize for theme
                        # purposes, but element-level color still came from
                        # computed_style.color_hex, so proceed anyway (FR-009).
                        if not _is_known_token_role(token_role):
                            log.warning(
                                f"Unresolvable token_role '{token_role}'; using literal "
                                "computed color instead of a theme reference",
                                layout_id=layout_id,
                                element_role=role,
                            )
                    layout_map.add_placeholder_shape(layout, element, placeholder_idx)
                    placeholder_idx += 1
            except Exception as exc:  # noqa: BLE001 - must continue per FR-009
                log.warning(
                    f"Failed to convert element ({exc}); skipped",
                    layout_id=layout_id,
                    element_role=role,
                )

        if not frame_elements_added and layout_def.get("frame_elements"):
            _add_frame_elements_to_master(prs, layout_def["frame_elements"])
            frame_elements_added = True

    tokens = data.get("tokens")
    if tokens:
        theme_module.apply_theme(prs, tokens)

    return prs, log.entries


_KNOWN_TOKEN_ROLES = {f"--{v}" for v in theme_module.THEME_SLOT_MAP.values()} | {
    "--text-primary",
    "--text-secondary",
}


def _is_known_token_role(token_role: str) -> bool:
    return token_role in _KNOWN_TOKEN_ROLES


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Build a .potx from extracted slide layout data")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args(argv)

    log = ConversionLog()

    if not args.input.exists():
        log.error(f"Input file not found: {args.input}")
        log.write_ndjson()
        return 1

    try:
        data = json.loads(args.input.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        log.error(f"Invalid JSON in {args.input}: {exc}")
        log.write_ndjson()
        return 1

    prs, entries = build_presentation(data)
    for entry in entries:
        log.entries.append(entry)

    try:
        save_as_potx(prs, args.output)
    except Exception as exc:  # noqa: BLE001
        log.error(f"Failed to write output {args.output}: {exc}")
        log.write_ndjson()
        return 1

    log.info(f"Wrote {args.output}")
    log.write_ndjson()
    return 0


if __name__ == "__main__":
    sys.exit(main())
