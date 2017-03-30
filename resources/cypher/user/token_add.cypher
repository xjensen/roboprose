MATCH (user:User)
WHERE user.id = {user_id}
WITH user
LIMIT 1
CREATE
(user)<-[:Authenticates]-(auth:Authentication { token: {token}, method: "token" })
RETURN
user.id as id,
user.name as name,
auth.token as token,
auth.method as method
