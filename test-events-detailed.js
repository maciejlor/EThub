async function test() {
  const vtcId = 74784;
  console.log("Fetching /events...");
  const res1 = await fetch(`https://api.truckersmp.com/v2/vtc/${vtcId}/events`);
  const data1 = await res1.json();
  console.log("Events count:", data1.response?.length);
  if (data1.response?.length > 0) {
    console.log("First 3 events:");
    data1.response.slice(0, 3).forEach(e => console.log(`- ${e.name} (${e.start_at})`));
  }

  console.log("\nFetching /events/attending...");
  const res2 = await fetch(`https://api.truckersmp.com/v2/vtc/${vtcId}/events/attending`);
  const data2 = await res2.json();
  console.log("Attending count:", data2.response?.length);
  if (data2.response?.length > 0) {
    console.log("First 3 attending events:");
    data2.response.slice(0, 3).forEach(e => console.log(`- ${e.name} (${e.start_at})`));
  }
}

test();
