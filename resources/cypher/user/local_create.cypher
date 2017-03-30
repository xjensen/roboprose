CREATE
(user:User { name: {name}, id: {id_1} })
<-[:Authenticates]-
(auth:Authentication { username: {username}, password: {password}, method: "local" })
RETURN
user.id as id,
user.name as name,
auth.username as username,
auth.method as method
