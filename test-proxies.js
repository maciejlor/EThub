async function test() {
  const target = 'https://api.truckersmp.com/v2/vtc/74784/events';
  try {
    const res = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent(target));
    const json = await res.json();
    const contents = json.contents || '';
    console.log('Allorigins /get:', res.status);
    console.log('Contents start:', contents.slice(0, 200));
    if (contents.includes('<!DOCTYPE html') || contents.includes('Just a moment')) {
      console.log('Result: blocked by Cloudflare');
    } else {
      try {
        const parsed = JSON.parse(contents);
        console.log('SUCCESS! Response length:', parsed.response?.length);
      } catch (e) {
        console.log('Failed to parse inner JSON');
      }
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}
test();
