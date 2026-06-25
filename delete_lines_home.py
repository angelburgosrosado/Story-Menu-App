def remove_lines(filename, ranges):
    with open(filename, 'r') as f:
        lines = f.readlines()
        
    lines_to_keep = []
    for i, line in enumerate(lines, 1):
        keep = True
        for start, end in ranges:
            if start <= i <= end:
                keep = False
                break
        if keep:
            lines_to_keep.append(line)
            
    with open(filename, 'w') as f:
        f.writelines(lines_to_keep)

remove_lines('Home.tsx', [(34, 114), (407, 543)])
print("Home.tsx lines deleted")
