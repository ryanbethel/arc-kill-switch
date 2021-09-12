@app
arc-kill-switch

@http
get /

@macros
kill-switch

@kill-switch
limit $1

@events
an-event

@tables
data
  scopeID *String
  dataID **String
  ttl TTL

@aws
region us-east-1
profile default
