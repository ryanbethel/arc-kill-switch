// learn more about event functions here: https://arc.codes/primitives/events
exports.handler = async function subscribe (event) {
  console.log(JSON.stringify(event, null, 2))
  let wait = 5*1000
  await new Promise(resolve => setTimeout(resolve, wait))
  return
}
