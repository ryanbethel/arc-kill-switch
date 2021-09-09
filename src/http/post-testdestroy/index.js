const destroy = require('@architect/destroy')

exports.handler = async function http (req) {
  try {
    console.log(process.env.AWS_ACCESS_KEY_ID)
    await destroy({ force: true, env: 'staging', appname: 'user-project', stackname: 'killtest' })
  }
  catch (e){
    console.log(e)
  }

  return {
    statusCode: 200,
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Architect</title>
</head>
<body>
      <div>
        <h1>
          Hello
        </h1>
      </div>
</body>
</html>
`
  }
}
