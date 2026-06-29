import re

with open('Setup.tsx', 'r') as f:
    content = f.read()

return_index = content.find("    return (\n")
if return_index == -1:
    return_index = content.find("    return (")

print(content[return_index:return_index+1000])

