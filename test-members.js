async function test() {
  console.log("Fetching TruckersMP VTC Info...");
  const tmpRes = await fetch('https://api.truckersmp.com/v2/vtc/74784/members');
  const tmpData = await tmpRes.json();
  console.log("TMP Members Count:", tmpData.response?.members?.length);
  if (tmpData.response?.members?.length > 0) {
    console.log("Sample TMP member:", tmpData.response.members[0]);
  }
}

test();
