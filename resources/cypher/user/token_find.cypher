MATCH (auth:Authentication { token: { token }, method: "token" })
WHERE auth.token = {token}
WITH auth
LIMIT 1
Match
(user:User)<-[:Authenticates]-(auth)
RETURN
user.id as id,
user.name as name,
auth.token as token,
auth.method as method
