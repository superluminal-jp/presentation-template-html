"""NDJSON conversion log per contracts/cli-interface.md and data-model.md LogEntry."""

import json
import sys


class ConversionLog:
    """Collects LogEntry dicts and can flush them as NDJSON to a stream."""

    def __init__(self):
        self.entries = []

    def info(self, message, layout_id=None, element_role=None):
        self._add("INFO", message, layout_id, element_role)

    def warning(self, message, layout_id=None, element_role=None):
        self._add("WARNING", message, layout_id, element_role)

    def error(self, message, layout_id=None, element_role=None):
        self._add("ERROR", message, layout_id, element_role)

    def _add(self, level, message, layout_id, element_role):
        self.entries.append(
            {
                "level": level,
                "layout_id": layout_id,
                "element_role": element_role,
                "message": message,
            }
        )

    def write_ndjson(self, stream=None):
        stream = stream or sys.stdout
        for entry in self.entries:
            stream.write(json.dumps(entry, ensure_ascii=False) + "\n")
