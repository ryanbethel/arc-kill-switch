@app
arc-kill-switch

@http
get /
post /x1000

@macros
kill-switch

@kill-switch
limit $0.01

@events
wait-a-while

@scheduled
do-regularly rate(1 minute)

@tables
data
  scopeID *String
  dataID **String
  ttl TTL

@aws
region us-east-1
profile begin-examples
