import re

with open('AdminApp.tsx', 'r') as f:
    code = f.read()

# Let's completely wipe out all rogue blocks that I injected.
# I'll just restore from git, then carefully inject my block exactly where it needs to be.
