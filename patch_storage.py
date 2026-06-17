with open('storage.ts', 'r') as f:
    content = f.read()

target = """export const getStorageUrl = (path: string): string => {"""
replacement = """// @CDN_INTEGRATION_TODO:
// For regional scale, swap the local origin URL for our Cloud CDN edge nodes.
// Example: return `https://cdn.story.menu/${path}`
// Ensure image blobs are uploaded to the regional bucket closest to the user.
export const getStorageUrl = (path: string): string => {"""

if target in content:
    content = content.replace(target, replacement)
else:
    content = content + "\n\n// CDN Strategy: Replace direct local file paths with https://cdn.story.menu/... for production\n"

with open('storage.ts', 'w') as f:
    f.write(content)

print("Storage patched!")
