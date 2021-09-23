@app
arc-budget-two

@http
get /

@macros
budget-watch

@budget
limit $40


@tables
data
  scopeID *String
  dataID **String
  ttl TTL

@aws
region us-east-1
profile begin-examples
