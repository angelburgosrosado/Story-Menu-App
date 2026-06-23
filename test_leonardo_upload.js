const apiKey = process.env.LEONARDO_API_KEY;
if (!apiKey) {
    console.error("Missing LEONARDO_API_KEY in .env");
    process.exit(1);
}

async function testUpload() {
    try {
        console.log("1. Requesting init-image...");
        const initRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/init-image", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ extension: "jpg" })
        });
        
        if (!initRes.ok) {
            console.error("Failed to get init-image:", await initRes.text());
            return;
        }
        
        const initData = await initRes.json();
        console.log("Init response:", JSON.stringify(initData, null, 2));
        
        const uploadDetails = initData.uploadInitImage;
        if (!uploadDetails || !uploadDetails.url) {
            console.error("No upload details found");
            return;
        }

        // Generate a dummy 1x1 black pixel base64 image
        const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
        const buffer = Buffer.from(b64, 'base64');
        
        console.log("2. Uploading to S3...");
        
        // Let's try fields approach if they exist, otherwise PUT
        let uploadRes;
        if (uploadDetails.fields) {
            const formData = new FormData();
            const fieldsObj = JSON.parse(uploadDetails.fields);
            for (const [key, value] of Object.entries(fieldsObj)) {
                formData.append(key, value);
            }
            // Add file
            const blob = new Blob([buffer], { type: 'image/jpeg' });
            formData.append('file', blob, "image.jpg");
            
            uploadRes = await fetch(uploadDetails.url, {
                method: "POST",
                body: formData
            });
        } else {
            // direct PUT
            uploadRes = await fetch(uploadDetails.url, {
                method: "PUT",
                headers: {
                    "Content-Type": "image/jpeg"
                },
                body: buffer
            });
        }
        
        if (!uploadRes.ok) {
            console.error("Failed to upload image:", await uploadRes.text());
            return;
        }
        console.log("Upload successful! ID:", uploadDetails.id);
        
    } catch(e) {
        console.error("Error:", e);
    }
}

testUpload();
