import re
with open('/Users/ABGlobalCEO/.gemini/antigravity/brain/fcbcf8d0-7160-4799-9a32-3da24a5a97fc/.system_generated/steps/16452/content.md', 'r') as f:
    text = f.read()

# remove scripts and styles
text = re.sub(r'<script.*?</script>', '', text, flags=re.DOTALL)
text = re.sub(r'<style.*?</style>', '', text, flags=re.DOTALL)
# Extract all text inside tags
tags = re.findall(r'>([^<]+)<', text)
tags = [t.strip() for t in tags if t.strip()]
print("\n".join(tags[:100]))
