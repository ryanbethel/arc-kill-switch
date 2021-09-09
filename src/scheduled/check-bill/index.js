const aws = require('aws-sdk')
const begin = require('@begin/data')
const 

async function checkBill ({ costCategory }){
}
async function pauseLambdas ({ stackID }){
}

exports.handler = async function scheduled (event) {
  console.log(JSON.stringify(event, null, 2))
  let costLimit = 10 // Dollar limit, will be passed by macro
  let killSwitch = begin.get({ key: 'kill-switch' })
  if (!killSwitch)  killSwitch =  finitKillSwitch()

  const cost = checkBill()

  if (cost >= costLimit) {
    pauseLambdas()
  }


  return
}
