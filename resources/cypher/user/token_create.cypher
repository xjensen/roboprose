CREATE
(user:User { name: {name}, id: {id_1} })
<-[:Authenticates]-
(auth:Authentication { token: {token}, method: "token" })
RETURN
user.id as id,
user.name as name,
auth.token as token,
auth.method as method
