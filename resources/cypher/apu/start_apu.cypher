MATCH (n)
WHERE n.id = {location_id}
WITH n
LIMIT 1
OPTIONAL MATCH (n)-[:in_Chapter]->(possible_chapter)
WITH n, CASE
	WHEN 'Chapter' in labels(n) THEN n
	ELSE possible_chapter
END as chapter
OPTIONAL MATCH (book)<-[:in_Book]-(chapter)
WITH n, CASE
	WHEN 'Book' in labels(n) THEN n
	ELSE book
END as apu
OPTIONAL MATCH
(apu)-[:Branch]->(child)
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

MATCH (n)
WHERE n.id = {location_id}
WITH n
LIMIT 1
OPTIONAL MATCH (n)-[:in_Chapter]->(possible_chapter)
WITH CASE
	WHEN 'Chapter' in labels(n) THEN n
	ELSE possible_chapter
END as apu
MATCH (parent)-[branch:Branch]->(apu)<-[:Author]-(user)
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

UNION

MATCH (n)
WHERE n.id = {location_id}
WITH n
LIMIT 1
OPTIONAL MATCH path = ()-[:Branch*0..60]->(n)
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
