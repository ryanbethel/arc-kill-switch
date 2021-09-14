let { LambdaClient, PutFunctionConcurrencyCommand } = require('@aws-sdk/client-lambda')
let { ResourceGroupsTaggingAPIClient, GetResourcesCommand } = require('@aws-sdk/client-resource-groups-tagging-api')

let stackName = process.env.ARC_CLOUDFORMATION
let costLambda = process.env.COST_LAMBDA

let resourceInput = { 'ResourceTypeFilters': [ 'lambda' ], 'TagFilters': [ { 'Key': 'aws:cloudformation:stack-name', 'Values': [ stackName ] } ] }
let resourceClient = new ResourceGroupsTaggingAPIClient({ region: 'us-east-1' })
let resourceCommand = new GetResourcesCommand(resourceInput)

let lambdaClient = new LambdaClient({ region: 'us-east-1' })

exports.handler =  async function handler (event) {
  console.log(event)

  let resourceResponse, allLambdas, lambdasFiltered, lambdaCommands
  try {
    resourceResponse = await resourceClient.send(resourceCommand)
    console.log(resourceResponse)
    allLambdas = resourceResponse.ResourceTagMappingList
    console.log(allLambdas)
    lambdasFiltered = allLambdas.filter(lambda => !lambda.ResourceARN.includes(`${stackName}-${costLambda}`)).map(lambda => lambda.ResourceARN)
    console.log(lambdasFiltered)
    lambdaCommands = await Promise.all(lambdasFiltered.map(lambda => {
      let lambdaCommand = new PutFunctionConcurrencyCommand({ FunctionName: lambda, ReservedConcurrentExecutions: 0 })
      return  lambdaClient.send(lambdaCommand)
    }))
    console.log(lambdaCommands)
  }
  catch (e){
    console.log(e)
  }

  return
}

