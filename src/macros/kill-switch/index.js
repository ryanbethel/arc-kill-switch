let { toLogicalID } = require('@architect/utils')
let path = require('path')


module.exports = function costDetection (arc, cfn) {

  let killSwitch = arc['kill-switch']

  if (killSwitch) {

    let name = toLogicalID('kill-switch')
    let appName = toLogicalID(arc.app[0])
    let src = path.resolve(__dirname, './src')
    let costLimit = killSwitch && killSwitch[0][0] === 'limit' ? Number(killSwitch[0][1].replace('$', '')) : 100
    let eventLambda = `${name}EventLambda`
    let eventEvent = `${name}Event`
    let eventTopic = `${name}EventTopic`

    let Variables = {
      ARC_APP_NAME: appName,
      ARC_CLOUDFORMATION: { Ref: 'AWS::StackName' },
      ARC_ENV: 'staging', // Always default to staging; mutate to production via macro where necessary
      ARC_HTTP: 'aws_proxy', // used for feature detection (could be 'aws' for vtl style)
      ARC_ROLE: { Ref: 'Role' },
      NODE_ENV: 'staging', // Same as above, always default to staging; userland may mutate
      SESSION_TABLE_NAME: 'jwe',
      COST_LAMBDA: eventLambda
    }

    // Create the Lambda
    cfn.Resources[eventLambda] = {
      Type: 'AWS::Serverless::Function',
      Properties: {
        Handler: 'index.handler',
        CodeUri: src,
        Runtime: 'nodejs14.x',
        MemorySize: 1152,
        Timeout: 30,
        Environment: { Variables },
        Policies: [
          { Statement: [ {
            Effect: 'Allow',
            Action: [
              'lambda:PutFunctionConcurrency',
              'tag:*'
            ],
            Resource: '*'
          } ]
          } ],
        Events: {
          [eventEvent]: {
            Type: 'SNS',
            Properties: {
              Topic: { Ref: eventTopic }
            }
          }
        }
      }
    }

    // Create the SNS topic
    cfn.Resources[eventTopic] = {
      Type: 'AWS::SNS::Topic',
      Properties: {
        DisplayName: name,
        Subscription: []
      }
    }

    // Create the Budget to trigger kill switch
    cfn.Resources['StackBudget'] = {
      Type: 'AWS::Budgets::Budget',
      Properties: {
        Budget: {
          BudgetLimit: {
            Amount: costLimit,
            Unit: 'USD'
          },
          TimeUnit: 'MONTHLY',
          BudgetType: 'COST',
          CostFilters: {
            // the format for value is <TagKey>$<TagValue> first $ is literal, second is replaced
            TagKeyValue: [ { 'Fn::Sub': 'aws:cloudformation:stack-name$${AWS::StackName}' } ]
          }
        },
        NotificationsWithSubscribers: [
          {
            Subscribers: [
              {
                SubscriptionType: 'SNS',
                Address: {
                  Ref: eventTopic
                }
              }
            ],
            Notification: {
              ComparisonOperator: 'GREATER_THAN',
              NotificationType: 'FORECASTED',
              // NotificationType: 'ACTUAL',
              Threshold: 100,
              ThresholdType: 'PERCENTAGE'
            }
          }
        ]
      }
    }

  }
  return cfn
}
