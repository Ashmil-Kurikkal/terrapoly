import re

with open('src/game/data/tiles.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Match prop: "<emoji> <text>" -> prop: "<text>"
# Emojis are generally non-ascii characters before the first space after the quote
content = re.sub(r'prop:\s*"[^\x00-\x7F]+\s+(.*?)"', r'prop: "\1"', content)

with open('src/game/data/tiles.ts', 'w', encoding='utf-8') as f:
    f.write(content)
