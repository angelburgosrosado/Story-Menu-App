import re
import sys

def translate_file(filepath, namespace):
    with open(filepath, 'r') as f:
        content = f.read()

    lines = content.split('\n')
    new_lines = []
    counter = 1
    
    for i, line in enumerate(lines):
        if 't(' in line: 
            new_lines.append(line)
            continue
            
        def repl(m):
            nonlocal counter
            text = m.group(1).strip()
            if not re.search('[a-zA-Z]', text):
                return m.group(0)
            if '{' in text or '}' in text:
                return m.group(0)
            if 'http' in text or text.startswith('//'):
                return m.group(0)
                
            safe_text = text.replace("'", "\\'")
            key = f"{namespace}.auto{counter}"
            counter += 1
            
            replacement = "{t('" + key + "', '" + safe_text + "')}"
            return ">" + m.group(0)[1:-1].replace(text, replacement) + "<"
            
        new_line = re.sub(r'>([^<]+)<', repl, line)
        new_lines.append(new_line)
        
    with open(filepath, 'w') as f:
        f.write('\n'.join(new_lines))

translate_file(sys.argv[1], sys.argv[2])
