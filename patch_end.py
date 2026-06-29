with open('Setup.tsx', 'r') as f:
    content = f.read()

end_block = """            </div>
          </div>
        </div>


        </>
    );
}"""
new_end_block = """            </div>
          </div>
        </div>
        </div>


        </>
    );
}"""

if end_block in content:
    content = content.replace(end_block, new_end_block)
    with open('Setup.tsx', 'w') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Not found")
