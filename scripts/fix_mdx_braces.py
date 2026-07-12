import re
from pathlib import Path

TARGET_DIR = Path(r"D:\00 Work\fonstone\fonstone.github.io\projects\rust-os")

def escape_braces(content):
    """Escape ASCII braces outside code fences and YAML frontmatter."""
    lines = content.split("\n")
    result = []
    in_code = False
    pass_count = 0  # count --- separators
    
    for line in lines:
        # Track YAML frontmatter (first two "---" delimit the frontmatter)
        stripped = line.strip()
        if stripped == "---":
            pass_count += 1
        
        in_yaml = (pass_count == 1)
        
        # Track code fences
        if stripped.startswith("```"):
            in_code = not in_code
        
        if in_code or in_yaml:
            result.append(line)
            continue
        
        # Escape braces in regular text
        modified = line
        
        # Replace {variable} patterns in assembly comments
        modified = modified.replace("{PC, CPSR}", "&#123;PC, CPSR&#125;")
        modified = modified.replace("{lr_fiq, spsr_fiq}", "&#123;lr_fiq, spsr_fiq&#125;")
        modified = modified.replace("{CPSR, PC}", "&#123;CPSR, PC&#125;")
        
        # Replace PUSH/POP brace patterns
        modified = modified.replace("PUSH {R0-R12, LR}", "PUSH &#123;R0-R12, LR&#125;")
        modified = modified.replace("POP {R0-R12, LR}", "POP &#123;R0-R12, LR&#125;")
        modified = modified.replace("push {r0-r12, lr}", "push &#123;r0-r12, lr&#125;")
        modified = modified.replace("pop {r0-r12, lr}", "pop &#123;r0-r12, lr&#125;")
        modified = modified.replace("{r0-r12}", "&#123;r0-r12&#125;")
        modified = modified.replace("{ ... }", "&#123; ... &#125;")
        modified = modified.replace("{PC, CPSR, SP}", "&#123;PC, CPSR, SP&#125;")
        modified = modified.replace("{r4-r11, lr}", "&#123;r4-r11, lr&#125;")
        modified = modified.replace("stmia sp, {r0-r12}", "stmia sp, &#123;r0-r12&#125;")
        modified = modified.replace("stmia sp, {r0}", "stmia sp, &#123;r0&#125;")
        modified = modified.replace("pop {r4-r11, pc}", "pop &#123;r4-r11, pc&#125;")
        
        result.append(modified)
    
    return "\n".join(result)


# Re-process all .md files (but they were already deleted, so process .mdx directly)
for fpath in sorted(TARGET_DIR.glob("*.mdx")):
    raw = fpath.read_text(encoding="utf-8")
    
    # Escape braces for MDX
    escaped = escape_braces(raw)
    
    if escaped != raw:
        fpath.write_text(escaped, encoding="utf-8")
        print(f"  Escaped: {fpath.name}")
    else:
        print(f"  No change: {fpath.name}")

print("\nDone!")
