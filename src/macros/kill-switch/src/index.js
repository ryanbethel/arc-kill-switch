let { CostExplorerClient, GetCostAndUsageCommand, GetCostCategoriesCommand } = require('@aws-sdk/client-cost-explorer')
let { LambdaClient, PutFunctionConcurrencyCommand } = require('@aws-sdk/client-lambda')
let { ResourceGroupsTaggingAPIClient, GetResourcesCommand } = require('@aws-sdk/client-resource-groups-tagging-api')
let { format, startOfMonth } = require('date-fns')

let costLimit = process.env.KILL_SWITCH_LIMIT
let costCategory = process.env.COST_CATEGORY
let stackName = process.env.ARC_CLOUDFORMATION
let costLambda = process.env.COST_LAMBDA
let costConfig = {}
let firstDay = format(startOfMonth(Date.now()), 'yyyy-MM-dd')
let today = format(Date.now(), 'yyyy-MM-dd')
console.log({ firstDay, today })
let costInput = {
  Granularity: 'MONTHLY',
  Filter: {
    Tags: { 'Key': 'aws:cloudformation:stack-name', 'Values': [ stackName ] }
  },
  Metrics: [ 'AmortizedCost', 'BlendedCost' ],
  TimePeriod: {
    Start: firstDay,
    End: today,
  }
}

let resourceConfig = { region: 'us-east-1' }
let resourceInput = { 'ResourceTypeFilters': [ 'lambda' ], 'TagFilters': [ { 'Key': 'aws:cloudformation:stack-name', 'Values': [ stackName ] } ] }

let resourceClient = new ResourceGroupsTaggingAPIClient(resourceConfig)
let resourceCommand = new GetResourcesCommand(resourceInput)

let lambdaClient = new LambdaClient({ region: 'us-east-1' })

let costClient = new CostExplorerClient(costConfig)
let costCommand = new GetCostAndUsageCommand(costInput)

exports.handler =  async function handler (event) {


  let costResponse  = await costClient.send(costCommand)
  let cost = costResponse.ResultsByTime[0].Total.BlendedCost.Amount
  console.log(costResponse.ResultsByTime[0].Total.BlendedCost.Amount)

  if (cost > 0){
  // if (cost > costLimit){

    let resourceResponse = await resourceClient.send(resourceCommand)
    let lambdas = resourceResponse.ResourceTagMappingList
    let lambdaFiltered = lambdas.filter(func => !func.ResourceARN.includes(stackName + '_' + costLambda)).map(func => func.ResourceArn)
    let lambdaCommands = await Promise.all(lambdaFiltered.map(lambda => {
      let lambdaCommand = new PutFunctionConcurrencyCommand({ FunctionName: lambda, ReservedConcurrentExecutions: 0 })
      return  lambdaClient.send(lambdaCommand)
    }))
    console.log(lambdaCommands)
    console.log(lambdas)
    console.log(lambdaFiltered)
  }
  console.log(costResponse)
  return
}

