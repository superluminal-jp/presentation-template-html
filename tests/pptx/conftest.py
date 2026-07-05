import json
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
PPTX_TEMPLATE_DIR = REPO_ROOT / "scripts" / "pptx-template"
FIXTURES_DIR = Path(__file__).parent / "fixtures"

sys.path.insert(0, str(PPTX_TEMPLATE_DIR))


@pytest.fixture
def sample_layout_data() -> dict:
    with open(FIXTURES_DIR / "slide-layout-data.sample.json", encoding="utf-8") as f:
        data = json.load(f)
    # Fixture stores image_path relative to REPO_ROOT; resolve to absolute so
    # tests behave the same regardless of pytest's invocation directory.
    for layout in data.get("layouts", []):
        for element in layout.get("elements", []):
            fallback = element.get("fallback") or {}
            if fallback.get("image_path"):
                fallback["image_path"] = str(REPO_ROOT / fallback["image_path"])
    return data


@pytest.fixture
def output_potx_path(tmp_path) -> Path:
    return tmp_path / "output.potx"
