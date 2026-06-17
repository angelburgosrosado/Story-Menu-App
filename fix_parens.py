with open('Home.tsx', 'r') as f:
    lines = f.readlines()

# Find the missing parenthesis and closing bracket for {sandboxMode === 'arena' && (
# It starts at:
#                             {sandboxMode === 'arena' && (
#                             <div className={`rounded-3xl p-6 border shadow-2xl relative transition-all ${
# and we need to close it. Let's look for the matching </div>

with open('Home.tsx', 'r') as f:
    content = f.read()

target = """                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>"""

replacement = """                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            )}"""

content = content.replace(target, replacement)
with open('Home.tsx', 'w') as f:
    f.write(content)

print("Fixed parens!")
