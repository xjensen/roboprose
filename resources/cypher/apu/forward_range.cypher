MATCH (n), (o)
WHERE n.id = {parent_id} AND o.id = {child_id}
WITH n, o
LIMIT 1
MATCH path = (n)-[:Branch*]->(o)
WITH path
LIMIT 1
WITH extract(x IN nodes(path) | ID(x)) as contents
OPTIONAL MATCH (parent)-[branch:Branch]->(apu)<-[:Author]-(user)
WHERE ID(apu) in contents
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
ORDER BY apu.position
