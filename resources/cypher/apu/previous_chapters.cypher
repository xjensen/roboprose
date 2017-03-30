MATCH (location)
WHERE location.id = {location_id}
WITH location
LIMIT 1
OPTIONAL MATCH (location)-[:in_Chapter]->(possible_chapter)
WITH CASE
	WHEN 'Chapter' in labels(location) THEN location
	ELSE possible_chapter
END as current_chapter
MATCH path = (current_chapter)-[:previous_Chapter*0..]->()
WITH path, max(length(path)) as length
ORDER BY length DESC
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
