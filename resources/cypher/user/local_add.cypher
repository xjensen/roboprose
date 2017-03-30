MATCH (user:User)
WHERE user.id = {user_id}
WITH user
LIMIT 1
CREATE
(user)<-[:Authenticates]-(auth:Authentication { username: {username}, password: {password}, method: "local" })
RETURN
user.id as id,
user.name as name,
auth.username as username,
auth.method as method
