with open('Setup.tsx', 'r') as f:
    content = f.read()

start_marker = "{(isCyberpunk || activeTab === 'blueprint') && ("
idx_start = content.find(start_marker)

end_marker = "{(!isCyberpunk && activeTab === 'library') && ("
idx_end = content.find(end_marker, idx_start)

if idx_start != -1 and idx_end != -1:
    idx_end = content.rfind("\n", idx_start, idx_end)
    block = content[idx_start:idx_end]
    print(f"Block found, length {len(block)}")
    with open('director_block.txt', 'w') as out:
        out.write(block)
else:
    print("Block not found")
