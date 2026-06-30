import heic2any from 'heic2any';

export const fileToBase64 = async (file: File): Promise<string> => {
    let processFile = file;

    // Convert HEIC/HEIF to JPEG first
    if (file.type.includes('heic') || file.type.includes('heif') || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        try {
            const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
            processFile = new File(
                [Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob], 
                file.name.replace(/\.heic$|\.heif$/i, '.jpg'), 
                { type: 'image/jpeg' }
            );
        } catch (e) {
            console.warn("HEIC conversion failed:", e);
        }
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const rawBase64 = (reader.result as string).split(',')[1];
            
            if (processFile.type.includes('svg')) {
                resolve(rawBase64);
                return;
            }

            const img = new Image();
            const fallbackTimeout = setTimeout(() => resolve(rawBase64), 2000);

            img.onload = () => {
                clearTimeout(fallbackTimeout);
                try {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    // Compress as JPEG
                    const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                    resolve(resizedBase64);
                } catch (err) {
                    resolve(rawBase64);
                }
            };
            img.onerror = () => {
                clearTimeout(fallbackTimeout);
                resolve(rawBase64);
            };
            img.src = reader.result as string;
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(processFile);
    });
};
