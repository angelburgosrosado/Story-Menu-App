with open('Setup.tsx', 'r') as f:
    content = f.read()

start_marker = "{(!isCyberpunk && activeTab === 'library') && ("
idx_start = content.find(start_marker)
if idx_start == -1:
    print("Not found")
else:
    # Just grab the block until the next marker
    idx_end = content.find("        {(activeTab === 'vault') && (", idx_start)
    if idx_end != -1:
        block = content[idx_start:idx_end]
        print(f"Block found, length {len(block)}")
        with open('library_block.txt', 'w') as out:
            out.write(block)
