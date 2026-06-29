with open('Setup.tsx', 'r') as f:
    content = f.read()

return_index = content.find("    return (\n        <>\n")

if return_index != -1:
    subcontent = content[return_index:]
    div_open = subcontent.count("<div")
    div_close = subcontent.count("</div")
    print(f"Open: {div_open}, Close: {div_close}")
