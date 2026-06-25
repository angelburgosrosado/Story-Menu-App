import sys

with open('Setup.tsx', 'r') as f:
    content = f.read()

start_marker = "{(!props.activeCreator.tier || props.activeCreator.tier === 'Free') ? ("

start_idx = content.find(start_marker)
end_idx = content.find("                  )}", start_idx) + len("                  )}")

chunk = content[start_idx:end_idx]

locked_block_end = chunk.find(") : (")
locked_block = chunk[:locked_block_end + 5]

unlocked_block = chunk[locked_block_end + 5:]

gallery_start = unlocked_block.find("{/* VAULT GALLERY SECTION */}")

generator_block = unlocked_block[:gallery_start]
gallery_block = unlocked_block[gallery_start:-21]

new_chunk = f'''<div className="flex flex-col gap-12 mt-6">
    {locked_block}
        {generator_block}
    {"}"})

    {gallery_block}
</div>
                  {"}"})'''

new_content = content[:start_idx] + new_chunk + content[end_idx:]

with open('Setup.tsx', 'w') as f:
    f.write(new_content)

print("Setup.tsx permissions patched")
