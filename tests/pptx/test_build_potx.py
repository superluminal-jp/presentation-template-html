import zipfile
from lxml import etree

import build_potx
from potx_writer import save_as_potx

A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"


def _qn(ns, local):
    return f"{{{ns}}}{local}"


def _build_and_save(data, output_path):
    prs, log_entries = build_potx.build_presentation(data)
    save_as_potx(prs, output_path)
    return prs, log_entries


# --- User Story 1 ------------------------------------------------------


def test_build_generates_slide_layouts_for_each_fixture_entry(sample_layout_data, output_potx_path):
    _build_and_save(sample_layout_data, output_potx_path)
    with zipfile.ZipFile(output_potx_path) as z:
        layout_parts = [n for n in z.namelist() if n.startswith("ppt/slideLayouts/slideLayout") and n.endswith(".xml")]
    # 11 stock Office layouts + 1 per fixture entry (2 in the sample fixture).
    assert len(layout_parts) == 11 + len(sample_layout_data["layouts"])


def test_layout_names_match_fixture(sample_layout_data, output_potx_path):
    prs, _ = build_potx.build_presentation(sample_layout_data)
    names = {layout.name for layout in prs.slide_masters[0].slide_layouts}
    for layout_def in sample_layout_data["layouts"]:
        assert layout_def["layout_name_ja"] in names


def test_placeholders_are_editable_not_baked_images(sample_layout_data):
    prs, _ = build_potx.build_presentation(sample_layout_data)
    title_layout = next(
        layout
        for layout in prs.slide_masters[0].slide_layouts
        if layout.name == "表紙"
    )
    placeholder_shapes = [shape for shape in title_layout.shapes if shape.is_placeholder]
    assert len(placeholder_shapes) >= 2  # title + subtitle (+ meta as body)
    pic_shapes = [shape for shape in title_layout.shapes if shape.shape_type == 13]  # MSO_SHAPE_TYPE.PICTURE
    assert len(pic_shapes) == 0


def test_slide_size_is_widescreen(sample_layout_data):
    prs, _ = build_potx.build_presentation(sample_layout_data)
    assert prs.slide_width == build_potx.layout_map.SLIDE_WIDTH_EMU
    assert prs.slide_height == build_potx.layout_map.SLIDE_HEIGHT_EMU


def test_custom_slide_layouts_relate_back_to_master(sample_layout_data):
    """Every custom slideLayout part must carry an explicit relationship back
    to its slideMaster (ECMA-376), or PowerPoint treats the package as
    corrupt. python-pptx's SlideLayout.slide_master looks this relationship
    up directly, so resolving it without error is the regression guard."""
    prs, _ = build_potx.build_presentation(sample_layout_data)
    master = prs.slide_masters[0]
    for layout in master.slide_layouts:
        assert layout.slide_master is master


def test_placeholder_text_is_prompt_not_baked_in(sample_layout_data):
    prs, _ = build_potx.build_presentation(sample_layout_data)
    title_layout = next(
        layout for layout in prs.slide_masters[0].slide_layouts if layout.name == "表紙"
    )
    for shape in title_layout.shapes:
        if shape.is_placeholder and shape.has_text_frame:
            assert shape.text_frame.text == ""


# --- User Story 2 -------------------------------------------------------


def test_theme_color_slots_match_ds_tokens(sample_layout_data, output_potx_path):
    _build_and_save(sample_layout_data, output_potx_path)
    with zipfile.ZipFile(output_potx_path) as z:
        theme_xml = z.read("ppt/theme/theme1.xml")
    root = etree.fromstring(theme_xml)
    clr_scheme = root.find(f".//{_qn(A_NS, 'clrScheme')}")

    expected = {
        "dk1": "333333",
        "lt1": "FFFFFF",
        "dk2": "666666",
        "lt2": "F5F5F5",
        "accent1": "0031D8",
        "accent2": "001E8A",
        "accent3": "E6EBFB",
        "accent4": "0A8A3C",
        "accent5": "D32F2F",
        "accent6": "ED6C02",
    }
    for slot, hex_val in expected.items():
        el = clr_scheme.find(_qn(A_NS, slot))
        srgb = el.find(_qn(A_NS, "srgbClr"))
        assert srgb is not None, f"{slot} should be an explicit srgbClr after override"
        assert srgb.get("val") == hex_val


def test_user_drawn_shape_inherits_theme_defaults(sample_layout_data):
    from pptx.enum.shapes import MSO_SHAPE
    from pptx.util import Emu

    prs, _ = build_potx.build_presentation(sample_layout_data)
    slide = prs.slides.add_slide(prs.slide_masters[0].slide_layouts[0])
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Emu(0), Emu(0), Emu(100), Emu(100))

    style = shape._element.find(f".//{_qn(P_NS, 'style')}")
    fill_ref = style.find(f"{_qn(A_NS, 'fillRef')}/{_qn(A_NS, 'schemeClr')}")
    assert fill_ref.get("val") == "accent1"

    theme_part = prs.slide_masters[0].part.part_related_by(
        __import__("pptx.opc.constants", fromlist=["RELATIONSHIP_TYPE"]).RELATIONSHIP_TYPE.THEME
    )
    theme_root = etree.fromstring(theme_part.blob)
    accent1 = theme_root.find(f".//{_qn(A_NS, 'clrScheme')}/{_qn(A_NS, 'accent1')}/{_qn(A_NS, 'srgbClr')}")
    assert accent1.get("val") == "0031D8"


def test_theme_fonts_are_noto_sans_jp(sample_layout_data, output_potx_path):
    _build_and_save(sample_layout_data, output_potx_path)
    with zipfile.ZipFile(output_potx_path) as z:
        theme_xml = z.read("ppt/theme/theme1.xml")
    root = etree.fromstring(theme_xml)
    for font_group in ("majorFont", "minorFont"):
        latin = root.find(f".//{_qn(A_NS, font_group)}/{_qn(A_NS, 'latin')}")
        assert latin.get("typeface") == "Noto Sans JP"


# --- User Story 3 -------------------------------------------------------


def test_fallback_element_becomes_picture_and_logs_warning(sample_layout_data):
    prs, log_entries = build_potx.build_presentation(sample_layout_data)
    dashboard_layout = next(
        layout
        for layout in prs.slide_masters[0].slide_layouts
        if layout.name == "ダッシュボード"
    )
    pic_shapes = [shape for shape in dashboard_layout.shapes if shape.shape_type == 13]
    assert len(pic_shapes) == 1

    warnings = [e for e in log_entries if e["level"] == "WARNING"]
    assert any(
        e["layout_id"] == "10-dashboard" and e["element_role"] == "chart"
        for e in warnings
    )


def test_unresolvable_token_role_logs_warning_and_continues(sample_layout_data):
    import copy

    broken = copy.deepcopy(sample_layout_data)
    broken["layouts"][0]["elements"][0]["computed_style"]["token_role"] = "--unknown-role"
    # Should not raise.
    prs, log_entries = build_potx.build_presentation(broken)
    assert prs is not None
    warnings = [e for e in log_entries if e["level"] == "WARNING"]
    assert any("unknown-role" in e["message"] or "token" in e["message"].lower() for e in warnings)


# --- Accessibility (FR-014 / FR-015) ------------------------------------


def test_image_placeholders_have_alt_text_hint(sample_layout_data):
    prs, _ = build_potx.build_presentation(sample_layout_data)
    dashboard_layout = next(
        layout
        for layout in prs.slide_masters[0].slide_layouts
        if layout.name == "ダッシュボード"
    )
    pic_shapes = [shape for shape in dashboard_layout.shapes if shape.shape_type == 13]
    assert len(pic_shapes) == 1
    cnv_pr = pic_shapes[0]._element.find(f".//{_qn(P_NS, 'cNvPr')}")
    assert cnv_pr.get("descr")


def test_reading_order_title_before_subtitle_before_meta(sample_layout_data):
    prs, _ = build_potx.build_presentation(sample_layout_data)
    title_layout = next(
        layout for layout in prs.slide_masters[0].slide_layouts if layout.name == "表紙"
    )
    ordered_names = [
        shape.name for shape in title_layout.shapes if shape.is_placeholder
    ]
    # Fixture reading_order_index: title=0, subtitle=1, meta=2
    assert len(ordered_names) == 3
