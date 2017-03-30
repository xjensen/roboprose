MATCH (user:User)
WHERE user.id = {id}
WITH user
LIMIT 1
SET user.name = {name}
RETURN
user.name as name,
user.id as id
