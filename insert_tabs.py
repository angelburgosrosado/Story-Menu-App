with open("missing_tabs.tsx", "r") as f:
    missing_tabs = f.read()

with open("AdminApp.tsx", "r") as f:
    code = f.read()

# Current file has: {activeTab === "ai_sandbox"
# But Prettier formatted it, so we should search for `{activeTab === "ai_sandbox" && (`
target_str = '{activeTab === "ai_sandbox" && ('
if target_str in code:
    print("Found target string.")
    code = code.replace(target_str, missing_tabs + "\n" + target_str)
    with open("AdminApp.tsx", "w") as f:
        f.write(code)
    print("Inserted tabs.")
else:
    print("Target string not found!")

