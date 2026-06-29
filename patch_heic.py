import re

def update_file(filename, handle_func_regex, new_handle_func):
    with open(filename, 'r') as f:
        code = f.read()

    # Add import
    if 'heic2any' not in code:
        code = "import heic2any from 'heic2any';\n" + code

    # Update accept attributes
    code = code.replace('accept="image/*"', 'accept="image/*,.heic,.heif"')

    # Replace handleImageUpload function
    code = re.sub(handle_func_regex, new_handle_func, code, flags=re.DOTALL)

    with open(filename, 'w') as f:
        f.write(code)

# For AdminApp.tsx
admin_app_regex = r"const handleImageUpload = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{.*?\};\n"
admin_app_new = """const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    const processFile = async (f: File): Promise<string> => {
        let fileToRead = f;
        if (f.name.toLowerCase().endsWith('.heic') || f.name.toLowerCase().endsWith('.heif')) {
            try {
                const converted = await heic2any({ blob: f, toType: 'image/jpeg' });
                fileToRead = Array.isArray(converted) ? converted[0] : converted as Blob as File;
            } catch (err) {
                console.error("HEIC conversion error", err);
            }
        }
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(fileToRead);
        });
    };

    const base64s = await Promise.all(files.map(processFile));
    setNewGlobalChar(prev => ({...prev, referenceImages: [...prev.referenceImages, ...base64s]}));
  };
"""

# For AdminPromptSandbox.tsx
sandbox_regex = r"const handleImageUpload = \(e: React\.ChangeEvent<HTMLInputElement>, setter: \(b64: string\) => void\) => \{.*?\};\n"
sandbox_new = """const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (b64: string) => void) => {
        let file = e.target.files?.[0];
        if (!file) return;
        
        if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
            try {
                const converted = await heic2any({ blob: file, toType: 'image/jpeg' });
                file = (Array.isArray(converted) ? converted[0] : converted) as File;
            } catch (err) {
                console.error("HEIC conversion error", err);
            }
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            const base64 = result.split(',')[1];
            setter(base64);
        };
        reader.readAsDataURL(file);
    };
"""

update_file('AdminApp.tsx', admin_app_regex, admin_app_new)
update_file('AdminPromptSandbox.tsx', sandbox_regex, sandbox_new)

print("HEIC support added successfully.")
