with open('Setup.tsx', 'r') as f:
    content = f.read()

start_marker = "{(isCyberpunk || activeTab === 'persona') && ("
idx_start = content.find(start_marker)
if idx_start == -1:
    print("Not found")
else:
    # Just grab the block until the next marker
    idx_end = content.find("{(isCyberpunk || activeTab === 'blueprint') && (", idx_start)
    if idx_end != -1:
        # Step back a bit to the indentation
        idx_end = content.rfind("\n", idx_start, idx_end)
        block = content[idx_start:idx_end]
        print(f"Block found, length {len(block)}")
        with open('casting_block.txt', 'w') as out:
            out.write(block)
    else:
        print("End marker not found")
