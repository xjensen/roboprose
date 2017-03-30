MATCH (auth:Authentication { username: { username }, method: "local" })
WHERE auth.username = {username}
WITH auth
LIMIT 1
Match
(user:User)<-[:Authenticates]-(auth)
RETURN
user.id as id,
user.name as name,
auth.username as username,
auth.method as method
