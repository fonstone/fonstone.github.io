import re
from pathlib import Path

TARGET_DIR = Path(r"D:\00 Work\fonstone\fonstone.github.io\projects\rust-os")

def fix_mermaid_syntax(content):
    """Convert <MermaidDiagram>children</MermaidDiagram> to <MermaidDiagram chart={`...`} />"""
    def replace_mermaid(match):
        chart_content = match.group(1).strip()
        return f"<MermaidDiagram chart={{`\n{chart_content}\n`}} />"
    
    pattern = r'<MermaidDiagram>\s*\n(.*?)\n\s*</MermaidDiagram>'
    return re.sub(pattern, replace_mermaid, content, flags=re.DOTALL)


def escape_braces(content):
    """Escape ASCII { } outside code fences to prevent MDX JSX interpretation."""
    lines = content.split("\n")
    result = []
    in_code = False
    in_yaml = False
    
    for line in lines:
        # Track YAML frontmatter
        if line.strip() == "---":
            if "---" not in "".join(result[:3]):  # Still in first YAML block
                in_yaml = not in_yaml
                result.append(line)
                continue
        
        # Track code fences
        if line.startswith("```"):
            in_code = not in_code
            result.append(line)
            continue
        
        if in_code or in_yaml:
            result.append(line)
            continue
        
        # In the mermaid chart templates, braces inside `backtick` are safe
        # Only escape braces in regular text
        # Replace ASCII { with &#123; and } with &#125;
        # But be careful not to break existing JSX expressions like {'{'}
        if "{'" not in line and "'}" not in line:
            # Check if this line has potential MDX-interpreted braces
            # Simple heuristic: if the line has { followed by word chars and }
            modified = line
            # Replace patterns like {PC, CPSR}, {variable}, etc.
            modified = re.sub(r'\{([A-Za-z_][A-Za-z0-9_, ]*)\}', '&#123;\\1&#125;', modified)
            # Replace PUSH/POP brace patterns
            modified = modified.replace("PUSH {R0-R12, LR}", "PUSH &#123;R0-R12, LR&#125;")
            modified = modified.replace("POP {R0-R12, LR}", "POP &#123;R0-R12, LR&#125;")
            modified = modified.replace("push {r0-r12, lr}", "push &#123;r0-r12, lr&#125;")
            modified = modified.replace("pop {r0-r12, lr}", "pop &#123;r0-r12, lr&#125;")
            modified = modified.replace("{r0-r12}", "&#123;r0-r12&#125;")
            modified = modified.replace("{ ... }", "&#123; ... &#125;")
            result.append(modified)
        else:
            result.append(line)
    
    return "\n".join(result)


# Process all .md files
for fpath in sorted(TARGET_DIR.glob("*.md")):
    raw = fpath.read_text(encoding="utf-8")
    
    # Step 1: Fix mermaid syntax
    fixed = fix_mermaid_syntax(raw)
    
    # Step 2: Escape braces for MDX
    fixed = escape_braces(fixed)
    
    # Write as .mdx
    new_name = fpath.stem + ".mdx"
    new_path = fpath.parent / new_name
    new_path.write_text(fixed, encoding="utf-8")
    
    # Remove old .md file
    fpath.unlink()
    print(f"  OK: {fpath.name} -> {new_name}")

print("\nDone!")
