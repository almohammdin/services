"""Apply hash-verified source edits; leave readable sources, not a runtime patch."""
import base64
import gzip
import hashlib
import json
from pathlib import Path

script = Path(__file__).resolve()
root = script.parents[1]
parts = [script.with_name(f'ux-upgrade.{i}.txt') for i in range(5)]
packed = base64.b64decode(''.join(p.read_text(encoding='utf-8').strip() for p in parts), validate=True)
assert hashlib.sha256(packed).hexdigest() == 'a8f440cea67ef289099923c14fdd207aa32696f7d7f5adc5a7521bccd060a5fe', 'Source package hash mismatch'
updates = []
for change in json.loads(gzip.decompress(packed)):
    relative = change['path']
    assert relative.startswith(('src/', 'tests/')) or relative in ('index.html', 'vite.config.js')
    target = (root / relative).resolve()
    assert target.is_relative_to(root)
    old = target.read_text(encoding='utf-8') if target.exists() else ''
    current = hashlib.sha256(old.encode()).hexdigest() if target.exists() else None
    assert current == change['before'], f'Concurrent source change: {relative}'
    new = old
    for start, end, replacement in reversed(change['edits']):
        assert 0 <= start <= end <= len(old)
        new = new[:start] + replacement + new[end:]
    assert hashlib.sha256(new.encode()).hexdigest() == change['after'], f'Output hash mismatch: {relative}'
    updates.append((target, new))
for target, new in updates:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(new, encoding='utf-8')
# The notice contains a button, so match the container rather than exact full text.
test = root / 'tests/browser.cjs'
text = test.read_text(encoding='utf-8')
old_selector = "page.getByText('يتوفر تحديث للمنصة',{exact:true})"
assert old_selector in text
test.write_text(text.replace(old_selector, "page.locator('.update-notice')"), encoding='utf-8')
for part in parts:
    part.unlink()
script.unlink()
print(f'Applied and verified {len(updates)} source files; removed transfer package')
