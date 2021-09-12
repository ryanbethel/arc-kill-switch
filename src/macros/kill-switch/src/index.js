let { CostExplorerClient, GetCostAndUsageCommand, GetCostCategoriesCommand } = require('@aws-sdk/client-cost-explorer')
let { CloudFormationClient, DescribeStackResourcesCommand,  ListStackResourcesCommand } = require('@aws-sdk/client-cloudformation')
const { LambdaClient, PutFunctionConcurrencyCommand } = require('@aws-sdk/client-lambda') // CommonJS import
const { ResourceGroupsTaggingAPIClient, GetResourcesCommand } = require('@aws-sdk/client-resource-groups-tagging-api') // CommonJS import
// let begin = require('@begin/data')

let costLimit = process.env.KILL_SWITCH_LIMIT
let costCategory = process.env.COST_CATEGORY
let costConfig = {}
let costInput = {
  Granularity: 'MONTHLY',
  Filter: {
    CostCategories: {
      Key: 'CostCategory',
      MatchOptions: [ 'EQUALS' ],
      // Values: [ costCategory ]
      Values: [ 'ArcKillSwitchStagingCost' ]
    } },
  Metrics: [ 'AmortizedCost', 'BlendedCost' ],
  TimePeriod: {
    Start: '2021-09-01',
    End: '2021-09-30',
  }
}

const resourceConfig = { region: 'us-east-1' }
const resourceInput = { 'ResourceTypeFilters': [ 'lambda' ], 'TagFilters': [ { 'Key': 'aws:cloudformation:stack-name', 'Values': [ 'ArcKillSwitchStaging' ] } ] }

const resourceClient = new ResourceGroupsTaggingAPIClient(resourceConfig)
const resourceCommand = new GetResourcesCommand(resourceInput)

let lambdaClient = new LambdaClient({ region: 'us-east-1' })
const lambdaCommand = new PutFunctionConcurrencyCommand({ FunctionName: 'arn:aws:lambda:us-east-1:619631856276:function:ArcKillSwitchStaging-AnEventEventLambda-jXGIxEc2XFPk', ReservedConcurrentExecutions: 0 })

// let costClient = new CostExplorerClient(costConfig)
// let costCommand = new GetCostAndUsageCommand(costInput)

// let cfnConfig = { region: 'us-east-1' }
// let cfnInput = { StackName: 'ArcKillSwitchStaging' }
// let cfnClient = new CloudFormationClient(cfnConfig)
// let cfnCommand = new ListStackResourcesCommand(cfnInput)

// let catCommand = new GetCostCategoriesCommand(catInput);
// let response = await client.send(command)



exports.handler =  async function handler (event) {

  console.log(JSON.stringify(event, null, 2))

  // let costResponse  = await costClient.send(costCommand)
  //  console.log(costResponse.ResultsByTime[0])

  // let response = await cfnClient.send(cfnCommand)

  let  response = await resourceClient.send(resourceCommand)
  let lambdaResponse = await lambdaClient.send(lambdaCommand)
  console.log(response)

  return
}

