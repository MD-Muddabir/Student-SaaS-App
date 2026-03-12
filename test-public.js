const axios = require('axios');

async function check() {
    try {
        const res = await axios.get("http://localhost:5000/api/public/globus-academy");
        console.log("SUCCESS:", JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error("ERROR:", e.response ? e.response.data : e.message);
    }
}
check();
