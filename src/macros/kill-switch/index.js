let { toLogicalID } = require('@architect/utils')
let path = require('path')


module.exports = function costDetection (arc, cfn) {

  let killSwitch = arc.macros.includes('kill-switch')

  if (killSwitch) {

    let rule = 'rate(8 hours)'
    let name = toLogicalID('kill-switch')
    let scheduleLambda = `${name}ScheduledLambda`
    let scheduleEvent = `${name}ScheduledEvent`
    let schedulePermission = `${name}ScheduledPermission`
    let appName = toLogicalID(arc.app[0])
    let src = path.resolve(__dirname, './src')




    let Variables = {
      ARC_APP_NAME: appName,
      ARC_CLOUDFORMATION: { Ref: 'AWS::StackName' },
      ARC_ENV: 'staging', // Always default to staging; mutate to production via macro where necessary
      ARC_HTTP: 'aws_proxy', // used for feature detection (could be 'aws' for vtl style)
      ARC_ROLE: { Ref: 'Role' },
      NODE_ENV: 'staging', // Same as above, always default to staging; userland may mutate
      SESSION_TABLE_NAME: 'jwe',
      KILL_SWITCH_LIMIT: arc['kill-switch'] && arc['kill-switch'][0] === 'limit' ? arc['kill-switch'][0].replace('$', '').toNumber() : 10,
      COST_CATEGORY: { Ref: 'StackCostCategory' }
    }

    // Add Lambda resources
    cfn.Resources[scheduleLambda] = {
      Type: 'AWS::Serverless::Function',
      Properties: {
        Handler: 'index.handler',
        CodeUri: src,
        Runtime: 'nodejs14.x',
        MemorySize: 1152,
        Timeout: 5,
        Environment: { Variables },
        // Role: {
        //   'Fn::Sub': [
        //     'arn:aws:iam::${AWS::AccountId}:role/${roleName}',
        //     { roleName: { Ref: 'Role' } }
        //   ]
        // },
        Policies: [
          { 'Statement': [ {
            'Effect': 'Allow',
            'Action': [
              'ce:GetCostAndUsage',
              'ce:GetDimensionValues',
              'ce:GetReservationCoverage',
              'ce:GetReservationPurchaseRecommendation',
              'ce:GetReservationUtilization',
              'ce:GetTags',
              'cloudformation:*',
              'lambda:PutFunctionConcurrency',
              'tag:*'
            ],
            'Resource': '*'
          } ]
          } ]
      }
    }


    // Create the scheduled event rule
    cfn.Resources[scheduleEvent] = {
      Type: 'AWS::Events::Rule',
      Properties: {
        ScheduleExpression: rule,
        Targets: [
          {
            Arn: { 'Fn::GetAtt': [ scheduleLambda, 'Arn' ] },
            Id: scheduleLambda
          }
        ]
      }
    }

    // Wire the permission
    cfn.Resources[schedulePermission] = {
      Type: 'AWS::Lambda::Permission',
      Properties: {
        Action: 'lambda:InvokeFunction',
        FunctionName: { Ref: scheduleLambda },
        Principal: 'events.amazonaws.com',
        SourceArn: { 'Fn::GetAtt': [ scheduleEvent, 'Arn' ] }
      }
    }


    cfn.Resources['StackCostCategory'] = {
      Type: 'AWS::CE::CostCategory',
      Properties: {
        Name: { 'Fn::Sub': '${AWS::StackName}Cost' },
        RuleVersion: 'CostCategoryExpression.v1',
        Rules: { 'Fn::Sub': '[ {"Value": "StackResources", "Rule": { "Tags": { "Key": "aws:cloudformation:stack-name", "Values": ["${AWS::StackName}"] } } } ]' }
      }
    }


    // cfn.Resources.Role.Properties.Policies.push( {
    //  'PolicyName': 'KillSwitchSpecialPolicy',
    //  'PolicyDocument': {
    //    'Statement': [
    //      {
    //        'Effect': 'Allow',
    //        'Action': [
    //          'ce:*'
    //        ],
    //        //'Resource': { 'Ref': scheduleLambda }

    //        "Resource": "arn:aws:logs:*:*:*"
    //      }
    //    ]
    //  }
    // })
    // console.log(cfn.Resources.Role.Properties.Policies)
  }
  return cfn
}
