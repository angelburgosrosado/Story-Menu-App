import re

with open("Setup.tsx", "r") as f:
    content = f.read()

# Remove import
content = re.sub(r'import \{ WorkspaceCasting \} from \'\./WorkspaceCasting\';\n?', '', content)

# Remove usage
content = re.sub(r'<WorkspaceCasting />', '', content)

# Remove the reduntant Visual Cohesion area that the user pointed out
content = re.sub(r'\{/\* CHARACTER VISUAL COHESION CONTROLS.*?</div>\s*</div>\s*</div>', '', content, flags=re.DOTALL)


with open("Setup.tsx", "w") as f:
    f.write(content)
