@app
arc-kill-switch

@macros
dns

@cdn
false # important; if we don't have this the deploy script will disable

@http
get /healthcheck
post /testdestroy
post /testsoftkill

@proxy
testing http://localhost:4000
staging https://4bhecjec2m.execute-api.us-east-1.amazonaws.com
production https://4bhecjec2m.execute-api.us-east-1.amazonaws.com

@dns
http
  staging staging.explorebegin.com
  production explorebegin.com

@aws
region us-east-1
profile begin-examples
