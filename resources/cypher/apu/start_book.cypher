MATCH (book:Book)
WHERE book.id = {book_id}
WITH book as apu
LIMIT 1
OPTIONAL MATCH (apu)-[:Branch]->(child)
RETURN
collect(child.id) as children,
[] as siblings,
null as parent_id,
labels(apu) as labels,
apu.title as title,
apu.timestamp as timestamp,
null as number,
null as position,
null as char_count,
null as content,
apu.id as id,
null as user_name,
null as user_id

UNION

MATCH (book:Book)
WHERE book.id = {book_id}
WITH book as parent
LIMIT 1
MATCH (parent)-[branch:Branch]->(apu:Chapter)<-[:Author]-(user:User)
WITH parent, apu, user, branch
OPTIONAL MATCH
(parent)-[:Branch]->(sibling)
WITH parent, apu, user, branch, filter(x IN collect(sibling.id) WHERE NOT x = apu.id) as siblings
OPTIONAL MATCH
(apu)-[:Branch]->(child)
RETURN
collect(child.id) as children,
siblings as siblings,
parent.id as parent_id,
labels(apu) as labels,
apu.title as title,
apu.timestamp as timestamp,
apu.number as number,
apu.position as position,
apu.char_count as char_count,
apu.content as content,
apu.id as id,
user.name as user_name,
user.id as user_id
