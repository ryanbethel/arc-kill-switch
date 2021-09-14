// learn more about scheduled functions here: https://arc.codes/primitives/scheduled
exports.handler = async function scheduled (event) {
  console.log(JSON.stringify(event, null, 2))
  let wait = 5*1000
  await new Promise(resolve => setTimeout(resolve, wait))
  return
}
