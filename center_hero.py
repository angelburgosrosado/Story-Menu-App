with open('Home.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'p className={`text-lg md:text-xl font-light leading-relaxed max-w-2xl',
    'p className={`text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto'
)

content = content.replace(
    'div className="flex flex-col sm:flex-row gap-4"',
    'div className="flex flex-col sm:flex-row gap-4 justify-center"'
)

with open('Home.tsx', 'w') as f:
    f.write(content)

print("Centered hero!")
