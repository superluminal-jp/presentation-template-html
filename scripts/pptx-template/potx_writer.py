"""Save a fully-built python-pptx Presentation as a .potx (PowerPoint template).

python-pptx's `Presentation()` loader only accepts the ordinary "presentation"
content type and hard-rejects "template" content types (see research.md #3),
so a .potx cannot be opened, edited, and re-saved with python-pptx directly.
Instead, all editing happens on a normal in-memory Presentation; only this
final save step rewrites the OOXML package's content-type declaration so
PowerPoint recognizes the result as a template.
"""

import shutil
import tempfile
import zipfile
from pathlib import Path

PRESENTATION_PART_NAME = "/ppt/presentation.xml"
PRESENTATION_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"
)
TEMPLATE_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml"
)


def save_as_potx(prs, output_path) -> None:
    """Save *prs* (a python-pptx Presentation) to *output_path* as a .potx.

    Raises ValueError if the expected presentation content-type override is
    not found in the package's [Content_Types].xml (e.g. python-pptx internals
    changed in a way this rewrite no longer matches).
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_pptx = Path(tmp_dir) / "_build.pptx"
        prs.save(str(tmp_pptx))

        with zipfile.ZipFile(tmp_pptx, "r") as zin:
            content_types = zin.read("[Content_Types].xml").decode("utf-8")
            override = f'PartName="{PRESENTATION_PART_NAME}" ContentType="{PRESENTATION_CONTENT_TYPE}"'
            if override not in content_types:
                raise ValueError(
                    f"Expected content-type override for {PRESENTATION_PART_NAME} "
                    "not found in [Content_Types].xml; cannot safely convert to .potx"
                )
            patched = content_types.replace(
                PRESENTATION_CONTENT_TYPE, TEMPLATE_CONTENT_TYPE
            )

            if output_path.exists():
                output_path.unlink()

            with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zout:
                for item in zin.infolist():
                    data = zin.read(item.filename)
                    if item.filename == "[Content_Types].xml":
                        data = patched.encode("utf-8")
                    zout.writestr(item, data)
