const TOKEN = '7d0705583b7a02f99ff6301f12b6c3ff5c585250f13fac7205cd7e153d8ff5d2';

// Check total_count vs what we get
fetch('http://localhost:5173/trucky-api/api/v1/company/44349/jobs?limit=500&page=1', {
    headers: { 'X-ACCESS-TOKEN': TOKEN }
}).then(r => r.json()).then(d => {
    console.log('Total:', d.response?.total || d.total);
    console.log('Last page:', d.response?.last_page || d.last_page);
    console.log('Per page:', d.response?.per_page || d.per_page);
    const jobs = d.response?.data || d.data || [];
    console.log('Received:', jobs.length);
}).catch(console.error);
