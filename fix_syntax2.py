import re

with open('AdminApp.tsx', 'r') as f:
    code = f.read()

# Replace the specific syntax
old_code = """                                    </div>
                                )}
                            </div>
                    )}"""

new_code = """                                    </div>
                                )}
                            </div>
                        </div>
                    )}"""

code = code.replace(old_code, new_code)

with open('AdminApp.tsx', 'w') as f:
    f.write(code)

print("Fixed syntax 2")
