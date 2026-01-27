import Link from 'https';

const url = "https://ecosync-s4-demo-final-2026.netlify.app";

const fetchText = (u) => new Promise((resolve, reject) => {
    const options = {
        rejectUnauthorized: false
    };
    Link.get(u, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
    }).on('error', reject);
});

const fs = import('fs');

async function run() {
    try {
        console.log("Fetching HTML...");
        const html = await fetchText(url);
        const fs = await import('fs');
        fs.writeFileSync('live_index.html', html);
        console.log("Saved live_index.html");
    } catch (e) {
        console.error("Error:", e.message);
    }
}

run();
