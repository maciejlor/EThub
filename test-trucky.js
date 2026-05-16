const url = 'https://e.truckyapp.com/api/v1/company/44349/jobs?limit=1';
const headers = {
  'X-ACCESS-TOKEN': '7d0705583b7a02f99ff6301f12b6c3ff5c585250f13fac7205cd7e153d8ff5d2',
  'User-Agent': 'Mozilla/5.0'
};

async function test() {
  try {
    const res = await fetch(url, { headers });
    const data = await res.json();
    console.log('List data keys:', Object.keys(data));
    
    const list = data.response?.data || data.data || data.response || [];
    if (!list.length) {
      console.log('No jobs found or structure differs. Data:', JSON.stringify(data, null, 2).slice(0, 500));
      return;
    }
    const jobId = list[0].id;
    console.log('Found Job ID:', jobId);

    const detailRes = await fetch(`https://e.truckyapp.com/api/v1/job/${jobId}`, { headers });
    const detailData = await detailRes.json();
    const jobDetail = detailData.response || detailData.data || detailData;
    console.log('Job details keys:', Object.keys(jobDetail));
    console.log('Sample data:', JSON.stringify(jobDetail, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
