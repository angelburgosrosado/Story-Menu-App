import re

with open('server.ts', 'r') as f:
    code = f.read()

# E.g., `callGeminiSafely(ai, { ... })` -> `callGeminiSafely(ai, { ... }, req.body?.userEmail, req.path)`
# It's tricky to match the closing bracket of the object.
# Let's write a python function to find the matching bracket.
def patch_call_gemini(code):
    idx = 0
    while True:
        idx = code.find("await callGeminiSafely(ai, {", idx)
        if idx == -1:
            break
        
        # find the closing bracket of the object
        brace_count = 1
        pos = idx + len("await callGeminiSafely(ai, {")
        while pos < len(code) and brace_count > 0:
            if code[pos] == '{':
                brace_count += 1
            elif code[pos] == '}':
                brace_count -= 1
            pos += 1
        
        if brace_count == 0:
            # We found the closing brace for the config object
            # Now we need to see if it's already followed by a comma
            rest = code[pos:pos+20]
            if not rest.strip().startswith(','):
                # Inject arguments
                new_str = code[:pos] + ", req.body?.userEmail || req.body?.email || 'unknown', req.path" + code[pos:]
                code = new_str
        
        idx = pos
    return code

new_code = patch_call_gemini(code)
with open('server.ts', 'w') as f:
    f.write(new_code)

print("Gemini calls patched")
