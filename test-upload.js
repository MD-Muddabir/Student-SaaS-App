const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function run() {
    try {
        // Authenticate (login as admin)
        const loginPayload = { email: "admin@mod.com", password: "password123" };
        const loginRes = await axios.post("http://localhost:5000/api/auth/login", loginPayload);
        const token = loginRes.data.token;
        console.log("Logged in. Token:", token.substring(0, 20) + "...");

        // Try POST /api/admin/public-page with files
        const fd = new FormData();
        fd.append("tagline", "Test Tagline");
        fd.append("description", "Test Description");
        
        // Create dummy file
        const dummyPath = path.join(__dirname, 'dummy.jpg');
        fs.writeFileSync(dummyPath, "fake image content");
        
        fd.append("logo", fs.createReadStream(dummyPath));

        console.log("Sending POST /api/admin/public-page...");
        const res = await axios.post("http://localhost:5000/api/admin/public-page", fd, {
            headers: {
                ...fd.getHeaders(),
                "Authorization": `Bearer ${token}`
            }
        });
        console.log("Response:", res.data);
        fs.unlinkSync(dummyPath);
    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}
run();
