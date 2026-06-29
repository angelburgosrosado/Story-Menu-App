import re

with open('Setup.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "return (" in line:
        for j in range(i, min(i+100, len(lines))):
            print(f"{j}: {lines[j].strip()}")
        break
