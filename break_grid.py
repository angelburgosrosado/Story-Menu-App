with open('Home.tsx', 'r') as f:
    content = f.read()

# We need to change:
#                     {/* Hero grid layout */}
#                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
#                         
#                         {/* Left Column: Heading & Value Prop */}
#                         <div className="lg:col-span-7 space-y-8 text-left">
#
# To a flex column layout:

target = """                    {/* Hero grid layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        
                        {/* Left Column: Heading & Value Prop */}
                        <div className="lg:col-span-7 space-y-8 text-left">"""

replacement = """                    {/* Hero layout: Stacked for full-screen Interactive Simulator */}
                    <div className="flex flex-col gap-12">
                        
                        {/* Top Area: Heading & Value Prop */}
                        <div className="w-full space-y-8 text-center max-w-4xl mx-auto">"""

content = content.replace(target, replacement)


# Replace the transition for Right Column
target2 = """                        {/* Right Column: Interactive Simulator */}
                        <div className="lg:col-span-5">"""

replacement2 = """                        {/* Bottom Area: Interactive Simulator (Full Width) */}
                        <div className="w-full">"""

content = content.replace(target2, replacement2)

with open('Home.tsx', 'w') as f:
    f.write(content)

print("Grid broken out!")
