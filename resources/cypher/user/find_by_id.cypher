MATCH (user:User { id: {user_id} }) 
RETURN
user.name as name, 
user.id as id